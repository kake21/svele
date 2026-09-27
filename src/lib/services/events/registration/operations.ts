import { eventRegistrationAuth } from './auth'
import { eventRegistrationSchemas } from './schemas'
import { defineOperation } from '@/server/serviceOperation'
import { Smorekopp } from '@/services/error'
import { userFilterSelection } from '@/services/users/constants'
import { z } from 'zod'
import type { Prisma } from '../../../../../generated/prisma/client.js'

/**
 * Ported from projectNext's src/services/events/registration/operations.ts.
 *
 * Decision 3: the three side effects are dropped - dot punishment (which pulls in the dots domain
 * and its freeze periods, and is the only reason projectNext needs defineSubOperation here),
 * notifications, and the confirmation email. What is kept is the part worth porting: the
 * transaction and the waiting-list arithmetic.
 */

/**
 * Serialises registrations for one event.
 *
 * projectNext relies on pre-check, insert, re-count. Under Postgres' default READ COMMITTED that
 * is not enough: concurrent transactions cannot see each other's uncommitted rows, so each one
 * counts itself as within capacity and the event overbooks. tests/phase3.ts reproduced it - five
 * simultaneous registrations for two places produced four rows.
 *
 * Taking a row lock on the Event first makes registrations for the same event queue up, while
 * different events still proceed in parallel. Cheaper than SERIALIZABLE, which would abort the
 * losers and need retry logic around every call site.
 */
async function lockEvent(prisma: Prisma.TransactionClient, eventId: number): Promise<void> {
    await prisma.$queryRaw`SELECT id FROM "Event" WHERE id = ${eventId} FOR UPDATE`
}

async function preValidateRegistration(
    prisma: Prisma.TransactionClient,
    eventId: number,
    isAdmin: boolean
) {
    await lockEvent(prisma, eventId)

    const event = await prisma.event.findUniqueOrThrow({
        where: { id: eventId },
        include: { _count: { select: { eventRegistrations: true } } },
    })

    if (!event.takesRegistration) {
        throw new Smorekopp('BAD PARAMETERS', 'Dette arrangementet tar ikke påmelding')
    }
    // Admins register on behalf of others, and are not bound by the window.
    if (event.registrationStart > new Date() && !isAdmin) {
        throw new Smorekopp('BAD PARAMETERS', 'Påmeldingen har ikke åpnet ennå')
    }
    if (event.registrationEnd < new Date() && !isAdmin) {
        throw new Smorekopp('BAD PARAMETERS', 'Påmeldingen er stengt')
    }
    if (event.places <= event._count.eventRegistrations && !event.waitingList) {
        throw new Smorekopp('BAD PARAMETERS', 'Arrangementet er fullt')
    }

    return event
}

/**
 * The concurrency-safe half, and the reason registration opens a transaction.
 *
 * The pre-check can pass for two simultaneous registrations on the last place. So the row is
 * inserted first, then counted back: `id <= mine` gives this registration's position in the queue
 * deterministically, whatever order the inserts interleaved in. If that position is past the end
 * and there is no waiting list, the row is deleted again and the caller told the event is full.
 */
async function postValidateRegistration(
    prisma: Prisma.TransactionClient,
    registrationId: number,
    eventId: number
) {
    const event = await prisma.event.findUniqueOrThrow({
        where: { id: eventId },
        select: {
            waitingList: true,
            places: true,
            _count: {
                select: { eventRegistrations: { where: { id: { lte: registrationId } } } },
            },
        },
    })

    if (event.places < event._count.eventRegistrations && !event.waitingList) {
        await prisma.eventRegistration.delete({ where: { id: registrationId } })
        throw new Smorekopp('BAD PARAMETERS', 'Arrangementet er fullt')
    }

    return event
}

export const eventRegistrationOperations = {
    create: defineOperation({
        paramsSchema: z.object({
            userId: z.number().min(0),
            eventId: z.number().min(0),
        }),
        authorizer: ({ params }) => eventRegistrationAuth.create.dynamicFields({
            userId: params.userId,
        }),
        opensTransaction: true,
        operation: async ({ prisma, params, session }) => {
            const isAdmin = session.permissions.includes('EVENT_ADMIN')

            return await prisma.$transaction(async transaction => {
                await preValidateRegistration(transaction, params.eventId, isAdmin)

                const registration = await transaction.eventRegistration.create({
                    data: {
                        user: { connect: { id: params.userId } },
                        event: { connect: { id: params.eventId } },
                    },
                })

                const event = await postValidateRegistration(
                    transaction, registration.id, params.eventId
                )

                return {
                    registration,
                    onWaitingList: event.places < event._count.eventRegistrations,
                }
            })
        },
    }),

    /**
     * Registering someone without an account. projectNext calls this createGuest and guards it
     * with EVENT_ADMIN.
     */
    createGuest: defineOperation({
        paramsSchema: z.object({ eventId: z.number().min(0) }),
        dataSchema: eventRegistrationSchemas.createGuest,
        authorizer: () => eventRegistrationAuth.createGuest.dynamicFields({}),
        opensTransaction: true,
        operation: async ({ prisma, params, data }) => await prisma.$transaction(async transaction => {
            await preValidateRegistration(transaction, params.eventId, true)

            const registration = await transaction.eventRegistration.create({
                data: {
                    event: { connect: { id: params.eventId } },
                    contact: {
                        create: {
                            name: data.name,
                            email: data.email || null,
                            mobile: data.mobile || null,
                        },
                    },
                },
            })

            const event = await postValidateRegistration(
                transaction, registration.id, params.eventId
            )

            return {
                registration,
                onWaitingList: event.places < event._count.eventRegistrations,
            }
        }),
    }),

    readMany: defineOperation({
        paramsSchema: z.object({ eventId: z.number() }),
        authorizer: () => eventRegistrationAuth.readMany.dynamicFields({}),
        operation: async ({ prisma, params }) => await prisma.eventRegistration.findMany({
            where: { eventId: params.eventId },
            select: {
                id: true,
                createdAt: true,
                note: true,
                user: { select: userFilterSelection },
                contact: { select: { name: true, email: true, mobile: true } },
            },
            // Insertion order is queue order - the same ordering postValidateRegistration counts on.
            orderBy: { id: 'asc' },
        }),
    }),

    destroy: defineOperation({
        paramsSchema: z.object({
            eventId: z.number(),
            userId: z.number(),
        }),
        authorizer: ({ params }) => eventRegistrationAuth.destroy.dynamicFields({
            userId: params.userId,
        }),
        operation: async ({ prisma, params }): Promise<null> => {
            await prisma.eventRegistration.deleteMany({
                where: { eventId: params.eventId, userId: params.userId },
            })
            return null
        },
    }),
} as const
