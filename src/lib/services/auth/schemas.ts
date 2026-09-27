import { z } from 'zod'

export const authSchemas = {
    authenticate: z.object({
        username: z.string().min(1, 'Skriv inn brukernavnet ditt'),
        password: z.string().min(1, 'Skriv inn passordet ditt'),
    }),
}
