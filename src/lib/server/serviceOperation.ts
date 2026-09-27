import { AsyncLocalStorage } from 'node:async_hooks'
import { zfd } from 'zod-form-data'
import { ParseError, Smorekopp } from '@/services/error'
import { prisma as globalPrisma } from './prisma'
import { prismaErrorWrapper } from './prismaCall'
import { emptySession } from './auth/session'
import logger from './logger'
import type { z } from 'zod'
import type { Prisma, PrismaClient } from '../../../generated/prisma/client.js'
import type { AuthorizerDynamicFieldsBound } from './auth/authorizer/Authorizer'
import type { SessionMaybeUser } from './auth/session'

/**
 * A pared-down port of projectNext's src/services/serviceOperation.ts.
 *
 * What is kept, because it is the part worth evaluating:
 *   - defineOperation with paramsSchema / dataSchema / authorizer / operation
 *   - zod validation of params and data before the operation body runs, with FormData support
 *   - AsyncLocalStorage context, so a nested operation inherits prisma (and thus a transaction),
 *     the session and the bypassAuth flag from its caller
 *   - the opensTransaction flag and its type-level consequence for the prisma client
 *   - internalCall, for calling an operation from another operation without an authorizer
 *
 * What is dropped, because it is orthogonal to "does this pattern work in SvelteKit":
 *   - defineSubOperation / .implement() / implementationParams
 *   - ownershipCheck and beforeRun hooks
 *   - prismaWhereFilter threaded out of the authorizer
 */

export type InferedOrInput<Schema extends z.ZodTypeAny | undefined, InferedOfInput extends 'INFERED' | 'INPUT'> =
    Schema extends undefined
        ? object
        : InferedOfInput extends 'INFERED' ? z.infer<NonNullable<Schema>> : z.input<NonNullable<Schema>>

export type ParamsObject<ParamsSchema extends z.ZodTypeAny | undefined, InferedOfInput extends 'INFERED' | 'INPUT'> =
    ParamsSchema extends undefined
        ? object
        : { params: InferedOrInput<ParamsSchema, InferedOfInput> }

export type DataObject<DataSchema extends z.ZodTypeAny | undefined, InferedOfInput extends 'INFERED' | 'INPUT'> =
    DataSchema extends undefined
        ? object
        : { data: InferedOrInput<DataSchema, InferedOfInput> }

/**
 * Arguments accepted by a service operation. 'UNSAFE' is what the transport layer passes - raw
 * unknowns straight off the wire, validated inside. 'SAFE' is what typed server-side callers pass.
 */
export type ServiceOperationExecuteArgs<
    Unsafe extends 'UNSAFE' | 'SAFE',
    ParamsSchema extends z.ZodTypeAny | undefined,
    DataSchema extends z.ZodTypeAny | undefined,
> = Unsafe extends 'UNSAFE'
    ? { params?: unknown, data?: unknown }
    : ParamsObject<ParamsSchema, 'INPUT'> & DataObject<DataSchema, 'INPUT'>

/**
 * An operation that declares `opensTransaction` is entitled to a full PrismaClient, since only that
 * can open a transaction. Everything else gets a TransactionClient, which is also what it would
 * receive if it were called from inside one. The [OpensTransaction] extends [true] form prevents the
 * conditional distributing over `boolean` and producing an unwieldy union - same reasoning as
 * projectNext's comment on this type.
 */
export type PrismaPossibleTransaction<OpensTransaction extends boolean> =
    [OpensTransaction] extends [true] ? PrismaClient : Prisma.TransactionClient

export type ServiceOperationContext<OpensTransaction extends boolean = boolean> = {
    prisma: PrismaPossibleTransaction<OpensTransaction>,
    session: SessionMaybeUser,
    bypassAuth: boolean,
}

export type ServiceOperationOperation<
    OpensTransaction extends boolean,
    ParamsSchema extends z.ZodTypeAny | undefined,
    DataSchema extends z.ZodTypeAny | undefined,
    Return,
> = (
    args: ParamsObject<ParamsSchema, 'INFERED'>
        & DataObject<DataSchema, 'INFERED'>
        & ServiceOperationContext<OpensTransaction>
) => Promise<Return> | Return

export type AuthorizerGetter<
    ParamsSchema extends z.ZodTypeAny | undefined,
    DataSchema extends z.ZodTypeAny | undefined,
> = (
    args: ParamsObject<ParamsSchema, 'INFERED'>
        & DataObject<DataSchema, 'INFERED'>
        & Pick<ServiceOperationContext<boolean>, 'prisma'>
) => AuthorizerDynamicFieldsBound | Promise<AuthorizerDynamicFieldsBound>

export type ServiceOperation<
    OpensTransaction extends boolean,
    Return,
    ParamsSchema extends z.ZodTypeAny | undefined = undefined,
    DataSchema extends z.ZodTypeAny | undefined = undefined,
> = {
    <Unsafe extends 'UNSAFE' | 'SAFE' = 'SAFE'>(
        args: ServiceOperationExecuteArgs<Unsafe, ParamsSchema, DataSchema>
            & Partial<ServiceOperationContext<OpensTransaction>>
    ): Promise<Return>,
    paramsSchema?: ParamsSchema,
    dataSchema?: DataSchema,
    /**
     * Call this operation from inside another operation, skipping the authorizer. The caller has
     * already been authorized; the inner operation inherits the outer prisma client and session
     * through AsyncLocalStorage, so a call made inside a transaction stays inside it.
     */
    internalCall: (
        args: ServiceOperationExecuteArgs<'SAFE', ParamsSchema, DataSchema>
            & Partial<ServiceOperationContext<OpensTransaction>>
    ) => Promise<Return>,
}

