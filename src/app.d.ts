import type { SessionMaybeUser } from '$lib/server/auth/session'

declare global {
    namespace App {
        interface Locals {
            session: SessionMaybeUser
        }
    }
}

export {}
