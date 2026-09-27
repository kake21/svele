import { error } from '@sveltejs/kit'
import { callOperation, makeFormAction, unwrapActionReturn } from '@/server/action'
import { eventOperations } from '@/services/events/operations'
import { eventRegistrationOperations } from '@/services/events/registration/operations'
import { idFromSlug } from '@/services/events/slug'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, params }) => {
    const id = idFromSlug(params.nameAndId)
    if (id === null) error(404, { message: 'Fant ikke arrangementet' })

    const event = unwrapActionReturn(await callOperation(eventOperations.read, {
        params: { id },
    }, locals))

    // Reading the registration list needs EVENT_REGISTRATION_READ. Not having it is normal, so a
    // refusal here is an empty list, not a failed page.
    const registrations = await callOperation(eventRegistrationOperations.readMany, {
        params: { eventId: id },
    }, locals)

    const userId = locals.session.user?.id

    return {
        event,
        registrations: registrations.success ? registrations.data : null,
        isRegistered: registrations.success
            ? registrations.data.some(registration => registration.user?.id === userId)
            : null,
        canRegister: Boolean(userId),
        canAdmin: locals.session.permissions.includes('EVENT_ADMIN'),
    }
}

export const actions = {
    register: makeFormAction(eventRegistrationOperations.create, event => ({
        eventId: idFromSlug(event.params.nameAndId ?? ''),
        userId: event.locals.session.user?.id ?? -1,
    })),

    unregister: makeFormAction(eventRegistrationOperations.destroy, event => ({
        eventId: idFromSlug(event.params.nameAndId ?? ''),
        userId: event.locals.session.user?.id ?? -1,
    })),

    registerGuest: makeFormAction(eventRegistrationOperations.createGuest, event => ({
        eventId: idFromSlug(event.params.nameAndId ?? ''),
    })),
} satisfies Actions
