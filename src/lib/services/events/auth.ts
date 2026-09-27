import { RequireNothing, RequirePermission } from '@/server/auth/authorizer'

/**
 * projectNext leaves a TODO here: everything but create is RequireNothing, with a comment saying
 * to replace them with proper authorizers. svele keeps create/update/destroy behind permissions
 * and leaves the reads open, which is what the TODO was heading towards - reading the event list
 * is public on the real site.
 */
export const eventAuth = {
    create: RequirePermission.staticFields({ permission: 'EVENT_CREATE' }),
    read: RequireNothing.staticFields({}),
    readManyCurrent: RequireNothing.staticFields({}),
    readManyArchivedPage: RequireNothing.staticFields({}),
    update: RequirePermission.staticFields({ permission: 'EVENT_ADMIN' }),
    destroy: RequirePermission.staticFields({ permission: 'EVENT_ADMIN' }),
} as const
