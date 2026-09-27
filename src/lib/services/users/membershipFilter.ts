import type { Prisma } from '../../../../generated/prisma/client.js'

/**
 * Ported from projectNext's src/auth/getMembershipFilter.ts.
 *
 * A membership belongs to an "order" (roughly, a semester). 'ACTIVE' selects current memberships
 * regardless of order, 'ALL' selects everything, and a number selects one specific order.
 */
export type MembershipSelectorType = number | 'ACTIVE' | 'ALL'

export function getMembershipFilter(
    order: MembershipSelectorType,
    groupId?: number | undefined,
    admin: boolean | undefined = undefined
) {
    return {
        groupId,
        admin,
        active: order === 'ACTIVE' ? true : undefined,
        order: typeof order === 'number' ? order : undefined,
    } satisfies Prisma.MembershipWhereInput
}
