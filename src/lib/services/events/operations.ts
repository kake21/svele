import { eventAuth } from './auth'
import { eventFilterSelection } from './constants'
import { eventSchemas } from './schemas'
import { cursorPageingSelection } from '@/lib/paging/cursorPageingSelection'
import { defineOperation } from '@/server/serviceOperation'
import { z } from 'zod'
import type { Prisma } from '../../../../generated/prisma/client.js'
import type { EventExpanded } from './types'

/**
 * Ported from projectNext's src/services/events/operations.ts.
 *
 * Dropped with the CMS and image pipeline (Decision 1): updateCmsCoverImage and
 * updateParagraphContent, which existed only to edit the two required relations svele replaced
 * with plain columns.
 */
function eventTagSelector(tags: string[] | null) {
    if (!tags || tags.length === 0) return undefined
    return { some: { tag: { name: { in: tags } } } }
}

type EventRow = {
    _count: { eventRegistrations: number },
    places: number,
    eventTagEvents: { tag: Prisma.EventTagGetPayload<object> }[],
}

/**
 * projectNext computes these two in every read rather than storing them. Registrations beyond
 * `places` are on the waiting list, and neither number is a column.
 */
function expand<T extends EventRow>(event: T) {
    const { eventTagEvents, _count, ...rest } = event
    return {
        ...rest,
        numOfRegistrations: Math.min(_count.eventRegistrations, event.places),
        numOnWaitingList: Math.max(0, _count.eventRegistrations - event.places),
        tags: eventTagEvents.map(link => link.tag),
    }
}

const withTags = {
    ...eventFilterSelection,
    eventTagEvents: { select: { tag: true } },
} as const

export const eventOperations = {
    create: defineOperation({
        dataSchema: eventSchemas.create,
        authorizer: () => eventAuth.create.dynamicFields({}),
        operation: async ({ prisma, data, session }) => {
            const { tagIds, coverImageUrl, registrationStart, registrationEnd, ...rest } = data

            return await prisma.event.create({
                data: {
                    ...rest,
                    coverImageUrl: coverImageUrl || null,
                    // projectNext's defaults: registration opens now and closes in a day unless
                    // told otherwise.
                    registrationStart: registrationStart ?? new Date(),
                    registrationEnd: registrationEnd ?? new Date(Date.now() + 24 * 60 * 60 * 1000),
                    createdBy: session.user ? { connect: { id: session.user.id } } : undefined,
                    eventTagEvents: tagIds?.length
                        ? { create: tagIds.map(tagId => ({ tagId })) }
                        : undefined,
                },
                select: eventFilterSelection,
            })
        },
    }),

    read: defineOperation({
        paramsSchema: z.object({ id: z.number() }),
        authorizer: () => eventAuth.read.dynamicFields({}),
        operation: async ({ prisma, params }): Promise<EventExpanded> => expand(
            await prisma.event.findUniqueOrThrow({
                where: { id: params.id },
                select: withTags,
            })
        ),
    }),

    readManyCurrent: defineOperation({
        paramsSchema: z.object({ tags: z.array(z.string()).nullable() }),
        authorizer: () => eventAuth.readManyCurrent.dynamicFields({}),
        operation: async ({ prisma, params }): Promise<EventExpanded[]> => {
            const events = await prisma.event.findMany({
                select: withTags,
                where: {
                    eventEnd: { gte: new Date() },
                    eventTagEvents: eventTagSelector(params.tags),
                },
                orderBy: { eventStart: 'asc' },
            })
            return events.map(expand)
        },
    }),

    readManyArchivedPage: defineOperation({
        paramsSchema: eventSchemas.readManyArchivedPage,
        authorizer: () => eventAuth.readManyArchivedPage.dynamicFields({}),
        operation: async ({ prisma, params }): Promise<EventExpanded[]> => {
            const events = await prisma.event.findMany({
                ...cursorPageingSelection(params.paging.page),
                where: {
                    eventEnd: { lt: new Date() },
                    name: params.paging.details.name
                        ? { contains: params.paging.details.name, mode: 'insensitive' }
                        : undefined,
                    eventTagEvents: eventTagSelector(params.paging.details.tags),
                },
                select: withTags,
                orderBy: { eventStart: 'desc' },
            })
            return events.map(expand)
        },
    }),

    update: defineOperation({
        paramsSchema: z.object({ id: z.number() }),
        dataSchema: eventSchemas.update,
        authorizer: () => eventAuth.update.dynamicFields({}),
        opensTransaction: true,
        operation: async ({ prisma, params, data }) => {
            const { tagIds, coverImageUrl, ...rest } = data

            return await prisma.$transaction(async transaction => {
                // Tags are a join table, so "set these tags" is a replace, not an update.
                if (tagIds) {
                    await transaction.eventTagEvent.deleteMany({ where: { eventId: params.id } })
                    if (tagIds.length > 0) {
                        await transaction.eventTagEvent.createMany({
                            data: tagIds.map(tagId => ({ eventId: params.id, tagId })),
                        })
                    }
                }

                return await transaction.event.update({
                    where: { id: params.id },
                    data: {
                        ...rest,
                        ...(coverImageUrl === undefined ? {} : { coverImageUrl: coverImageUrl || null }),
                    },
                    select: eventFilterSelection,
                })
            })
        },
    }),

    destroy: defineOperation({
        paramsSchema: z.object({ id: z.number() }),
        authorizer: () => eventAuth.destroy.dynamicFields({}),
        operation: async ({ prisma, params }): Promise<null> => {
            await prisma.event.delete({ where: { id: params.id } })
            return null
        },
    }),
} as const
