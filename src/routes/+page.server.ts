import { callOperation } from '@/server/action'
import { eventOperations } from '@/services/events/operations'
import { omegaquoteOperations } from '@/services/omegaquotes/operations'
import { userOperations } from '@/services/users/operations'
import type { PageServerLoad } from './$types'

const ROWS = 3

/**
 * Every section reads through the ported operations, so each is subject to its own authorizer -
 * which is what makes the empty states meaningful rather than decorative. A visitor without
 * USERS_READ gets an empty Brukere island, not an error page, exactly as projectNext leaves out
 * the islands a member lacks the permission for.
 */
export const load: PageServerLoad = async ({ locals }) => {
    const [upcoming, archived, quotes, users] = await Promise.all([
        callOperation(eventOperations.readManyCurrent, { params: { tags: null } }, locals),
        callOperation(eventOperations.readManyArchivedPage, {
            params: {
                paging: {
                    page: { pageSize: ROWS, page: 0, cursor: null },
                    details: { name: '', tags: null },
                },
            },
        }, locals),
        callOperation(omegaquoteOperations.readPage, {
            params: {
                paging: { page: { pageSize: ROWS, page: 0, cursor: null }, details: undefined },
            },
        }, locals),
        callOperation(userOperations.readPage, {
            params: {
                paging: {
                    page: { pageSize: ROWS, page: 0, cursor: null },
                    details: {
                        partOfName: '',
                        groups: [],
                        selectedGroup: null,
                        sort: { field: 'name' as const, direction: 'asc' as const },
                    },
                },
            },
        }, locals),
    ])

    return {
        upcoming: upcoming.success ? upcoming.data.slice(0, ROWS) : [],
        archived: archived.success ? archived.data : [],
        quotes: quotes.success ? quotes.data : [],
        users: users.success ? users.data : [],
        // Told apart so the empty state can say why it is empty.
        canReadUsers: users.success,
        canReadQuotes: quotes.success,
        signedIn: Boolean(locals.session.user),
    }
}
