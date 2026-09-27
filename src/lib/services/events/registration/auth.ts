import {
    RequirePermission,
    RequirePermissionAndUser,
    RequireUserIdOrPermission,
} from '@/server/auth/authorizer'

/**
 * Ported from projectNext's src/services/events/registration/auth.ts, minus
 * dotPunishmentOfUser (Decision 3) and updateRegistrationNotes' TODO.
 */
export const eventRegistrationAuth = {
    create: RequireUserIdOrPermission.staticFields({ permission: 'EVENT_REGISTRATION_CREATE' }),
    createGuest: RequirePermission.staticFields({ permission: 'EVENT_ADMIN' }),
    readMany: RequirePermissionAndUser.staticFields({ permission: 'EVENT_REGISTRATION_READ' }),
    destroy: RequireUserIdOrPermission.staticFields({ permission: 'EVENT_REGISTRATION_DESROY' }),
} as const
