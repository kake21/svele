import type { eventFieldsToExpose } from './constants'
import type { Event, EventTag } from '../../../../generated/prisma/client.js'

export type EventFiltered = Pick<Event, typeof eventFieldsToExpose[number]>

export type EventExpanded = EventFiltered & {
    tags: EventTag[],
    numOfRegistrations: number,
    numOnWaitingList: number,
}
