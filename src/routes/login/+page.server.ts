import { fail, redirect } from '@sveltejs/kit'
import { authOperations } from '@/services/auth/operations'
import { createSession, SESSION_COOKIE } from '@/server/auth/sessionStore'
import { safeServerCall } from '@/services/actionError'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, url }) => {
    // Already signed in - nothing to do here.
    if (locals.session.user) redirect(303, url.searchParams.get('callbackUrl') ?? '/')

    return { callbackUrl: url.searchParams.get('callbackUrl') ?? '/' }
}

/**
 * Compare with projectNext's src/app/(auth)/login/page.tsx: a `'use client'` component that calls
 * NextAuth's signIn() from an onSubmit handler, so the page does not work without JavaScript.
 *
 * Here it is a plain form action. The browser posts the form, the server sets the cookie and
 * redirects. use:enhance upgrades it, but nothing depends on that.
 */
export const actions = {
    default: async event => {
        const formData = await event.request.formData()
        const callbackUrl = String(formData.get('callbackUrl') ?? '/')

        const result = await safeServerCall(() => authOperations.authenticate<'UNSAFE'>({
            data: formData,
            session: event.locals.session,
        }))

        if (!result.success) {
            return fail(result.httpCode, {
                ...result,
                // Never echo the password back into the rendered page.
                username: String(formData.get('username') ?? ''),
            })
        }

        const { token, expiresAt } = await createSession(result.data.userId)

        event.cookies.set(SESSION_COOKIE, token, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: !event.url.hostname.endsWith('localhost'),
            expires: expiresAt,
        })

        // Only ever redirect to a path on this site, never to an absolute URL an attacker supplied.
        redirect(303, callbackUrl.startsWith('/') ? callbackUrl : '/')
    },
} satisfies Actions
