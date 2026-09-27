import { createSelection } from '@/services/createSelection'
import type { OmegaQuote } from '../../../../generated/prisma/client.js'

export const omegaQuoteFieldsToExpose = ['id', 'author', 'quote', 'timestamp'] as const satisfies (keyof OmegaQuote)[]
export const omegaQuoteFilterSelection = createSelection([...omegaQuoteFieldsToExpose])

export const omegaQuotePageSize = 20
