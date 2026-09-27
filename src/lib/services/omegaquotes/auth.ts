import { RequirePermission, RequireUser } from '@/server/auth/authorizer'

/**
 * Now that svele has users, these are projectNext's real authorizers rather than the
 * RequireNothing stubs that stood in while there was no session.
 *
 * projectNext guards `create` with RequirePermissionAndUserId, because its create takes the poster
 * as a parameter. svele's create takes the poster from the session instead, so there is no id to
 * cross-check - RequireUser plus the permission is the same guarantee without the redundant field.
 */
export const omegaQuotesAuth = {
    create: RequireUser.staticFields({}),
    readPage: RequirePermission.staticFields({ permission: 'OMEGAQUOTES_READ' }),
} as const
