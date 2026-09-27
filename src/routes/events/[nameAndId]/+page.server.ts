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

    // Reading the whole registration list needs EVENT_REGISTRATION_READ. Not having it is normal,
    // so a refusal is an absent list rather than a failed page. "Am I registered" is a separate,
    // self-scoped question - otherwise an ordinary member could never see their own state.
    const [registrations, own] = await Promise.all([
        callOperation(eventRegistrationOperations.readMany, { params: { eventId: id } }, locals),
        callOperation(eventRegistrationOperations.readOwn, { params: { eventId: id } }, locals),
    ])

    return {
        event,
        registrations: registrations.success ? registrations.data : null,
        own: own.success ? own.data : null,
        canRegister: Boolean(locals.session.user),
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
