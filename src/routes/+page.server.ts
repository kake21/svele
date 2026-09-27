import { omegaquoteOperations } from '@/services/omegaquotes/operations'
import { omegaQuotePageSize } from '@/services/omegaquotes/constants'
import { callOperation, makeFormAction, unwrapActionReturn } from '@/server/action'
import type { Actions, PageServerLoad } from './$types'

/**
 * Compare with projectNext's src/app/omegaquotes/page.tsx. Same three steps - read the session,
 * decide what the visitor may do, fetch page 0 server-side - except the fetch goes through
 * callOperation instead of an imported server action, and the result is returned as data rather
 * than rendered here.
 */
export const load: PageServerLoad = async ({ locals }) => {
    const quotes = unwrapActionReturn(await callOperation(omegaquoteOperations.readPage, {
        params: {
            paging: {
                page: {
                    pageSize: omegaQuotePageSize,
                    page: 0,
                    cursor: null,
                },
                details: undefined,
            },
        },
    }, locals))

    return {
        quotes,
        pageSize: omegaQuotePageSize,
        // With no login everyone may post. This is the line that becomes an authorizer check once
        // there is a session - see src/lib/services/omegaquotes/auth.ts.
        canCreate: true,
    }
}

/**
 * The form action. This is the piece that replaces `createQuoteAction` from actions.ts - note that
 * there is no actions.ts in svele at all: SvelteKit's transport layer lives in the route file, so
 * the service folder has no transport file of its own.
 */
export const actions = {
    create: makeFormAction(omegaquoteOperations.create),
} satisfies Actions
