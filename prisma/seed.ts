import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js'

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DB_URI }),
})

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

async function main() {
    const existing = await prisma.omegaQuote.count()
    if (existing > 0) {
        console.log(`[seed] ${existing} quotes already present, skipping.`)
        return
    }

    // Spread the timestamps out so cursor paging has a meaningful ordering to page through.
    const now = Date.now()
    await prisma.omegaQuote.createMany({
        data: quotes.map((quote, index) => ({
            ...quote,
            timestamp: new Date(now - index * 1000 * 60 * 60 * 6),
        })),
    })
    console.log(`[seed] inserted ${quotes.length} quotes.`)
}

main()
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
