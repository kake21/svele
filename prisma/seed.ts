import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js'
import { hashAndEncryptPassword } from '../src/lib/server/auth/password.ts'

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DB_URI }),
})

// Development credentials. Every seeded account uses this password.
const SEED_PASSWORD = 'svele-dev'

const quotes = [
    { author: 'Ada Lovelace', quote: 'That brain of mine is something more than merely mortal.' },
    { author: 'Grace Hopper', quote: 'The most dangerous phrase in the language is "we have always done it this way".' },
    { author: 'Edsger Dijkstra', quote: 'Simplicity is prerequisite for reliability.' },
    { author: 'Alan Kay', quote: 'The best way to predict the future is to invent it.' },
    { author: 'Rich Harris', quote: 'Frameworks are not tools for organizing your code, they are tools for organizing your mind.' },
    { author: 'Donald Knuth', quote: 'Premature optimization is the root of all evil.' },
    { author: 'Barbara Liskov', quote: 'Abstraction is the key to managing complexity.' },
    { author: 'Leslie Lamport', quote: 'A distributed system is one in which the failure of a computer you did not know existed can render your own computer unusable.' },
    { author: 'Tony Hoare', quote: 'Inside every large program there is a small program trying to get out.' },
    { author: 'Fred Brooks', quote: 'Adding manpower to a late software project makes it later.' },
    { author: 'Linus Torvalds', quote: 'Talk is cheap. Show me the code.' },
    { author: 'Margaret Hamilton', quote: 'There was no choice but to be pioneers.' },
    { author: 'Ken Thompson', quote: 'When in doubt, use brute force.' },
    { author: 'Bjarne Stroustrup', quote: 'There are only two kinds of languages: the ones people complain about and the ones nobody uses.' },
    { author: 'Rob Pike', quote: 'A little copying is better than a little dependency.' },
    { author: 'Jeff Atwood', quote: 'The best code is no code at all.' },
    { author: 'Martin Fowler', quote: 'Any fool can write code that a computer can understand.' },
    { author: 'Joel Spolsky', quote: 'All non-trivial abstractions, to some degree, are leaky.' },
    { author: 'Kent Beck', quote: 'Make it work, make it right, make it fast.' },
    { author: 'John Carmack', quote: 'Focus is a matter of deciding what things you are not going to do.' },
    { author: 'Butler Lampson', quote: 'All problems in computer science can be solved by another level of indirection.' },
    { author: 'Alan Perlis', quote: 'A language that does not affect the way you think about programming is not worth knowing.' },
    { author: 'Niklaus Wirth', quote: 'Software gets slower faster than hardware gets faster.' },
    { author: 'Bill Joy', quote: 'Most good programmers do programming not because they expect to get paid, but because it is fun.' },
    { author: 'Peter Deutsch', quote: 'To iterate is human, to recurse divine.' },
]

const people = [
    ['vegard', 'Vegard', 'Bauge'], ['ada', 'Ada', 'Lovelace'], ['grace', 'Grace', 'Hopper'],
    ['edsger', 'Edsger', 'Dijkstra'], ['alan', 'Alan', 'Kay'], ['barbara', 'Barbara', 'Liskov'],
    ['leslie', 'Leslie', 'Lamport'], ['tony', 'Tony', 'Hoare'], ['fred', 'Fred', 'Brooks'],
    ['margaret', 'Margaret', 'Hamilton'], ['ken', 'Ken', 'Thompson'], ['rob', 'Rob', 'Pike'],
    ['niklaus', 'Niklaus', 'Wirth'], ['donald', 'Donald', 'Knuth'], ['kent', 'Kent', 'Beck'],
    ['martin', 'Martin', 'Fowler'], ['joel', 'Joel', 'Spolsky'], ['john', 'John', 'Carmack'],
    ['butler', 'Butler', 'Lampson'], ['perlis', 'Alan', 'Perlis'], ['bill', 'Bill', 'Joy'],
    ['peter', 'Peter', 'Deutsch'], ['linus', 'Linus', 'Torvalds'], ['bjarne', 'Bjarne', 'Stroustrup'],
] as const

