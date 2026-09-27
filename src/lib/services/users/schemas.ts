import { readPageInputSchemaObject } from '@/lib/paging/schema'
import { RelationshipStatus, SEX } from '../../../../generated/prisma/client.js'
import { z } from 'zod'

/**
 * Ported from projectNext's src/services/users/schemas.ts. Dropped with their domains:
 * studentCard, imageConsent, updateProfileImage, registerNewEmail, verifyEmail.
 *
 * The password minimum is projectNext's 12 characters; its error message is not, because the
 * original is a joke that does not describe the rule.
 */
export const userSchema = z.object({
    username: z.string().max(50).min(2).toLowerCase(),
    sex: z.nativeEnum(SEX).optional().nullable(),
    email: z.string().max(200).min(2).email('Ugyldig e-postadresse'),
    emailVerified: z.string().datetime({}).optional().nullable(),
    mobile: z.string().regex(/^\+?\d{4,20}$/, 'Skriv kun tall, uten mellomrom.').optional().nullable(),
    firstname: z.string().max(50).min(2),
    lastname: z.string().max(50).min(2),
    allergies: z.string().max(150).optional().nullable(),
    bio: z.string().max(2047).optional(),
    relationshipStatusText: z.string().max(150).optional(),
    relationshipStatus: z.nativeEnum(RelationshipStatus).optional(),
    password: z.string().max(50).min(12, 'Passordet må ha minst 12 tegn'),
    confirmPassword: z.string().max(50).min(12),
})

const refinePassword = {
    fcn: (data: { password?: string, confirmPassword?: string }) => data.password === data.confirmPassword,
    message: 'Passordene må være like',
}

const groupFilter = z.object({
    groupOrder: z.union([z.number(), z.literal('ACTIVE')]),
    groupId: z.number(),
})

export const userSchemas = {
    create: userSchema.pick({
        email: true,
        firstname: true,
        lastname: true,
        username: true,
    }),

    update: userSchema.partial().pick({
        email: true,
        firstname: true,
        lastname: true,
        username: true,
        mobile: true,
        allergies: true,
        sex: true,
        bio: true,
        relationshipStatusText: true,
        relationshipStatus: true,
    }),

    updateProfile: userSchema.partial().pick({
        allergies: true,
        sex: true,
        bio: true,
        relationshipStatusText: true,
        relationshipStatus: true,
    }),

    updatePassword: userSchema.pick({
        password: true,
        confirmPassword: true,
    }).refine(refinePassword.fcn, { message: refinePassword.message, path: ['confirmPassword'] }),

    readPage: readPageInputSchemaObject(
        z.number(),
        z.object({ id: z.number() }),
        z.object({
            partOfName: z.string(),
            groups: z.array(groupFilter),
            selectedGroup: groupFilter.nullable().optional(),
            sort: z.object({
                field: z.enum(['name', 'username']),
                direction: z.enum(['asc', 'desc']),
            }).optional(),
        })
    ),
}
