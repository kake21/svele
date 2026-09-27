import type { ErrorCode, ErrorMessage } from './error'

/**
 * The return type of an action on error. Identical to projectNext, so client code that branches on
 * `success` behaves the same way.
 */
export type ActionError = {
    success: false,
    errorCode: ErrorCode,
    httpCode: number,
    error?: ErrorMessage[],
}

/**
 * The return type of an action on success.
 */
export type ActionData<T = undefined> = {
    success: true,
    data: T,
}

/**
 * The return type of an action. Either success with data or error with error info.
 */
export type ActionReturn<T = undefined> = ActionData<T> | ActionError
