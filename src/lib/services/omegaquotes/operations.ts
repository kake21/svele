import { omegaQuotesAuth } from './auth'
import { omegaquoteSchemas } from './schemas'
import { omegaQuoteFilterSelection } from './constants'
import { defineOperation } from '@/server/serviceOperation'
import { cursorPageingSelection } from '@/lib/paging/cursorPageingSelection'

export const omegaquoteOperations = {
    create: defineOperation({
        authorizer: () => omegaQuotesAuth.create.dynamicFields(),
        dataSchema: omegaquoteSchemas.create,
        operation: async ({ prisma, data }) => await prisma.omegaQuote.create({
            data,
            select: omegaQuoteFilterSelection,
        }),
    }),
    readPage: defineOperation({
        paramsSchema: omegaquoteSchemas.readPage,
        authorizer: () => omegaQuotesAuth.readPage.dynamicFields(),
        operation: async ({ prisma, params }) => await prisma.omegaQuote.findMany({
            orderBy: {
                timestamp: 'desc',
            },
            ...cursorPageingSelection(params.paging.page),
            select: omegaQuoteFilterSelection,
        }),
    }),
} as const
