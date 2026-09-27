import { readPageInputSchemaObject } from '@/lib/paging/schema'
import { EventCanView } from '../../../../generated/prisma/client.js'
import { z } from 'zod'
import { zfd } from 'zod-form-data'

/**
 * Ported from projectNext's src/services/events/schemas.ts.
 *
 * projectNext's Zpn helpers (Zpn.date, Zpn.checkboxOrBoolean, Zpn.numberListCheckboxFriendly)
 * wrap zod to cope with how HTML forms serialise dates, checkboxes and repeated fields. svele
 * uses zod-form-data for the same job, since it is already a dependency.
 */
const baseSchema = z.object({
    name: z.string().min(5, 'Navnet må være minst 5 tegn').max(70, 'Navnet må være maks 70 tegn'),
    location: z.string().min(2, 'Stedet må være minst 2 tegn'),
    descriptionMd: z.string().max(8000).optional(),
    coverImageUrl: z.string().url('Må være en gyldig URL').or(z.literal('')).optional(),
    eventStart: z.coerce.date({ invalid_type_error: 'Ugyldig starttid' }),
    eventEnd: z.coerce.date({ invalid_type_error: 'Ugyldig sluttid' }),
    canBeViewdBy: z.nativeEnum(EventCanView),

    takesRegistration: zfd.checkbox(),
    places: zfd.numeric(z.number().int().min(0).optional()),
    registrationStart: z.coerce.date().optional(),
    registrationEnd: z.coerce.date().optional(),

    waitingList: zfd.checkbox(),

    tagIds: zfd.repeatable(z.array(zfd.numeric(z.number().int())).optional()),
})

const waitingListRefiner = (data: { waitingList?: boolean, takesRegistration?: boolean }) =>
    (data.takesRegistration || !data.waitingList)
const waitingListMessage = 'Kan ikke ha venteliste uten påmelding'

const eventTimesRefiner = (data: { eventStart?: Date, eventEnd?: Date }) =>
    !data.eventStart || !data.eventEnd || data.eventEnd >= data.eventStart
const eventTimesMessage = 'Arrangementet kan ikke slutte før det starter'

const fields = {
    name: true,
    location: true,
    descriptionMd: true,
    coverImageUrl: true,
    eventStart: true,
    eventEnd: true,
    canBeViewdBy: true,
    takesRegistration: true,
    places: true,
    registrationStart: true,
    registrationEnd: true,
    tagIds: true,
    waitingList: true,
} as const

export const eventSchemas = {
    create: baseSchema.pick(fields)
        .refine(waitingListRefiner, waitingListMessage)
        .refine(eventTimesRefiner, { message: eventTimesMessage, path: ['eventEnd'] }),

    update: baseSchema.partial().pick(fields)
        .refine(waitingListRefiner, waitingListMessage)
        .refine(eventTimesRefiner, { message: eventTimesMessage, path: ['eventEnd'] }),

    readManyArchivedPage: readPageInputSchemaObject(
        z.number(),
        z.object({ id: z.number() }),
        z.object({
            name: z.string().optional(),
            tags: z.array(z.string()).nullable(),
        }),
    ),
}
