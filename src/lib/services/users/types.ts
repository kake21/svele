import type { userFieldsToExpose } from './constants'
import type { userSchemas } from './schemas'
import type { InferPagingCursor, InferPagingDetails } from '@/lib/paging/schema'
import type { User } from '../../../../generated/prisma/client.js'

export type UserFiltered = Pick<User, typeof userFieldsToExpose[number]>

export type UserPagingReturn = UserFiltered & {
    memberships: {
        groupId: number,
        admin: boolean,
        title: string,
        group: { name: string },
    }[],
    selectedGroupInfo: { title?: string, admin?: boolean },
}

export type UserCursor = InferPagingCursor<typeof userSchemas.readPage>
export type UserPagingDetails = InferPagingDetails<typeof userSchemas.readPage>
