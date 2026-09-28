import { callOperation, unwrapActionReturn } from '@/server/action'
import { userOperations } from '@/services/users/operations'
import { groupOperations } from '@/services/groups/operations'
import { userPageSize } from '@/services/users/constants'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, url }) => {
    const partOfName = url.searchParams.get('q') ?? ''
    const groupIdParam = url.searchParams.get('group')
    const groupId = groupIdParam ? Number(groupIdParam) : null
    const sortField = url.searchParams.get('sort') === 'username' ? 'username' as const : 'name' as const

    // The filter lives in the URL rather than in component state, so a filtered list is a
    // shareable link and the back button works. projectNext keeps it in a React paging context.
    const users = unwrapActionReturn(await callOperation(userOperations.readPage, {
        params: {
            paging: {
                page: { pageSize: userPageSize, page: 0, cursor: null },
                details: {
                    partOfName,
                    groups: [],
                    selectedGroup: groupId ? { groupId, groupOrder: 'ACTIVE' as const } : null,
                    sort: { field: sortField, direction: 'asc' as const },
                },
            },
        },
    }, locals))

    // The group filter needs GROUP_READ, which a plain member has and an anonymous visitor does
    // not. A missing filter is not a reason to fail the page.
    const groupsResult = await callOperation(groupOperations.readAll, {}, locals)

    return {
        users,
        groups: groupsResult.success ? groupsResult.data : [],
        pageSize: userPageSize,
        filter: { partOfName, groupId, sortField },
        title: 'Brukere',
    }
}
