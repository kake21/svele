import { RequirePermission } from '@/server/auth/authorizer'

export const groupAuth = {
    readAll: RequirePermission.staticFields({ permission: 'GROUP_READ' }),
} as const
