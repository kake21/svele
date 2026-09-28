import { callOperation } from '@/server/action'
import { eventOperations } from '@/services/events/operations'
import { omegaquoteOperations } from '@/services/omegaquotes/operations'
import { prisma } from '@/server/prisma'
import type { PageServerLoad } from './$types'

/**
 * The landing page reads through the same ported operations every other page uses, rather than
 * querying directly - so what it shows is subject to the same authorizers. The counts are the one
 * exception: they are aggregate numbers with no per-row authorization to apply, so they come
 * straight from prisma.
 *
 * No `title`: the header shows just "svele" here, since the page is already the site's front.
 */
export const load: PageServerLoad = async ({ locals }) => {
    const [events, quotes, counts] = await Promise.all([
        callOperation(eventOperations.readManyCurrent, { params: { tags: null } }, locals),
        callOperation(omegaquoteOperations.readPage, {
            params: {
                paging: { page: { pageSize: 3, page: 0, cursor: null }, details: undefined },
            },
        }, locals),
        Promise.all([
            prisma.user.count({ where: { archived: false } }),
            prisma.omegaQuote.count(),
            prisma.event.count(),
        ]),
    ])

    const [userCount, quoteCount, eventCount] = counts

    return {
        // A refusal is an empty section, not a failed page - an anonymous visitor lacking
        // OMEGAQUOTES_READ should still get a landing page.
        events: events.success ? events.data.slice(0, 3) : [],
        quotes: quotes.success ? quotes.data : [],
        counts: { users: userCount, quotes: quoteCount, events: eventCount },
        signedIn: Boolean(locals.session.user),
    }
}
