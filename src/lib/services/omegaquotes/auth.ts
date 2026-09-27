import { RequireNothing } from '@/server/authorizer'

/**
 * projectNext has:
 *   create:   RequirePermissionAndUserId.staticFields({ permission: 'OMEGAQUOTES_WRITE' })
 *   readPage: RequirePermission.staticFields({ permission: 'OMEGAQUOTES_READ' })
 *
 * svele has no login yet, so both are open. The file exists - and the operations still reference it
 * - so that adding auth later is an edit here plus a populated session, and nothing else.
 */
export const omegaQuotesAuth = {
    create: RequireNothing.staticFields(),
    readPage: RequireNothing.staticFields(),
} as const
