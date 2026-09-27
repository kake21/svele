import { permissionAuth } from './auth'
import { defineOperation } from '@/server/serviceOperation'
import { z } from 'zod'
import type { Permission } from '../../../../generated/prisma/client.js'

/**
 * Ported from projectNext's src/services/permissions/operations.ts - only the two reads the
 * session needs.
 *
 * projectNext declares readPermissionsOfUser with defineSubOperation, which exists so an
 * implementing service can supply its own authorizer. It is never used that way: the only call
 * site in the entire codebase is `readPermissionsOfUser.internalCall(...)` from authOptions.ts.
 * So svele defines it as a plain operation guarded by RequireNothing, reached the same way -
 * which is the reason svele's serviceOperation.ts needed no sub-operation machinery for this port.
 */
export const permissionOperations = {
    readDefaultPermissions: defineOperation({
        authorizer: () => permissionAuth.readDefaultPermissions.dynamicFields({}),
        operation: async ({ prisma }): Promise<Permission[]> => {
            const defaults = await prisma.defaultPermission.findMany({
                select: { permission: true },
            })
            return defaults.map(entry => entry.permission)
        },
    }),

    /**
     * A user's permissions are the defaults plus every permission granted by a group they hold an
     * ACTIVE membership in. Inactive memberships grant nothing.
     */
    readPermissionsOfUser: defineOperation({
        paramsSchema: z.object({
            userId: z.number(),
        }),
        authorizer: () => permissionAuth.readPermissionsOfUser.dynamicFields({}),
        operation: async ({ prisma, params }): Promise<Permission[]> => {
            const [defaultPermissions, groupPermissions] = await Promise.all([
                permissionOperations.readDefaultPermissions.internalCall({}),
                prisma.membership.findMany({
                    where: {
                        userId: params.userId,
                        active: true,
                    },
                    select: {
                        group: {
                            select: { permissions: { select: { permission: true } } },
                        },
                    },
                }),
            ])

            const fromGroups = groupPermissions.flatMap(membership =>
                membership.group.permissions.map(entry => entry.permission))

            const all = defaultPermissions.concat(fromGroups)
            return all.filter((permission, index) => all.indexOf(permission) === index)
        },
    }),
} as const
