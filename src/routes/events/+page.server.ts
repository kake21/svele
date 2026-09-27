import { callOperation, unwrapActionReturn } from '@/server/action'
import { eventOperations } from '@/services/events/operations'
import { eventTagOperations } from '@/services/events/tags/operations'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, url }) => {
    const tags = url.searchParams.getAll('tag')

    const [events, tagsAvailable] = await Promise.all([
        callOperation(eventOperations.readManyCurrent, {
            params: { tags: tags.length > 0 ? tags : null },
        }, locals),
        callOperation(eventTagOperations.readAll, {}, locals),
    ])

    return {
        events: unwrapActionReturn(events),
        tags: unwrapActionReturn(tagsAvailable),
        activeTags: tags,
        canCreate: locals.session.permissions.includes('EVENT_CREATE'),
    }
}
