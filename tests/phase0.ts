/**
 * Phase 0 gate: proves the authorizer and session machinery works before any feature is built on
 * it. Deliberately not a unit test - it runs the real operations against the real seeded database,
 * because what is being checked is that the pieces are wired together, not that each computes.
 *
 *   npm run test:phase0
 */
import { resolveSession, createSession, destroySession } from '../src/lib/server/auth/sessionStore.ts'
import { permissionOperations } from '../src/lib/services/permissions/operations.ts'
import { omegaquoteOperations } from '../src/lib/services/omegaquotes/operations.ts'
import { prisma } from '../src/lib/server/prisma.ts'
import { decryptAndComparePassword } from '../src/lib/server/auth/password.ts'

const results: [string, boolean, string][] = []
function check(name: string, pass: boolean, detail = '') {
    results.push([name, pass, detail])
}

const admin = await prisma.user.findUniqueOrThrow({ where: { username: 'vegard' } })
const plain = await prisma.user.findUniqueOrThrow({ where: { username: 'grace' } })

// --- permissions resolve from group memberships ---
const adminPerms = await permissionOperations.readPermissionsOfUser.internalCall({ params: { userId: admin.id } })
const plainPerms = await permissionOperations.readPermissionsOfUser.internalCall({ params: { userId: plain.id } })
check('admin has USERS_READ', adminPerms.includes('USERS_READ'))
check('non-admin lacks USERS_READ', !plainPerms.includes('USERS_READ'))
check('both inherit default OMEGAQUOTES_READ', adminPerms.includes('OMEGAQUOTES_READ') && plainPerms.includes('OMEGAQUOTES_READ'))

// --- session round trip ---
const issued = await createSession(admin.id)
const resolved = await resolveSession(issued.token)
check('session resolves to the right user', resolved.user?.username === 'vegard')
check('session carries permissions', resolved.permissions.includes('USERS_READ'))
check('session carries memberships', resolved.memberships.length === 2)
check('bad token resolves anonymous', (await resolveSession('not-a-real-token')).user === null)
check('anonymous still gets default permissions', (await resolveSession(undefined)).permissions.includes('OMEGAQUOTES_READ'))

// --- password ---
const creds = await prisma.credentials.findUniqueOrThrow({ where: { userId: admin.id } })
check('correct password verifies', await decryptAndComparePassword('svele-dev', creds.passwordHash))
check('wrong password rejected', !(await decryptAndComparePassword('wrong', creds.passwordHash)))

// --- THE GATE: an operation behind an authorizer ---
const anon = await resolveSession(undefined)
const asUser = await resolveSession(issued.token)

// readPage needs OMEGAQUOTES_READ, which is a default permission -> anonymous allowed.
try {
    await omegaquoteOperations.readPage({
        params: { paging: { page: { pageSize: 2, page: 0, cursor: null }, details: undefined } },
        session: anon,
    })
    check('anonymous CAN read quotes (default permission)', true)
} catch (error) {
    check('anonymous CAN read quotes (default permission)', false, String(error))
}

// create needs a user -> anonymous refused.
try {
    await omegaquoteOperations.create({ data: { quote: 'x', author: 'y' }, session: anon })
    check('anonymous CANNOT create a quote', false, 'operation unexpectedly succeeded')
} catch (error) {
    const code = (error as { errorCode?: string }).errorCode
    check('anonymous CANNOT create a quote', code === 'UNAUTHENTICATED', `code=${code}`)
}

// create as a logged-in user -> allowed, and the poster is attached.
try {
    const made = await omegaquoteOperations.create({ data: { quote: 'Phase 0 gate.', author: 'svele' }, session: asUser })
    check('logged-in user CAN create a quote', true)
    await prisma.omegaQuote.delete({ where: { id: made.id } })
} catch (error) {
    check('logged-in user CAN create a quote', false, String(error))
}

await destroySession(issued.token)
check('destroyed session no longer resolves', (await resolveSession(issued.token)).user === null)

let failed = 0
for (const [name, pass, detail] of results) {
    console.log(`${pass ? '  ok  ' : ' FAIL '} ${name}${detail ? ` — ${detail}` : ''}`)
    if (!pass) failed++
}
console.log(`\n${results.length - failed}/${results.length} passed`)
await prisma.$disconnect()
process.exit(failed ? 1 : 0)
