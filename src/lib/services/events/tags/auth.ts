import { RequireNothing, RequirePermission } from '@/server/auth/authorizer'

export const eventTagAuth = {
    readAll: RequireNothing.staticFields({}),
    create: RequirePermission.staticFields({ permission: 'EVENT_ADMIN' }),
    update: RequirePermission.staticFields({ permission: 'EVENT_ADMIN' }),
    destroy: RequirePermission.staticFields({ permission: 'EVENT_ADMIN' }),
} as const
