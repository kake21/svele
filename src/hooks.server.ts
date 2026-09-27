import { emptySession } from '$lib/server/session'
import type { Handle } from '@sveltejs/kit'

/**
 * Where authentication will hook in. projectNext resolves a session per request inside
 * `ServerSession.fromNextAuth()`, called from makeAction; SvelteKit's equivalent is to resolve it
 * once here and hand it down via `event.locals`, which is strictly nicer - one lookup per request
 * instead of one per action call.
 *
 * With no login, every request gets the empty session.
 */
export const handle: Handle = async ({ event, resolve }) => {
    event.locals.session = emptySession
    return resolve(event)
}
