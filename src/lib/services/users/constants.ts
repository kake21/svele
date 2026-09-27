import { createSelection } from '@/services/createSelection'
import type { User } from '../../../../generated/prisma/client.js'

export const maxNumberOfGroupsInFilter = 7

/**
 * Trimmed from projectNext's userFieldsToExpose: studentCard, imageConsent and the flairs
 * relation are gone with the domains that owned them.
 */
export const userFieldsToExpose = [
    'id',
    'username',
    'firstname',
    'lastname',
    'email',
    'emailVerified',
    'mobile',
    'createdAt',
    'updatedAt',
    'acceptedTerms',
    'sex',
    'allergies',
    'relationshipStatus',
    'relationshipStatusText',
    'bio',
] as const satisfies (keyof User)[]

export const userFilterSelection = createSelection([...userFieldsToExpose])

export const userPageSize = 20

export const sexConfig = {
    MALE: { title: 'Broder', pronoun: 'Hands', label: 'Mann' },
    FEMALE: { title: 'Syster', pronoun: 'Hendes', label: 'Kvinne' },
    OTHER: { title: 'Sysken', pronoun: 'Hends', label: 'Annet' },
} as const

export const relationshipStatusConfig = {
    SINGLE: { label: 'Singel' },
    TAKEN: { label: 'I et forhold' },
    ITS_COMPLICATED: { label: 'Det er komplisert' },
    NOT_SPECIFIED: { label: 'Ikke spesifisert' },
} as const
