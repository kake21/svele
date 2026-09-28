import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js'
import { hashAndEncryptPassword } from '../src/lib/server/auth/password.ts'

/**
 * Brings a fresh production database up to the point where the app is usable, without seeding any
 * of the development data.
 *
 * A deployed svele against an empty database is not merely empty, it is unusable: with no
 * DefaultPermission rows an anonymous visitor cannot read even the public pages, and with no user
 * there is no way to log in and fix that. This creates the minimum - default permissions, the two
 * groups, and one administrator - and nothing else.
 *
 * Idempotent: safe to run on every deploy. It never overwrites an existing user's password.
 *
 *   ADMIN_USERNAME=... ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run bootstrap
 */
const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DB_URI }),
})

const DEFAULT_PERMISSIONS = ['OMEGAQUOTES_READ', 'EVENT_READ'] as const

const MEMBER_PERMISSIONS = [
    'OMEGAQUOTES_WRITE', 'GROUP_READ', 'EVENT_REGISTRATION_CREATE',
] as const

const ADMIN_PERMISSIONS = [
    'USERS_READ', 'USERS_CREATE', 'USERS_UPDATE', 'USERS_DESTROY',
    'EVENT_CREATE', 'EVENT_ADMIN', 'EVENT_REGISTRATION_READ', 'EVENT_REGISTRATION_DESROY',
] as const

async function upsertGroup(name: string, permissions: readonly string[]) {
    const existing = await prisma.group.findFirst({ where: { name }, select: { id: true } })
    const group = existing ?? await prisma.group.create({
        data: { name, order: 1 },
        select: { id: true },
    })

    // createMany + skipDuplicates rather than a replace, so permissions granted by hand in
    // production are not silently revoked by the next deploy.
    await prisma.groupPermission.createMany({
        data: permissions.map(permission => ({ groupId: group.id, permission })),
        skipDuplicates: true,
    })

    return group
}

async function main() {
    const username = process.env.ADMIN_USERNAME
    const email = process.env.ADMIN_EMAIL
    const password = process.env.ADMIN_PASSWORD

    await prisma.defaultPermission.createMany({
        data: DEFAULT_PERMISSIONS.map(permission => ({ permission })),
        skipDuplicates: true,
    })
    console.log(`[bootstrap] default permissions: ${DEFAULT_PERMISSIONS.join(', ')}`)

    const members = await upsertGroup('Medlemmer', MEMBER_PERMISSIONS)
    const admins = await upsertGroup('Administratorer', ADMIN_PERMISSIONS)
    console.log('[bootstrap] groups: Medlemmer, Administratorer')

    if (!username || !email || !password) {
        console.log('[bootstrap] ADMIN_USERNAME / ADMIN_EMAIL / ADMIN_PASSWORD not all set - no administrator created.')
        return
    }

    const existing = await prisma.user.findUnique({ where: { username }, select: { id: true } })
    if (existing) {
        console.log(`[bootstrap] user "${username}" already exists - leaving it and its password alone.`)
        return
    }

    const user = await prisma.user.create({
        data: { username, email, firstname: username, lastname: '', acceptedTerms: new Date() },
    })

    await prisma.credentials.create({
        data: { user: { connect: { id: user.id } }, passwordHash: await hashAndEncryptPassword(password) },
    })

    await prisma.membership.createMany({
        data: [
            { userId: user.id, groupId: members.id, order: 1, active: true },
            { userId: user.id, groupId: admins.id, order: 1, active: true, admin: true },
        ],
    })

    console.log(`[bootstrap] created administrator "${username}".`)
}

main()
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
