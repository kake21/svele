import { callOperation, unwrapActionReturn } from '@/server/action'
import { userOperations } from '@/services/users/operations'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, params }) => {
    const user = unwrapActionReturn(await callOperation(userOperations.readProfile, {
        params: { username: params.username },
    }, locals))

    return {
        profile: user,
        // Whether the viewer may edit this profile is the authorizer's question, asked once here
        // rather than re-derived in the component.
        canEdit: locals.session.user?.username === params.username
            || locals.session.permissions.includes('USERS_UPDATE'),
    }
}
