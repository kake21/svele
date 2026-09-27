import { createSelection } from '@/services/createSelection'
import type { Event, EventCanView } from '../../../../generated/prisma/client.js'

export const eventCanBeViewdBy = {
    ALL: { label: 'Alle' },
    CAN_REGISTER: { label: 'Alle som kan melde seg på' },
} satisfies Record<EventCanView, { label: string }>

// Derived from the record above rather than from Object.values(EventCanView).
//
// Reading the Prisma enum as a *value* pulls @prisma/client into whatever imports this - and the
// event create page does. Vite's dev server tolerates it; the production build fails outright
// trying to bundle node:crypto webcrypto for the browser. The record above is
// keyed by the enum, so its `satisfies` still fails the build if a variant is added unhandled.
export const eventCanBeViewdByOptions = (Object.keys(eventCanBeViewdBy) as EventCanView[])
    .map(option => ({
        value: option,
        label: eventCanBeViewdBy[option].label,
    }))

export const eventFieldsToExpose = [
    'id',
    'name',
    'descriptionMd',
    'coverImageUrl',
    'location',
    'eventStart',
    'eventEnd',
    'places',
    'waitingList',
    'registrationStart',
    'registrationEnd',
    'canBeViewdBy',
    'takesRegistration',
] as const satisfies (keyof Event)[]

export const eventFilterSelection = {
    ...createSelection([...eventFieldsToExpose]),
    _count: { select: { eventRegistrations: true } },
} as const

export const eventPageSize = 12
