import { error, fail, json } from '@sveltejs/kit'
import { safeServerCall } from '@/services/actionError'
import { emptySession } from './auth/session'
import type { RequestEvent, RequestHandler } from '@sveltejs/kit'
import type { z } from 'zod'
import type { ActionReturn } from '@/services/actionTypes'
import type { ServiceOperation } from './serviceOperation'

/**
 * This file is the whole answer to "what replaces makeAction()".
 *
 * projectNext has one transport - the React Server Action - so `makeAction` is one function and
 * every caller looks the same. SvelteKit has two, and they are genuinely different things:
 *
 *   makeFormAction  ->  a `+page.server.ts` form action. Progressive enhancement for free; works
 *                       with JavaScript disabled; the result arrives as the page's `form` prop.
 *   makeEndpoint    ->  a `+server.ts` request handler. For client-initiated calls that are not a
 *                       form submission, like paging in more rows.
 *
 * Both funnel into the same `safeServerCall`, so the ActionReturn contract is identical to
 * projectNext's and the error shape a component branches on does not change between them.
 *
 * Note what is NOT here and does not need to be: the eight overloads of projectNext's makeAction.
 * Those exist to thread params/data/implementationParams presence through one call signature. Here
 * the route file already knows which of those it has, and passes them explicitly.
 */

type AnyOperation<Return, ParamsSchema extends z.ZodTypeAny | undefined, DataSchema extends z.ZodTypeAny | undefined> =
    ServiceOperation<boolean, Return, ParamsSchema, DataSchema>

/**
 * Wraps a service operation as a SvelteKit form action.
 *
 * The FormData goes in as `data` untouched - the operation's zfd schema parses it, exactly as in
 * projectNext. `getParams` supplies `params` from the request when the operation needs them (route
 * params, search params, or a constant).
 *
 * On failure it returns SvelteKit's `fail()` carrying the ActionError, so the response gets the
 * right HTTP status and the payload still lands on the page's `form` prop.
 */
export function makeFormAction<
    Return,
    ParamsSchema extends z.ZodTypeAny | undefined = undefined,
    DataSchema extends z.ZodTypeAny | undefined = undefined,
>(
    serviceOperation: AnyOperation<Return, ParamsSchema, DataSchema>,
    getParams?: (event: RequestEvent) => unknown,
) {
    return async (event: RequestEvent) => {
        const formData = await event.request.formData()

        // An empty FormData is treated as no data at all, mirroring projectNext - a form component
        // always submits a FormData instance even when it carries nothing.
        const data = formData.entries().next().done ? undefined : formData

        const result = await safeServerCall(() => serviceOperation<'UNSAFE'>({
            params: getParams?.(event),
            data,
            session: event.locals.session ?? emptySession,
        }))

        if (!result.success) return fail(result.httpCode, result)
        return result
    }
}

/**
 * Wraps a service operation as a `+server.ts` request handler, for calls a client makes outside of
 * a form submission. `getParams` and `getData` pull the operation's inputs off the request.
 *
 * The response body is the same ActionReturn the form action produces, and the HTTP status carries
 * the error code, so a caller can branch on either.
 */
export function makeEndpoint<
    Return,
    ParamsSchema extends z.ZodTypeAny | undefined = undefined,
    DataSchema extends z.ZodTypeAny | undefined = undefined,
>(
    serviceOperation: AnyOperation<Return, ParamsSchema, DataSchema>,
    {
        getParams,
        getData,
    }: {
        getParams?: (event: RequestEvent) => unknown | Promise<unknown>,
        getData?: (event: RequestEvent) => unknown | Promise<unknown>,
    } = {},
): RequestHandler {
    return async (event) => {
        const result = await safeServerCall(async () => serviceOperation<'UNSAFE'>({
            params: await getParams?.(event),
            data: await getData?.(event),
            session: event.locals.session ?? emptySession,
        }))

        return json(result, { status: result.success ? 200 : result.httpCode })
    }
}

/**
 * The analogue of projectNext's `unwrapActionReturn`. Returns the data on success; on failure throws
 * SvelteKit's `error`, which renders the nearest +error.svelte - the same role redirecting to the
 * error page plays in projectNext.
 *
 * Use this in `load` functions, where there is no `form` prop to put an error on.
 */
export function unwrapActionReturn<T>(result: ActionReturn<T>): T {
    if (result.success) return result.data
    error(result.httpCode, {
        message: result.error?.map(message => message.message).join(', ') ?? result.errorCode,
    })
}

/**
 * The `load` counterpart to the two wrappers above.
 *
 * A load function has no form prop and no JSON response - it just needs the data or a thrown error.
 * This runs an operation with the request's session and returns an ActionReturn, so a load function
 * can pair it with `unwrapActionReturn` and read exactly like a projectNext page does:
 *
 *   const quotes = unwrapActionReturn(await callOperation(readPage, { params }, locals))
 */
export function callOperation<
    Return,
    ParamsSchema extends z.ZodTypeAny | undefined = undefined,
    DataSchema extends z.ZodTypeAny | undefined = undefined,
>(
    serviceOperation: AnyOperation<Return, ParamsSchema, DataSchema>,
    args: { params?: unknown, data?: unknown },
    locals: App.Locals,
): Promise<ActionReturn<Return>> {
    return safeServerCall(() => serviceOperation<'UNSAFE'>({
        ...args,
        session: locals.session ?? emptySession,
    }))
}
