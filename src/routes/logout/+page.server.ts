import { redirect } from '@sveltejs/kit'
import { destroySession, SESSION_COOKIE } from '@/server/auth/sessionStore'
import type { Actions } from './$types'

/**
 * A POST-only action rather than a link, so logging out cannot be triggered by a prefetch or an
 * <img> pointing at /logout.
 */
export const actions = {
    default: async ({ cookies }) => {
        const token = cookies.get(SESSION_COOKIE)
        if (token) await destroySession(token)
        cookies.delete(SESSION_COOKIE, { path: '/' })
        redirect(303, '/')
    },
} satisfies Actions
