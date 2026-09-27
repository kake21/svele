import {
    RequirePermission,
    RequireUserFieldOrPermission,
    RequireUserIdOrPermission,
    RequireUsernameOrPermission,
} from '@/server/auth/authorizer'

/**
 * Ported verbatim from projectNext's src/services/users/auth.ts, minus the operations svele does
 * not port. Note the shape: reads and self-edits go through an identity-or-permission authorizer,
 * so a user reaching their own record never needs an admin permission.
 */
export const userAuth = {
    read: RequireUserFieldOrPermission.staticFields({ permission: 'USERS_READ' }),
    readOrNull: RequireUserFieldOrPermission.staticFields({ permission: 'USERS_READ' }),
    readProfile: RequireUsernameOrPermission.staticFields({ permission: 'USERS_READ' }),
    readPage: RequirePermission.staticFields({ permission: 'USERS_READ' }),
    create: RequirePermission.staticFields({ permission: 'USERS_CREATE' }),
    update: RequirePermission.staticFields({ permission: 'USERS_UPDATE' }),
    updateProfile: RequireUsernameOrPermission.staticFields({ permission: 'USERS_UPDATE' }),
    updatePassword: RequireUserIdOrPermission.staticFields({ permission: 'USERS_UPDATE' }),
    destroy: RequirePermission.staticFields({ permission: 'USERS_DESTROY' }),
} as const
