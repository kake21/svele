import { groupAuth } from './auth'
import { defineOperation } from '@/server/serviceOperation'

/**
 * Only what the user list's group filter needs. projectNext's groups service is far larger,
 * because it owns six group subtypes; svele models one.
 */
export const groupOperations = {
    readAll: defineOperation({
        authorizer: () => groupAuth.readAll.dynamicFields({}),
        operation: async ({ prisma }) => await prisma.group.findMany({
            select: {
                id: true,
                name: true,
                order: true,
                _count: { select: { memberships: { where: { active: true } } } },
            },
            orderBy: { name: 'asc' },
        }),
    }),
} as const
