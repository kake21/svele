import { RequireNothing } from '@/server/auth/authorizer'

export const authAuth = {
    // Logging in is by definition something a session without a user must be able to do.
    authenticate: RequireNothing.staticFields({}),
} as const
