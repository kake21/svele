import { resolveSession, SESSION_COOKIE } from '$lib/server/auth/sessionStore'
import type { Handle } from '@sveltejs/kit'

/**
 * Where authentication hooks in.
 *
 * projectNext resolves the session inside ServerSession.fromNextAuth(), called from makeAction -
 * so a request that triggers three actions resolves it three times. SvelteKit resolves it once,
 * here, and hands it down through event.locals. That is what makes Decision 2 (database sessions
 * rather than a JWT carrying permissions) cheap: one query per request, not one per action.
 */
export const handle: Handle = async ({ event, resolve }) => {
    event.locals.session = await resolveSession(event.cookies.get(SESSION_COOKIE))
    return resolve(event)
}
