import type { SafeParseError } from 'zod'

// Ported verbatim in spirit from projectNext's src/services/error.ts, trimmed to the codes the
// mini version can actually produce. Keeping the shape means the error-handling contract between
// operations and the transport layer is identical.
export const errorCodes = [
    { name: 'DUPLICATE', httpCode: 409, defaultMessage: 'En ressurs med samme navn eksisterer allerede' },
    { name: 'NOT FOUND', httpCode: 404, defaultMessage: 'Fant ikke ressursen' },
    { name: 'BAD PARAMETERS', httpCode: 400, defaultMessage: 'Feil i parametrene' },
    { name: 'BAD DATA', httpCode: 400, defaultMessage: 'Feil i dataen' },
    { name: 'UNKNOWN ERROR', httpCode: 500, defaultMessage: 'En ukjent feil har oppstått' },
    { name: 'SERVER ERROR', httpCode: 500, defaultMessage: 'En serverfeil har oppstått' },
    { name: 'NOT IMPLEMENTED', httpCode: 501, defaultMessage: 'Funksjonen er ikke implementert' },
    { name: 'UNAUTHORIZED', httpCode: 403, defaultMessage: 'Du har ikke tilgang til denne ressursen' },
    { name: 'UNAUTHENTICATED', httpCode: 401, defaultMessage: 'Du er ikke innlogget' },
    { name: 'DISSALLOWED', httpCode: 403, defaultMessage: 'Du har ikke lov til å gjøre dette' },
] as const satisfies {
    name: string
    httpCode: number
    defaultMessage: string
}[]

export type ErrorCode = typeof errorCodes[number]['name']

export type ErrorMessage = {
    path?: (number | string)[],
    message: string,
}

export class Smorekopp<ValidCodes extends ErrorCode = ErrorCode> extends Error {
    errorCode: ValidCodes
    errors: ErrorMessage[]

    constructor(errorCode: ValidCodes, errors?: string | ErrorMessage[]) {
        const parsedErrors = typeof errors === 'string'
            ? [{ message: errors }]
            : errors

        super(errorCode)

        this.errorCode = errorCode
        this.errors = parsedErrors ?? []
        this.name = 'ServiceError'
    }

    get httpCode() {
        return errorCodes.find(code => code.name === this.errorCode)?.httpCode ?? 500
    }
}

export class ServerError extends Smorekopp {
    public serviceCausedError: string | undefined
    constructor(errorCode: ErrorCode, errors: string | ErrorMessage[], serviceCausedError?: string) {
        super(errorCode, errors)
        this.serviceCausedError = serviceCausedError
    }
}

export class ParseError<Input> extends Smorekopp<'BAD PARAMETERS'> {
    public parseError: SafeParseError<Input>
    constructor(parseError: SafeParseError<Input>) {
        super('BAD PARAMETERS', 'Bad parameters')
        this.parseError = parseError
    }
}

export function getHttpErrorCode(errorType: ErrorCode): number {
    return errorCodes.find(error => error.name === errorType)?.httpCode ?? 500
}
