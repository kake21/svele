import { error } from '@sveltejs/kit'
import { callOperation, makeFormAction, unwrapActionReturn } from '@/server/action'
import { userOperations } from '@/services/users/operations'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, params }) => {
    const profile = unwrapActionReturn(await callOperation(userOperations.readProfile, {
        params: { username: params.username },
    }, locals))

    // Reading a profile and editing it are different rights. readProfile already passed, so this
    // is specifically the edit check.
    const isSelf = locals.session.user?.username === params.username
    if (!isSelf && !locals.session.permissions.includes('USERS_UPDATE')) {
        error(403, { message: 'Du har ikke tilgang til å redigere denne brukeren' })
    }

    return { profile, isSelf }
}

export const actions = {
    /**
     * Both actions route through the operation's own authorizer, so the load-function check above
     * is a courtesy for rendering - not the thing enforcing anything.
     */
    profile: makeFormAction(userOperations.updateProfile, event => ({
        username: event.params.username,
    })),

    password: makeFormAction(userOperations.updatePassword, event => ({
        id: Number(event.url.searchParams.get('id')),
    })),
} satisfies Actions
