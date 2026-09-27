import { AuthResult } from './AuthResult'
import type { SessionMaybeUser, SessionUser } from '../session'

/**
 * Ported from projectNext's src/auth/authorizer/Authorizer.ts, with the PrismaWhereFilter generic
 * removed - nothing in the ported scope returns one.
 *
 * The UserRequieredOut generic (projectNext's spelling, kept so the two stay greppable) is what
 * makes the type system useful here: an authorizer declared USER_REQUIERED_FOR_AUTHORIZED can only
 * succeed with a SessionUser, so an operation behind it gets a non-null `session.user` without
 * asserting anything.
 */
export type UserRequieredOutOpt = 'USER_NOT_REQUIERED_FOR_AUTHORIZED' | 'USER_REQUIERED_FOR_AUTHORIZED'

export type AuthorizerDynamicFieldsBound<
    UserRequieredOut extends UserRequieredOutOpt =
        'USER_NOT_REQUIERED_FOR_AUTHORIZED' | 'USER_REQUIERED_FOR_AUTHORIZED',
> = {
    auth: (session: SessionMaybeUser) => UserRequieredOut extends 'USER_REQUIERED_FOR_AUTHORIZED'
        ? (AuthResult<'HAS_USER', true> | AuthResult<'HAS_USER' | 'NO_USER', false>)
        : (AuthResult<'HAS_USER' | 'NO_USER', true> | AuthResult<'HAS_USER' | 'NO_USER', false>),
}

export type AuthorizerStaticFieldsBound<
    DynamicFields extends object,
    UserRequieredOut extends UserRequieredOutOpt =
        'USER_NOT_REQUIERED_FOR_AUTHORIZED' | 'USER_REQUIERED_FOR_AUTHORIZED',
> = {
    dynamicFields: (dynamicFields: DynamicFields) => AuthorizerDynamicFieldsBound<UserRequieredOut>,
}

export type Authorizer<
    StaticFields extends object,
    DynamicFields extends object,
    UserRequieredOut extends UserRequieredOutOpt,
> = {
    staticFields: (staticFields: StaticFields) =>
        AuthorizerStaticFieldsBound<DynamicFields, UserRequieredOut>,
}

export function AuthorizerFactory<
    StaticFields extends object,
    DynamicFields extends object,
    const UserRequieredOut extends UserRequieredOutOpt,
>(
    authCheck: ((_: {
        session: SessionMaybeUser,
        staticFields: StaticFields,
        dynamicFields: DynamicFields,
    }) => UserRequieredOut extends 'USER_REQUIERED_FOR_AUTHORIZED'
        ? (
            { success: true, session: SessionUser, errorMessage?: string }
            | { success: false, session: SessionMaybeUser, errorMessage?: string }
        )
        : (
            { success: true, session: SessionMaybeUser, errorMessage?: string }
            | { success: false, session: SessionMaybeUser, errorMessage?: string }
        )
    )
): Authorizer<StaticFields, DynamicFields, UserRequieredOut> {
    return {
        staticFields: staticFields => ({
            dynamicFields: dynamicFields => ({
                auth: session => {
                    const results = authCheck({ session, staticFields, dynamicFields })
                    if (results.success) {
                        return new AuthResult(results.session, true)
                    }
                    return new AuthResult(results.session, false, results.errorMessage)
                },
            }),
        }),
    }
}
