import { json } from '@sveltejs/kit'
import { prisma } from '@/server/prisma'
import type { RequestHandler } from './$types'

/**
 * Liveness + readiness in one, for a platform health check.
 *
 * It touches the database rather than only returning 200, because a svele that cannot reach
 * Postgres serves an error page on every route - "the process is up" is not the useful question.
 * Nothing about the schema or the data is exposed.
 */
export const GET: RequestHandler = async () => {
    try {
        await prisma.$queryRaw`SELECT 1`
        return json({ status: 'ok' })
    } catch {
        return json({ status: 'degraded', database: 'unreachable' }, { status: 503 })
    }
}
