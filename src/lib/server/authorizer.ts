import type { Session } from './session'

/**
 * The authorization seam.
 *
 * projectNext's authorizers are a class hierarchy (RequirePermission, RequirePermissionAndUserId,
 * RequireNothing, ...) that resolve a session into an AuthResult and optionally a Prisma where
 * filter. svele reproduces the *interface* - staticFields -> dynamicFields -> auth(session) - with
 * only the two authorizers the mini version needs, so service definitions read identically to
 * projectNext's.
 */
export type AuthResult =
    | { authorized: true }
    | { authorized: false, status: 'UNAUTHENTICATED' | 'UNAUTHORIZED', getErrorMessage: string }

export type AuthorizerDynamicFieldsBound = {
    auth: (session: Session) => AuthResult,
}

/**
 * Allows everyone, including anonymous visitors. This is what every svele operation uses right now
 * because there is no login.
 */
export const RequireNothing = {
    staticFields: () => ({
        dynamicFields: (): AuthorizerDynamicFieldsBound => ({
            auth: () => ({ authorized: true }),
        }),
    }),
}

/**
 * Present so the pattern is visible, and so flipping svele to a real auth model is a one-line
 * change per operation rather than a redesign. Unused until `session.user` can actually be
 * populated - see src/lib/server/session.ts.
 */
export const RequirePermission = {
    staticFields: ({ permission }: { permission: string }) => ({
        dynamicFields: (): AuthorizerDynamicFieldsBound => ({
            auth: (session: Session): AuthResult => {
                if (!session.user) {
                    return {
                        authorized: false,
                        status: 'UNAUTHENTICATED',
                        getErrorMessage: 'Du er ikke innlogget',
                    }
                }
                if (!session.user.permissions.includes(permission)) {
                    return {
                        authorized: false,
                        status: 'UNAUTHORIZED',
                        getErrorMessage: `Du mangler tilgangen ${permission}`,
                    }
                }
                return { authorized: true }
            },
        }),
    }),
}