async function seedUsers() {
    if (await prisma.user.count() > 0) {
        console.log('[seed] users already present, skipping.')
        return
    }

    // Anonymous visitors can read quotes and see the event list, nothing more.
    await prisma.defaultPermission.createMany({
        data: [{ permission: 'OMEGAQUOTES_READ' }, { permission: 'EVENT_READ' }],
        skipDuplicates: true,
    })

    const members = await prisma.group.create({
        data: {
            name: 'Medlemmer',
            order: 1,
            permissions: {
                create: [
                    { permission: 'OMEGAQUOTES_WRITE' },
                    { permission: 'GROUP_READ' },
                    { permission: 'EVENT_REGISTRATION_CREATE' },
                ],
            },
        },
    })

    const admins = await prisma.group.create({
        data: {
            name: 'Administratorer',
            order: 1,
            permissions: {
                create: [
                    { permission: 'USERS_READ' }, { permission: 'USERS_CREATE' },
                    { permission: 'USERS_UPDATE' }, { permission: 'USERS_DESTROY' },
                    { permission: 'EVENT_CREATE' }, { permission: 'EVENT_ADMIN' },
                    { permission: 'EVENT_REGISTRATION_READ' },
                    { permission: 'EVENT_REGISTRATION_DESROY' },
                ],
            },
        },
    })

    const passwordHash = await hashAndEncryptPassword(SEED_PASSWORD)

    for (const [index, [username, firstname, lastname]] of people.entries()) {
        const user = await prisma.user.create({
            data: {
                username,
                email: `${username}@example.test`,
                firstname,
                lastname,
                acceptedTerms: new Date(),
                bio: index % 3 === 0 ? `${firstname} har vært med siden starten.` : '',
            },
        })

        // Credentials relates to User on the composite [userId, username, email], so it cannot be
        // created inline with those fields spelled out - Prisma fills them from the connected row.
        // projectNext does the same in its updatePassword upsert.
        await prisma.credentials.create({
            data: {
                user: { connect: { id: user.id } },
                passwordHash,
            },
        })

        await prisma.membership.create({
            data: { userId: user.id, groupId: members.id, order: 1, active: true },
        })

        // The first two also administrate, so there is something to test authorizers against.
        if (index < 2) {
            await prisma.membership.create({
                data: { userId: user.id, groupId: admins.id, order: 1, active: true, admin: true },
            })
        }
    }

    const seededUsers = await prisma.user.findMany({ select: { id: true } })

    // Quotes may already exist from a pre-users seed. In that case attach posters to them rather
    // than inserting a duplicate set.
    const existingQuotes = await prisma.omegaQuote.findMany({ select: { id: true } })

    if (existingQuotes.length > 0) {
        await Promise.all(existingQuotes.map((quote, index) => prisma.omegaQuote.update({
            where: { id: quote.id },
            data: { userPosterId: seededUsers[index % seededUsers.length].id },
        })))
        console.log(`[seed] attached posters to ${existingQuotes.length} existing quotes.`)
    } else {
        const now = Date.now()
        await prisma.omegaQuote.createMany({
            data: quotes.map((quote, index) => ({
                ...quote,
                timestamp: new Date(now - index * 1000 * 60 * 60 * 6),
                userPosterId: seededUsers[index % seededUsers.length].id,
            })),
        })
    }

    console.log(`[seed] ${people.length} users (password "${SEED_PASSWORD}"), 2 groups, ${quotes.length} quotes.`)
    console.log('[seed] "vegard" and "ada" are administrators.')
}

async function seedEvents() {
    if (await prisma.event.count() > 0) {
        console.log('[seed] events already present, skipping.')
        return
    }

    const seededUsers = await prisma.user.findMany({ select: { id: true } })
    // --- Events ---------------------------------------------------------------------------
    const tagData = [
        { name: 'Bedpres', description: 'Bedriftspresentasjon', colorR: 37, colorG: 99, colorB: 235 },
        { name: 'Fest', description: 'Sosialt', colorR: 190, colorG: 24, colorB: 93 },
        { name: 'Faglig', description: 'Kurs og foredrag', colorR: 15, colorG: 118, colorB: 110 },
    ]
    const tags = []
    for (const tag of tagData) {
        tags.push(await prisma.eventTag.create({ data: tag }))
    }

    const hour = 60 * 60 * 1000
    const day = 24 * hour
    const nowMs = Date.now()

    const eventData = [
        {
            name: 'Kickoff for høstsemesteret',
            location: 'Storsalen',
            descriptionMd: 'Vi sparker i gang semesteret med mat, quiz og altfor høy musikk.',
            start: nowMs + 3 * day, hours: 4, places: 3, waitingList: true, tag: 1,
        },
        {
            name: 'Bedriftspresentasjon med Bekk',
            location: 'A2-104',
            descriptionMd: 'Bekk kommer innom for å fortelle om hva de driver med.',
            start: nowMs + 9 * day, hours: 2, places: 60, waitingList: true, tag: 0,
        },
        {
            name: 'Introduksjon til SvelteKit',
            location: 'Kjelleren',
            descriptionMd: 'Et kurs om hvordan en porterer en Next-app uten å miste tjenestelaget.',
            start: nowMs + 16 * day, hours: 3, places: 25, waitingList: false, tag: 2,
        },
        {
            name: 'Juleball',
            location: 'Rådhuset',
            descriptionMd: 'Årets høydepunkt. Dresskode: mørk dress.',
            start: nowMs - 40 * day, hours: 6, places: 120, waitingList: true, tag: 1,
        },
        {
            name: 'Workshop: Prisma i praksis',
            location: 'A1-101',
            descriptionMd: 'Vi gikk gjennom relasjoner, migreringer og hvorfor engines er vanskelig på NixOS.',
            start: nowMs - 12 * day, hours: 2, places: 30, waitingList: false, tag: 2,
        },
    ]

    for (const item of eventData) {
        await prisma.event.create({
            data: {
                name: item.name,
                location: item.location,
                descriptionMd: item.descriptionMd,
                eventStart: new Date(item.start),
                eventEnd: new Date(item.start + item.hours * hour),
                canBeViewdBy: 'ALL',
                takesRegistration: true,
                places: item.places,
                waitingList: item.waitingList,
                registrationStart: new Date(nowMs - day),
                registrationEnd: new Date(item.start),
                createdById: seededUsers[0].id,
                eventTagEvents: { create: [{ tagId: tags[item.tag].id }] },
            },
        })
    }

    console.log(`[seed] ${eventData.length} events, ${tags.length} tags.`)
}

async function main() {
    await seedUsers()
    await seedEvents()
}

main()
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
