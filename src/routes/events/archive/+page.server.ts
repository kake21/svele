import { callOperation, unwrapActionReturn } from '@/server/action'
import { eventOperations } from '@/services/events/operations'
import { eventTagOperations } from '@/services/events/tags/operations'
import { eventPageSize } from '@/services/events/constants'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, url }) => {
    const tags = url.searchParams.getAll('tag')
    const name = url.searchParams.get('q') ?? ''

    const [events, tagsAvailable] = await Promise.all([
        callOperation(eventOperations.readManyArchivedPage, {
            params: {
                paging: {
                    page: { pageSize: eventPageSize, page: 0, cursor: null },
                    details: { name, tags: tags.length > 0 ? tags : null },
                },
            },
        }, locals),
        callOperation(eventTagOperations.readAll, {}, locals),
    ])

    return {
        events: unwrapActionReturn(events),
        tags: unwrapActionReturn(tagsAvailable),
        activeTags: tags,
        query: name,
        pageSize: eventPageSize,
        title: 'Arrangementsarkiv',
    }
}
