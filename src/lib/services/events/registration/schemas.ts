import { z } from 'zod'

export const eventRegistrationSchemas = {
    createGuest: z.object({
        name: z.string().min(2, 'Navnet må være minst 2 tegn').max(80),
        email: z.string().email('Ugyldig e-postadresse').or(z.literal('')).optional(),
        mobile: z.string().regex(/^\+?\d{4,20}$/, 'Skriv kun tall, uten mellomrom.').or(z.literal('')).optional(),
    }),
}
