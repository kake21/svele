import type { LayoutServerLoad } from './$types'

/**
 * The session is resolved once per request in hooks.server.ts; this is what hands the parts the
 * chrome needs down to every page. projectNext passes only the username into its nav components
 * for the same reason - the whole profile would serialise email, memberships and permissions into
 * the page payload.
 */
export const load: LayoutServerLoad = async ({ locals }) => ({
    user: locals.session.user
        ? {
            username: locals.session.user.username,
            firstname: locals.session.user.firstname,
        }
        : null,
    canReadUsers: locals.session.permissions.includes('USERS_READ'),
})
