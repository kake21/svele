import { createHash, randomBytes } from 'node:crypto'
import { prisma } from '../prisma'
import { permissionOperations } from '@/services/permissions/operations'
import { emptySession } from './session'
import type { SessionMaybeUser } from './session'

/**
 * Decision 2 in practice: server-side sessions instead of projectNext's JWT strategy.
 *
 * projectNext packs the user, their permissions and their memberships into the token, which is
 * why src/auth/nextAuth/jwtCompression.ts exists - the pair overflows the 4096-byte cookie limit.
 * Here the cookie carries only an opaque random token; everything else is read per request.
 *
 * The token is stored hashed. A leaked database dump then contains no usable session tokens, the
 * same reason password hashes are not stored in plaintext. SHA-256 is right here where it is
 * wrong for passwords: the input is 256 bits of entropy, so there is nothing to brute-force.
 */
export const SESSION_COOKIE = 'svele_session'
const SESSION_TTL_DAYS = 30

function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
}

export type IssuedSession = {
    token: string,
    expiresAt: Date,
}

export async function createSession(userId: number): Promise<IssuedSession> {
    const token = randomBytes(32).toString('base64url')
    const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000)

    await prisma.authSession.create({
        data: { tokenHash: hashToken(token), userId, expiresAt },
    })

    return { token, expiresAt }
}

export async function destroySession(token: string): Promise<void> {
    // deleteMany rather than delete: logging out twice should not throw.
    await prisma.authSession.deleteMany({ where: { tokenHash: hashToken(token) } })
}

/**
 * Resolves a cookie token into the session every operation will be authorised against.
 *
 * An anonymous visitor still gets the default permissions - projectNext does the same through
 * Session.fromDefaultPermissions - so "logged out" and "has no rights at all" stay distinct.
 */
export async function resolveSession(token: string | undefined): Promise<SessionMaybeUser> {
    const defaultPermissions = await permissionOperations.readDefaultPermissions.internalCall({})
    const anonymous: SessionMaybeUser = { ...emptySession, permissions: defaultPermissions }

    if (!token) return anonymous

    const stored = await prisma.authSession.findUnique({
        where: { tokenHash: hashToken(token) },
        select: {
            expiresAt: true,
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    firstname: true,
                    lastname: true,
                    acceptedTerms: true,
                    archived: true,
                    memberships: {
                        select: { groupId: true, admin: true, active: true, order: true },
                    },
                },
            },
        },
    })

    if (!stored) return anonymous

    if (stored.expiresAt < new Date()) {
        // Clean up on the way past rather than running a sweeper.
        await prisma.authSession.deleteMany({ where: { tokenHash: hashToken(token) } })
        return anonymous
    }

    // An archived user keeps their row but loses their session.
    if (stored.user.archived) return anonymous

    const { archived, memberships, ...user } = stored.user

    return {
        user,
        permissions: await permissionOperations.readPermissionsOfUser.internalCall({
            params: { userId: user.id },
        }),
        memberships,
    }
}
