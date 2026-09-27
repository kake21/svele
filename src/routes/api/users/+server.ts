import { makeEndpoint } from '@/server/action'
import { userOperations } from '@/services/users/operations'
import { userPageSize } from '@/services/users/constants'

/**
 * Paging endpoint for the user list's "load more", the same shape as /api/quotes.
 */
export const GET = makeEndpoint(userOperations.readPage, {
    getParams: ({ url }) => {
        const cursor = url.searchParams.get('cursor')
        const pageSize = Number(url.searchParams.get('pageSize') ?? userPageSize)
        const page = Number(url.searchParams.get('page') ?? 0)
        const groupId = url.searchParams.get('group') ? Number(url.searchParams.get('group')) : null

        return {
            paging: {
                page: cursor
                    ? { pageSize, page, cursor: { id: Number(cursor) } }
                    : { pageSize, page: 0, cursor: null },
                details: {
                    partOfName: url.searchParams.get('q') ?? '',
                    groups: [],
                    selectedGroup: groupId ? { groupId, groupOrder: 'ACTIVE' as const } : null,
                    sort: {
                        field: url.searchParams.get('sort') === 'username' ? 'username' as const : 'name' as const,
                        direction: 'asc' as const,
                    },
                },
            },
        }
    },
})
