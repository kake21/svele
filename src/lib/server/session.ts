/**
 * The session seam.
 *
 * projectNext has a rich Session / ServerSession pair backed by NextAuth JWTs, permissions and API
 * keys. svele has no login yet, so this is deliberately the smallest thing that preserves the
 * shape: every service operation still receives a session, and authorizers still receive it to
 * decide. When Auth.js (@auth/sveltekit) lands, this is the ONLY file that has to grow - the
 * operations and authorizers below already speak this interface.
 */
export type SessionUser = {
    id: number,
    username: string,
    permissions: string[],
}

export type Session = {
    user: SessionUser | null,
}

export const emptySession: Session = { user: null }

/**
 * In projectNext this is `ServerSession.fromNextAuth()`. Here it reads whatever `hooks.server.ts`
 * put on `event.locals`, falling back to the empty session.
 */
export function sessionFromLocals(locals: App.Locals): Session {
    return locals.session ?? emptySession
}
