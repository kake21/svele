import { errorCodes, ParseError, Smorekopp } from './error'
import type { ErrorCode, ErrorMessage } from './error'
import type { ActionError, ActionReturn } from './actionTypes'
import type { SafeParseError } from 'zod'

export function createActionError(errorCode: ErrorCode, error?: string | ErrorMessage[]): ActionError {
    return {
        success: false,
        errorCode,
        httpCode: errorCodes.find(code => code.name === errorCode)?.httpCode ?? 500,
        error: typeof error === 'string' ? [{ message: error }] : error,
    }
}

export function createZodActionError<T>(parse: SafeParseError<T>): ActionError {
    return {
        success: false,
        httpCode: 400,
        errorCode: 'BAD PARAMETERS',
        error: parse.error.issues,
    }
}

/**
 * Calls a service operation and converts thrown errors into an ActionReturn.
 * @warning Not called directly - makeFormAction / makeEndpoint do this for you.
 */
export async function safeServerCall<T>(call: () => Promise<T>): Promise<ActionReturn<T>> {
    try {
        return {
            success: true,
            data: await call(),
        }
    } catch (error) {
        if (error instanceof ParseError) {
            return createZodActionError(error.parseError)
        }
        if (error instanceof Smorekopp) {
            return createActionError(error.errorCode, error.errors)
        }
        return createActionError('UNKNOWN ERROR', 'unknown error')
    }
}
