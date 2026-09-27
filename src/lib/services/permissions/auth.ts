import { RequireNothing } from '@/server/auth/authorizer'

export const permissionAuth = {
    readDefaultPermissions: RequireNothing.staticFields({}),
    readPermissionsOfUser: RequireNothing.staticFields({}),
} as const
