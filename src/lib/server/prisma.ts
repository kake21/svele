import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../../generated/prisma/client.js'

// Prisma 7 requires a driver adapter - same PrismaPg setup as projectNext's src/prisma/client.ts,
// without the four query-log event handlers.
function newPrisma() {
    return new PrismaClient({
        adapter: new PrismaPg({ connectionString: process.env.DB_URI }),
    })
}

// A single client reused across HMR reloads in dev - without the globalThis cache Vite's module
// invalidation opens a new connection pool on every edit and Postgres runs out of connections.
const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof newPrisma> }

export const prisma = globalForPrisma.prisma ?? newPrisma()

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
}
