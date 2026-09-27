import { z } from 'zod'
import { zfd } from 'zod-form-data'

const baseSchema = z.object({
    name: z.string().min(2, 'Navnet må være minst 2 tegn').max(40),
    description: z.string().max(200).optional(),
    colorR: zfd.numeric(z.number().int().min(0).max(255)),
    colorG: zfd.numeric(z.number().int().min(0).max(255)),
    colorB: zfd.numeric(z.number().int().min(0).max(255)),
})

export const eventTagSchemas = {
    create: baseSchema,
    update: baseSchema.partial(),
}
