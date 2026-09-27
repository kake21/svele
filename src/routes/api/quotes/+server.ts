import { omegaquoteOperations } from '@/services/omegaquotes/operations'
import { omegaQuotePageSize } from '@/services/omegaquotes/constants'
import { makeEndpoint } from '@/server/action'

/**
 * Paging endpoint for the client-side "load more". projectNext does this through a server action
 * called from the paging context; SvelteKit has no client-callable server function, so a real HTTP
 * endpoint is the honest equivalent.
 *
 * The cursor is the id of the last row the client already holds, matching cursorPageingSelection.
 */
export const GET = makeEndpoint(omegaquoteOperations.readPage, {
    getParams: ({ url }) => {
        const cursor = url.searchParams.get('cursor')
        const pageSize = Number(url.searchParams.get('pageSize') ?? omegaQuotePageSize)
        const page = Number(url.searchParams.get('page') ?? 0)

        return {
            paging: {
                page: cursor
                    ? { pageSize, page, cursor: { id: Number(cursor) } }
                    : { pageSize, page: 0, cursor: null },
                details: undefined,
            },
        }
    },
})
