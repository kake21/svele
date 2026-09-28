import { error, redirect } from '@sveltejs/kit'
import { callOperation, unwrapActionReturn } from '@/server/action'
import { eventOperations } from '@/services/events/operations'
import { eventTagOperations } from '@/services/events/tags/operations'
import { eventSlug } from '@/services/events/slug'
import { safeServerCall } from '@/services/actionError'
import { fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.session.permissions.includes('EVENT_CREATE')) {
        error(403, { message: 'Du har ikke tilgang til å lage arrangementer' })
    }

    return {
        tags: unwrapActionReturn(await callOperation(eventTagOperations.readAll, {}, locals)),
        title: 'Nytt arrangement',
    }
}

export const actions = {
    /**
     * Not makeFormAction, because success here is a redirect to the created event rather than a
     * value on the form prop - and a redirect has to be thrown from the action itself.
     */
    default: async (event) => {
        const formData = await event.request.formData()

        const result = await safeServerCall(() => eventOperations.create<'UNSAFE'>({
            data: formData,
            session: event.locals.session,
        }))

        if (!result.success) return fail(result.httpCode, result)

        redirect(303, `/events/${eventSlug(result.data)}`)
    },
} satisfies Actions
