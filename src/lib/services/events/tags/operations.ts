import { eventTagAuth } from './auth'
import { eventTagSchemas } from './schemas'
import { defineOperation } from '@/server/serviceOperation'
import { z } from 'zod'

/**
 * Ported from projectNext's src/services/events/tags/operations.ts. readSpecial is dropped with
 * the screen pages that were its only consumer.
 */
export const eventTagOperations = {
    readAll: defineOperation({
        authorizer: () => eventTagAuth.readAll.dynamicFields({}),
        operation: async ({ prisma }) => await prisma.eventTag.findMany({
            orderBy: { name: 'asc' },
        }),
    }),

    create: defineOperation({
        dataSchema: eventTagSchemas.create,
        authorizer: () => eventTagAuth.create.dynamicFields({}),
        operation: async ({ prisma, data }) => await prisma.eventTag.create({
            data: { ...data, description: data.description ?? '' },
        }),
    }),

    update: defineOperation({
        paramsSchema: z.object({ id: z.number() }),
        dataSchema: eventTagSchemas.update,
        authorizer: () => eventTagAuth.update.dynamicFields({}),
        operation: async ({ prisma, params, data }) => await prisma.eventTag.update({
            where: { id: params.id },
            data,
        }),
    }),

    destroy: defineOperation({
        paramsSchema: z.object({ id: z.number() }),
        authorizer: () => eventTagAuth.destroy.dynamicFields({}),
        operation: async ({ prisma, params }): Promise<null> => {
            await prisma.eventTag.delete({ where: { id: params.id } })
            return null
        },
    }),
} as const