/**
 * Extracts the caller-facing `{ params }` input type of an operation. See projectNext's note: the
 * `extends undefined` direction is deliberate, because reading an optional property always yields
 * `Schema | undefined`.
 */
export type Params<T extends { paramsSchema?: z.ZodTypeAny }> =
    T['paramsSchema'] extends undefined ? never : z.input<NonNullable<T['paramsSchema']>>

export type Data<T extends { dataSchema?: z.ZodTypeAny }> =
    T['dataSchema'] extends undefined ? never : z.input<NonNullable<T['dataSchema']>>

const asyncLocalStorage = new AsyncLocalStorage<ServiceOperationContext>()

/**
 * Runs a callback with a specific service operation context, inheriting anything not overridden
 * from the enclosing operation's context.
 */
export function withServiceContext<T, OpensTransaction extends boolean>(
    contextOverride: Partial<ServiceOperationContext<OpensTransaction>>,
    opensTransaction: OpensTransaction | undefined,
    callback: (context: ServiceOperationContext<OpensTransaction>) => T,
): T {
    const localContext = asyncLocalStorage.getStore()

    const isAppropriateClient = (
        client: PrismaClient | Prisma.TransactionClient
    ): client is PrismaPossibleTransaction<OpensTransaction> => !opensTransaction || '$transaction' in client

    const prisma = contextOverride.prisma ?? localContext?.prisma ?? globalPrisma
    if (!isAppropriateClient(prisma)) {
        throw new Smorekopp(
            'SERVER ERROR',
            'Service operation is configured to open a transaction, but the prisma client in the context is a transaction client.'
        )
    }

    const context: ServiceOperationContext<OpensTransaction> = {
        prisma,
        session: contextOverride.session ?? localContext?.session ?? emptySession,
        bypassAuth: contextOverride.bypassAuth ?? localContext?.bypassAuth ?? false,
    }

    return asyncLocalStorage.run(context as ServiceOperationContext, () => callback(context))
}

export function getContext(): ServiceOperationContext | undefined {
    return asyncLocalStorage.getStore()
}

export function defineOperation<
    OpensTransaction extends boolean,
    Return,
    ParamsSchema extends z.ZodTypeAny | undefined = undefined,
    DataSchema extends z.ZodTypeAny | undefined = undefined,
>({ paramsSchema, dataSchema, opensTransaction, authorizer, operation }: {
    paramsSchema?: ParamsSchema,
    dataSchema?: DataSchema,
    opensTransaction?: OpensTransaction,
    authorizer: AuthorizerGetter<ParamsSchema, DataSchema>,
    operation: ServiceOperationOperation<OpensTransaction, ParamsSchema, DataSchema, Return>,
}): ServiceOperation<OpensTransaction, Return, ParamsSchema, DataSchema> {
    const execute = async ({ params, data, ...context }:
        ServiceOperationExecuteArgs<'UNSAFE', ParamsSchema, DataSchema>
        & Partial<ServiceOperationContext<OpensTransaction>>
    ): Promise<Return> => {
        const args: { params?: unknown, data?: unknown } = { params, data }

        if (args.params !== undefined) {
            if (!paramsSchema) {
                throw new Smorekopp('BAD PARAMETERS', 'Service operation recieved params, but has no params schema.')
            }
            const paramsParse = paramsSchema.safeParse(args.params)
            if (!paramsParse.success) {
                logger.debug('Service operation params failed validation.', { paramsParse })
                throw new Smorekopp('BAD PARAMETERS', 'Invalid params passed to service operation.')
            }
            args.params = paramsParse.data
        }

        if (args.data !== undefined) {
            if (!dataSchema) {
                throw new Smorekopp('BAD PARAMETERS', 'Service operation recieved data, but has no data schema.')
            }
            // zfd.formData accepts both a FormData instance and a plain object, so a form POST and
            // a typed server-side call go through the same schema.
            const dataParse = zfd.formData(dataSchema).safeParse(args.data)
            if (!dataParse.success) {
                logger.debug('Service operation data failed validation.', { dataParse })
                throw new ParseError(dataParse)
            }
            args.data = dataParse.data
        }

        if (Boolean(args.params) !== Boolean(paramsSchema) || Boolean(args.data) !== Boolean(dataSchema)) {
            throw new Smorekopp('SERVER ERROR', 'Service operation recieved invalid arguments.')
        }

        return withServiceContext(context, opensTransaction, async ({ prisma, session, bypassAuth }) => {
            // Authorization happens after validation, because an authorizer is allowed to read the
            // validated params and data to decide.
            if (!bypassAuth) {
                const bound = await prismaErrorWrapper(() => authorizer({ ...args, prisma } as never))
                const authResult = bound.auth(session)
                if (!authResult.authorized) {
                    // A failed AuthResult can only carry these two statuses. The distinction is
                    // the one the transport layer turns into 401 vs 403: UNAUTHENTICATED means
                    // logging in would help, UNAUTHORIZED means it would not.
                    throw new Smorekopp(
                        authResult.status === 'UNAUTHENTICATED' ? 'UNAUTHENTICATED' : 'UNAUTHORIZED',
                        authResult.getErrorMessage
                    )
                }
            }

            return prismaErrorWrapper(() => operation({ ...args, prisma, session, bypassAuth } as never))
        })
    }

    execute.paramsSchema = paramsSchema
    execute.dataSchema = dataSchema
    execute.internalCall = (
        args: ServiceOperationExecuteArgs<'SAFE', ParamsSchema, DataSchema>
            & Partial<ServiceOperationContext<OpensTransaction>>
    ) => execute({ ...args, bypassAuth: true } as never)

    return execute as ServiceOperation<OpensTransaction, Return, ParamsSchema, DataSchema>
}
