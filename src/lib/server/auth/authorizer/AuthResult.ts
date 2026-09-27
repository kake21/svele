import type { SessionType, UserGuaranteeOption } from '../session'

/**
 * Ported from projectNext's src/auth/authorizer/AuthResult.ts.
 *
 * Two things are dropped. The PrismaWhereFilter generic, because no authorizer in scope returns
 * one - that machinery belongs to the visibility system, which neither users nor events uses.
 * And redirectOnUnauthorized, because redirecting is SvelteKit's `redirect()` from a load
 * function, not something the auth result should reach out and do.
 */
export type AuthStatus = 'AUTHORIZED' | 'UNAUTHORIZED' | 'AUTHORIZED_NO_USER' | 'UNAUTHENTICATED'

export type AuthResultTypeWithoutStatus<
    UserGuarantee extends UserGuaranteeOption,
    Authorized extends boolean,
> = {
    session: SessionType<UserGuarantee>,
    errorMessage?: string,
    authorized: Authorized,
}

export type AuthResultType<
    UserGuarantee extends UserGuaranteeOption,
    Authorized extends boolean,
> = AuthResultTypeWithoutStatus<UserGuarantee, Authorized> & {
    status: AuthStatus,
}

export type AuthResultTypeAny = AuthResultType<UserGuaranteeOption, boolean>

export class AuthResult<
    const UserGuarantee extends UserGuaranteeOption,
    const Authorized extends boolean,
> {
    private authResult: AuthResultTypeWithoutStatus<UserGuarantee, Authorized>

    public get authorized() {
        return this.authResult.authorized
    }

    public get session(): SessionType<UserGuarantee> {
        return this.authResult.session
    }

    public constructor(
        session: SessionType<UserGuarantee>,
        authorized: Authorized,
        errorMessage?: string
    ) {
        this.authResult = { session, authorized, errorMessage }
    }

    /**
     * The distinction that matters to the transport layer: UNAUTHENTICATED means "log in and try
     * again" (401), UNAUTHORIZED means "logging in will not help" (403).
     */
    public get status(): AuthStatus {
        if (this.authResult.session.user) {
            if (this.authorized) return 'AUTHORIZED'
            return 'UNAUTHORIZED'
        }
        if (this.authorized) return 'AUTHORIZED_NO_USER'
        return 'UNAUTHENTICATED'
    }

    public get getErrorMessage(): string | undefined {
        return this.authResult.errorMessage
    }

    public toJsObject(): AuthResultType<UserGuarantee, Authorized> {
        return {
            session: { ...this.session },
            authorized: this.authorized,
            errorMessage: this.getErrorMessage,
            status: this.status,
        }
    }

    public static fromJsObject<
        const UserGuarantee_ extends UserGuaranteeOption,
        const Authorized_ extends boolean,
    >(
        authResult: AuthResultType<UserGuarantee_, Authorized_>
    ): AuthResult<UserGuarantee_, Authorized_> {
        return new AuthResult(authResult.session, authResult.authorized, authResult.errorMessage)
    }
}
