import { omegaQuotesAuth } from './auth'
import { omegaquoteSchemas } from './schemas'
import { omegaQuoteFilterSelection } from './constants'
import { defineOperation } from '@/server/serviceOperation'
import { cursorPageingSelection } from '@/lib/paging/cursorPageingSelection'

export const omegaquoteOperations = {
    create: defineOperation({
        authorizer: () => omegaQuotesAuth.create.dynamicFields({}),
        dataSchema: omegaquoteSchemas.create,
        // RequireUser declares USER_REQUIERED_FOR_AUTHORIZED, so reaching this body at all means
        // there is a user. projectNext passes the poster in as a parameter and cross-checks it
        // against the session; taking it from the session directly removes the chance to disagree.
        operation: async ({ prisma, data, session }) => await prisma.omegaQuote.create({
            data: {
                ...data,
                userPoster: session.user ? { connect: { id: session.user.id } } : undefined,
            },
            select: omegaQuoteFilterSelection,
        }),
    }),
    readPage: defineOperation({
        paramsSchema: omegaquoteSchemas.readPage,
        authorizer: () => omegaQuotesAuth.readPage.dynamicFields({}),
        operation: async ({ prisma, params }) => await prisma.omegaQuote.findMany({
            orderBy: {
                timestamp: 'desc',
            },
            ...cursorPageingSelection(params.paging.page),
            select: omegaQuoteFilterSelection,
        }),
    }),
} as const
