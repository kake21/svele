import type { Permission } from '../../../../generated/prisma/client.js'

/**
 * Ported from projectNext's src/auth/session/Session.ts.
 *
 * The UserGuarantee generic is the load-bearing part: it is what lets an authorizer that requires
 * a user hand the operation a session whose `user` is non-null without a cast. Dropped from
 * projectNext's version: `apiKeyId`, since svele has no API keys.
 */
export type UserGuaranteeOption = 'HAS_USER' | 'NO_USER'

/**
 * The user fields that travel on the session. Deliberately small - this is read on every request
 * and, in projectNext, is what a client component can see.
 */
export type SessionUserFields = {
    id: number,
    username: string,
    email: string,
    firstname: string,
    lastname: string,
    acceptedTerms: Date | null,
}

export type MembershipFiltered = {
    groupId: number,
    admin: boolean,
    active: boolean,
    order: number,
}

export type SessionType<UserGuarantee extends UserGuaranteeOption> = {
    user: UserGuarantee extends 'HAS_USER'
        ? SessionUserFields
        : (UserGuarantee extends 'NO_USER' ? null : never),
    permissions: Permission[],
    memberships: MembershipFiltered[],
}

export type SessionUser = SessionType<'HAS_USER'>
export type SessionNoUser = SessionType<'NO_USER'>
export type SessionMaybeUser = SessionType<'HAS_USER'> | SessionType<'NO_USER'>

export class Session<UserGuarantee extends UserGuaranteeOption> {
    private session: SessionType<UserGuarantee>

    protected constructor(session: SessionType<UserGuarantee>) {
        this.session = session
    }

    public get user() {
        return this.session.user
    }

    public get permissions() {
        return this.session.permissions
    }

    public get memberships() {
        return this.session.memberships
    }

    public toJsObject(): SessionType<UserGuarantee> {
        return {
            user: this.user,
            permissions: this.permissions,
            memberships: this.memberships,
        }
    }

    public static empty(): Session<'NO_USER'> {
        return new Session<'NO_USER'>({ user: null, permissions: [], memberships: [] })
    }

    public static fromJsObject(jsObject: SessionMaybeUser): Session<'NO_USER'> | Session<'HAS_USER'> {
        return new Session(jsObject)
    }

    public static fromDefaultPermissions(defaultPermissions: Permission[]): Session<'NO_USER'> {
        return new Session<'NO_USER'>({ user: null, permissions: defaultPermissions, memberships: [] })
    }
}

export const emptySession: SessionMaybeUser = { user: null, permissions: [], memberships: [] }
