import { AuthorizerFactory } from './Authorizer'
import type { Permission } from '../../../../../generated/prisma/client.js'

/**
 * The eight authorizers the ported domains actually reference, read out of projectNext's
 * users/auth.ts, events/auth.ts and events/registration/auth.ts. Each is a one-for-one port;
 * they live in one file here rather than one file each simply because they are four lines apiece.
 *
 * The fifteen not ported are either visibility-based (RequireVisibility*, which return a
 * prismaWhereFilter nothing in scope consumes) or belong to domains svele does not have
 * (RequireLedgerAccountAccess, RequirePermissionOrGroupAdmin, RequireJWT, ...).
 */

export const RequireNothing = AuthorizerFactory<object, object, 'USER_NOT_REQUIERED_FOR_AUTHORIZED'>(
    ({ session }) => ({ success: true, session })
)

export const RequirePermission = AuthorizerFactory<
    { permission: Permission },
    Record<string, never>,
    'USER_NOT_REQUIERED_FOR_AUTHORIZED'
>(({ session, staticFields }) => ({
    success: session.permissions.includes(staticFields.permission),
    session,
    errorMessage: `Du trenger tillatelse '${staticFields.permission}' for å få tilgang`,
}))

/**
 * Not for requiring a specific user - only that there is one.
 */
export const RequireUser = AuthorizerFactory<
    Record<string, never>,
    Record<string, never>,
    'USER_REQUIERED_FOR_AUTHORIZED'
>(({ session }) => (
    session.user
        ? { success: true, session: { ...session, user: session.user } }
        : { success: false, session, errorMessage: 'Du må være innlogget for å få tilgang' }
))

export const RequireUserId = AuthorizerFactory<
    Record<string, never>,
    { userId: number },
    'USER_REQUIERED_FOR_AUTHORIZED'
>(({ session, dynamicFields }) => {
    if (!session.user) {
        return { success: false, session, errorMessage: 'Du må være innlogget for å få tilgang' }
    }
    if (session.user.id !== dynamicFields.userId) {
        return { success: false, session, errorMessage: 'Du har ikke tilgang til denne ressursen' }
    }
    return { success: true, session: { ...session, user: session.user } }
})

export const RequireUserIdOrPermission = AuthorizerFactory<
    { permission: Permission },
    { userId: number },
    'USER_NOT_REQUIERED_FOR_AUTHORIZED'
>(({ session, staticFields, dynamicFields }) => {
    if (session.permissions.includes(staticFields.permission)) {
        return { success: true, session }
    }
    return {
        success: session.user !== null && session.user.id === dynamicFields.userId,
        session,
        errorMessage: 'Du har ikke tilgang til denne ressursen',
    }
})

export const RequireUsernameOrPermission = AuthorizerFactory<
    { permission: Permission },
    { username: string },
    'USER_NOT_REQUIERED_FOR_AUTHORIZED'
>(({ session, staticFields, dynamicFields }) => {
    if (session.permissions.includes(staticFields.permission)) {
        return { success: true, session }
    }
    return {
        success: session.user !== null && session.user.username === dynamicFields.username,
        session,
        errorMessage: 'Du har ikke tilgang til denne ressursen',
    }
})

export const RequirePermissionAndUser = AuthorizerFactory<
    { permission: Permission },
    Record<string, never>,
    'USER_REQUIERED_FOR_AUTHORIZED'
>(({ session, staticFields }) => {
    if (!session.user) {
        return { success: false, session, errorMessage: 'Du må være innlogget for å få tilgang' }
    }
    if (!session.permissions.includes(staticFields.permission)) {
        return {
            success: false,
            session,
            errorMessage: `Du trenger tillatelse '${staticFields.permission}' for å få tilgang`,
        }
    }
    return { success: true, session: { ...session, user: session.user } }
})

/**
 * Authorises if the session carries the permission, or if the session's user matches any one of
 * the supplied identity fields.
 */
export const RequireUserFieldOrPermission = AuthorizerFactory<
    { permission: Permission },
    { username?: string, id?: number, email?: string },
    'USER_NOT_REQUIERED_FOR_AUTHORIZED'
>(({ session, staticFields, dynamicFields }) => {
    if (session.permissions.includes(staticFields.permission)) {
        return { success: true, session }
    }
    const user = session.user
    if (user) {
        if (dynamicFields.id !== undefined && user.id === dynamicFields.id) {
            return { success: true, session }
        }
        if (dynamicFields.username !== undefined && user.username === dynamicFields.username) {
            return { success: true, session }
        }
        if (dynamicFields.email !== undefined && user.email === dynamicFields.email) {
            return { success: true, session }
        }
    }
    return { success: false, session, errorMessage: 'Du har ikke tilgang til denne ressursen' }
})
