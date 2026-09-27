import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client'
import { ServerError, Smorekopp } from '@/services/error'
import logger from './logger'
import type { ErrorCode } from '@/services/error'

const errorMessagesMap: { [key: string]: [ErrorCode, string] } = {
    P2002: ['DUPLICATE', 'duplicate entry'],
    P2025: ['NOT FOUND', 'not found'],
}

/**
 * Wraps a prisma call and translates prisma errors into ServerErrors. Ported from projectNext's
 * prismaErrorWrapper.
 */
export async function prismaErrorWrapper<T>(call: () => T | Promise<T>): Promise<T> {
    try {
        return await call()
    } catch (error) {
        if (error instanceof Smorekopp) throw error

        if (!(error instanceof PrismaClientKnownRequestError)) {
            logger.error('Unknown error:', error)
            throw new ServerError('UNKNOWN ERROR', 'unknown error')
        }

        const mapped = errorMessagesMap[error.code]
        if (mapped) throw new ServerError(mapped[0], mapped[1])

        logger.error('Unknown prisma error:', error)
        throw new ServerError('UNKNOWN ERROR', 'unknown prisma error')
    }
}
