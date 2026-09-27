import { userAuth } from './auth'
import { userFilterSelection, maxNumberOfGroupsInFilter } from './constants'
import { userSchemas } from './schemas'
import { getMembershipFilter } from './membershipFilter'
import { cursorPageingSelection } from '@/lib/paging/cursorPageingSelection'
import { hashAndEncryptPassword } from '@/server/auth/password'
import { defineOperation } from '@/server/serviceOperation'
import { ServerError } from '@/services/error'
import { z } from 'zod'
import type { UserFiltered, UserPagingReturn } from './types'

/**
 * Ported from projectNext's src/services/users/operations.ts.
 *
 * Nine of its fourteen operations. The five left out each reach outside the domain:
 * connectStudentCard and registerNewEmail (student cards, mail verification), register (the
 * terms-acceptance flow), readUserWithBalance (the ledger), updateProfileImage (the image
 * pipeline).
 */
export const userOperations = {
    create: defineOperation({
        dataSchema: userSchemas.create,
        authorizer: () => userAuth.create.dynamicFields({}),
        operation: async ({ prisma, data }): Promise<UserFiltered> => await prisma.user.create({
            data,
            select: userFilterSelection,
        }),
    }),

    read: defineOperation({
        paramsSchema: z.object({ id: z.number() }),
        authorizer: ({ params }) => userAuth.read.dynamicFields({ id: params.id }),
        operation: async ({ prisma, params }): Promise<UserFiltered> =>
            await prisma.user.findUniqueOrThrow({
                where: { id: params.id },
                select: userFilterSelection,
            }),
    }),

    readOrNull: defineOperation({
        paramsSchema: z.object({ id: z.number() }),
        authorizer: ({ params }) => userAuth.readOrNull.dynamicFields({ id: params.id }),
        operation: async ({ prisma, params }): Promise<UserFiltered | null> =>
            await prisma.user.findUnique({
                where: { id: params.id },
                select: userFilterSelection,
            }),
    }),

    /**
     * The public-facing read, by username. Anyone who may read a profile sees the same fields -
     * the authorizer decides whether they may look, not which columns come back.
     */
    readProfile: defineOperation({
        paramsSchema: z.object({ username: z.string() }),
        authorizer: ({ params }) => userAuth.readProfile.dynamicFields({ username: params.username }),
        operation: async ({ prisma, params }) => await prisma.user.findUniqueOrThrow({
            where: { username: params.username },
            select: {
                ...userFilterSelection,
                memberships: {
                    where: { active: true },
                    select: {
                        groupId: true,
                        admin: true,
                        title: true,
                        order: true,
                        group: { select: { name: true } },
                    },
                    orderBy: { groupId: 'asc' },
                },
            },
        }),
    }),

    readPage: defineOperation({
        paramsSchema: userSchemas.readPage,
        authorizer: () => userAuth.readPage.dynamicFields({}),
        operation: async ({ prisma, params }): Promise<UserPagingReturn[]> => {
            const { page, details } = params.paging

            if (details.groups.length > maxNumberOfGroupsInFilter) {
                throw new ServerError('BAD PARAMETERS', 'For mange grupper i filteret')
            }

            const words = details.partOfName.split(' ').filter(word => word.length > 0)
            const sortDirection = details.sort?.direction ?? 'asc'

            // Ordering must end in a unique column. Sorting rows by fields that share a value is
            // undefined behaviour in Postgres, and cursor paging would then skip or repeat rows.
            const orderBy = details.sort?.field === 'username'
                ? [{ username: sortDirection }]
                : [
                    { lastname: sortDirection },
                    { firstname: sortDirection },
                    { username: sortDirection },
                ]

            const groups = [
                ...details.groups,
                ...(details.selectedGroup ? [details.selectedGroup] : []),
            ]

            const users = await prisma.user.findMany({
                ...cursorPageingSelection(page),
                select: {
                    ...userFilterSelection,
                    memberships: {
                        where: getMembershipFilter('ACTIVE'),
                        select: {
                            groupId: true,
                            admin: true,
                            title: true,
                            group: { select: { name: true } },
                        },
                    },
                },
                where: {
                    archived: false,
                    AND: [
                        // Every word but the last must match a field exactly; the last is treated
                        // as a prefix, so typing continues to narrow rather than suddenly failing.
                        ...words.map((word, index) => {
                            const condition = {
                                [index === words.length - 1 ? 'contains' : 'equals']: word,
                                mode: 'insensitive',
                            } as const
                            return {
                                OR: [
                                    { firstname: condition },
                                    { lastname: condition },
                                    { username: condition },
                                ],
                            }
                        }),
                        ...groups.map(group => ({
                            memberships: {
                                some: getMembershipFilter(group.groupOrder, group.groupId),
                            },
                        })),
                    ],
                },
                orderBy,
            })

            return users.map(user => ({
                ...user,
                selectedGroupInfo: {
                    title: user.memberships.find(
                        membership => membership.groupId === details.selectedGroup?.groupId
                    )?.title,
                    admin: user.memberships.find(
                        membership => membership.groupId === details.selectedGroup?.groupId
                    )?.admin,
                },
            }))
        },
    }),

    update: defineOperation({
        paramsSchema: z.object({ id: z.number() }),
        dataSchema: userSchemas.update,
        authorizer: () => userAuth.update.dynamicFields({}),
        operation: async ({ prisma, params, data }): Promise<UserFiltered> =>
            await prisma.user.update({
                where: { id: params.id },
                data,
                select: userFilterSelection,
            }),
    }),

    /**
     * The self-service half of update: the fields a user may change about themselves, with an
     * authorizer keyed on username rather than a blanket permission.
     */
    updateProfile: defineOperation({
        paramsSchema: z.object({ username: z.string() }),
        dataSchema: userSchemas.updateProfile,
        authorizer: ({ params }) => userAuth.updateProfile.dynamicFields({ username: params.username }),
        operation: async ({ prisma, params, data }): Promise<UserFiltered> =>
            await prisma.user.update({
                where: { username: params.username },
                data,
                select: userFilterSelection,
            }),
    }),

    updatePassword: defineOperation({
        paramsSchema: z.object({ id: z.number() }),
        dataSchema: userSchemas.updatePassword,
        authorizer: ({ params }) => userAuth.updatePassword.dynamicFields({ userId: params.id }),
        opensTransaction: true,
        operation: async ({ prisma, params, data }): Promise<null> => {
            const passwordHash = await hashAndEncryptPassword(data.password)

            await prisma.$transaction(async transaction => {
                await transaction.credentials.upsert({
                    where: { userId: params.id },
                    create: {
                        user: { connect: { id: params.id } },
                        passwordHash,
                    },
                    update: { passwordHash },
                })

                // Changing a password ends every other session. This is the concrete payoff of
                // Decision 2: with a JWT there is nothing server-side to revoke, so an already
                // issued token stays valid until it expires.
                await transaction.authSession.deleteMany({ where: { userId: params.id } })
            })

            return null
        },
    }),

    /**
     * projectNext deletes the row. svele archives instead: the user has quotes, registrations and
     * memberships pointing at them, and an archived user is already excluded from the list, from
     * login and from session resolution.
     */
    destroy: defineOperation({
        paramsSchema: z.object({ id: z.number() }),
        authorizer: () => userAuth.destroy.dynamicFields({}),
        opensTransaction: true,
        operation: async ({ prisma, params }): Promise<null> => {
            await prisma.$transaction(async transaction => {
                await transaction.user.update({
                    where: { id: params.id },
                    data: { archived: true },
                })
                await transaction.authSession.deleteMany({ where: { userId: params.id } })
            })
            return null
        },
    }),
} as const
