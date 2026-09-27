import { createSelection } from '@/services/createSelection'
import { EventCanView } from '../../../../generated/prisma/client.js'
import type { Event } from '../../../../generated/prisma/client.js'

export const eventCanBeViewdBy = {
    ALL: { label: 'Alle' },
    CAN_REGISTER: { label: 'Alle som kan melde seg på' },
} satisfies Record<EventCanView, { label: string }>

export const eventCanBeViewdByOptions = Object.values(EventCanView).map(option => ({
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
