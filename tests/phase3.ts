/**
 * Phase 3 gate: event registration, including the bit projectNext's plan flagged as untested -
 * what happens when several people race for the last place.
 *
 *   npm run test:phase3
 */
import { prisma } from '../src/lib/server/prisma.ts'
import { resolveSession } from '../src/lib/server/auth/sessionStore.ts'
import { eventOperations } from '../src/lib/services/events/operations.ts'
import { eventRegistrationOperations } from '../src/lib/services/events/registration/operations.ts'
import { permissionOperations } from '../src/lib/services/permissions/operations.ts'
import type { SessionMaybeUser } from '../src/lib/server/auth/session.ts'

const results: [string, boolean, string][] = []
function check(name: string, pass: boolean, detail = '') {
    results.push([name, pass, detail])
}

async function sessionFor(username: string): Promise<SessionMaybeUser> {
    const user = await prisma.user.findUniqueOrThrow({
        where: { username },
        select: {
            id: true, username: true, email: true, firstname: true, lastname: true,
            acceptedTerms: true,
            memberships: { select: { groupId: true, admin: true, active: true, order: true } },
        },
    })
    const { memberships, ...rest } = user
    return {
        user: rest,
        permissions: await permissionOperations.readPermissionsOfUser.internalCall({
            params: { userId: user.id },
        }),
        memberships,
    }
}

const admin = await sessionFor('vegard')
const anon = await resolveSession(undefined)

// A fresh event with 2 places and a waiting list, so the test owns its own state.
const event = await eventOperations.create({
    data: {
        name: 'Gate test: kapasitet',
        location: 'Testrommet',
        descriptionMd: '',
        coverImageUrl: '',
        eventStart: new Date(Date.now() + 86400000),
        eventEnd: new Date(Date.now() + 90000000),
        canBeViewdBy: 'ALL',
        takesRegistration: true,
        places: 2,
        waitingList: true,
        registrationStart: new Date(Date.now() - 3600000),
        registrationEnd: new Date(Date.now() + 86400000),
        tagIds: [],
    },
    session: admin,
})
check('admin can create an event', Boolean(event.id))

const people = ['grace', 'ada', 'edsger', 'alan', 'barbara']
const sessions = await Promise.all(people.map(sessionFor))

// --- sequential registration fills places, then the waiting list ---
const outcomes: boolean[] = []
for (const [index, session] of sessions.entries()) {
    const result = await eventRegistrationOperations.create({
        params: { userId: session.user!.id, eventId: event.id },
        session,
    })
    outcomes.push(result.onWaitingList)
    check(
        `registration ${index + 1} ${index < 2 ? 'gets a place' : 'goes on the waiting list'}`,
        result.onWaitingList === (index >= 2),
        `onWaitingList=${result.onWaitingList}`
    )
}

const readBack = await eventOperations.read({ params: { id: event.id }, session: anon })
check('2 of 5 counted as registered', readBack.numOfRegistrations === 2, `got ${readBack.numOfRegistrations}`)
check('3 of 5 counted as waiting', readBack.numOnWaitingList === 3, `got ${readBack.numOnWaitingList}`)

// --- unregister frees a place ---
await eventRegistrationOperations.destroy({
    params: { eventId: event.id, userId: sessions[0].user!.id },
    session: sessions[0],
})
const afterLeave = await eventOperations.read({ params: { id: event.id }, session: anon })
check('unregistering frees a place', afterLeave.numOnWaitingList === 2, `waiting=${afterLeave.numOnWaitingList}`)

// --- a user cannot unregister someone else ---
try {
    await eventRegistrationOperations.destroy({
        params: { eventId: event.id, userId: sessions[1].user!.id },
        session: sessions[2],
    })
    check('cannot unregister another user', false, 'unexpectedly succeeded')
} catch (error) {
    check('cannot unregister another user', (error as { errorCode?: string }).errorCode === 'UNAUTHORIZED')
}

// --- THE RACE: an event with 2 places, no waiting list, 5 simultaneous registrations ---
const scarce = await eventOperations.create({
    data: {
        name: 'Gate test: kappløp',
        location: 'Testrommet',
        descriptionMd: '',
        coverImageUrl: '',
        eventStart: new Date(Date.now() + 86400000),
        eventEnd: new Date(Date.now() + 90000000),
        canBeViewdBy: 'ALL',
        takesRegistration: true,
        places: 2,
        waitingList: false,
        registrationStart: new Date(Date.now() - 3600000),
        registrationEnd: new Date(Date.now() + 86400000),
        tagIds: [],
    },
    session: admin,
})

const raced = await Promise.allSettled(sessions.map(session =>
    eventRegistrationOperations.create({
        params: { userId: session.user!.id, eventId: scarce.id },
        session,
    })
))

const won = raced.filter(outcome => outcome.status === 'fulfilled').length
const stored = await prisma.eventRegistration.count({ where: { eventId: scarce.id } })
check('exactly 2 of 5 concurrent registrations succeed', won === 2, `won=${won}`)
check('no overbooking survives in the database', stored === 2, `rows=${stored}`)

// --- a full event without a waiting list refuses ---
try {
    await eventRegistrationOperations.create({
        params: { userId: sessions[0].user!.id, eventId: scarce.id },
        session: sessions[0],
    })
    check('full event refuses further registration', false, 'unexpectedly succeeded')
} catch (error) {
    check('full event refuses further registration', (error as { errorCode?: string }).errorCode === 'BAD PARAMETERS')
}

// --- anonymous cannot register ---
try {
    await eventRegistrationOperations.create({
        params: { userId: sessions[0].user!.id, eventId: event.id },
        session: anon,
    })
    check('anonymous cannot register', false, 'unexpectedly succeeded')
} catch (error) {
    const code = (error as { errorCode?: string }).errorCode
    check('anonymous cannot register', code === 'UNAUTHENTICATED' || code === 'UNAUTHORIZED', `code=${code}`)
}

// --- cleanup ---
await prisma.event.deleteMany({ where: { id: { in: [event.id, scarce.id] } } })

let failed = 0
for (const [name, pass, detail] of results) {
    console.log(`${pass ? '  ok  ' : ' FAIL '} ${name}${detail ? ` — ${detail}` : ''}`)
    if (!pass) failed++
}
console.log(`\n${results.length - failed}/${results.length} passed`)
await prisma.$disconnect()
process.exit(failed ? 1 : 0)
