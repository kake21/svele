import { authAuth } from './auth'
import { authSchemas } from './schemas'
import { decryptAndComparePassword } from '@/server/auth/password'
import { defineOperation } from '@/server/serviceOperation'
import { Smorekopp } from '@/services/error'

/**
 * This is what replaces NextAuth's CredentialsProvider.authorize().
 *
 * The plan called for @auth/sveltekit here, but Decision 2 rules it out: Auth.js only supports
 * the Credentials provider with a JWT session strategy, never with database sessions. That is
 * exactly why projectNext pins `strategy: 'jwt'` in authOptions.ts, and therefore why
 * jwtCompression.ts had to exist. Having chosen database sessions, the credential check is an
 * ordinary service operation and the login page is an ordinary form action - no dependency, and
 * the whole flow works without JavaScript.
 */
export const authOperations = {
    authenticate: defineOperation({
        dataSchema: authSchemas.authenticate,
        authorizer: () => authAuth.authenticate.dynamicFields({}),
        operation: async ({ prisma, data }): Promise<{ userId: number }> => {
            const credentials = await prisma.credentials.findUnique({
                where: { username: data.username },
                select: {
                    passwordHash: true,
                    userId: true,
                    user: { select: { archived: true } },
                },
            })

            // One error for every failure mode - unknown user, wrong password, archived account -
            // so the response cannot be used to enumerate usernames.
            const refuse = () => {
                throw new Smorekopp('UNAUTHENTICATED', 'Feil brukernavn eller passord')
            }

            if (!credentials) {
                // Still spend the time hashing, so a missing user is not measurably faster than a
                // wrong password.
                await decryptAndComparePassword(data.password, 'x:x:x')
                return refuse()
            }

            if (!await decryptAndComparePassword(data.password, credentials.passwordHash)) {
                return refuse()
            }

            if (credentials.user.archived) return refuse()

            return { userId: credentials.userId }
        },
    }),
} as const
