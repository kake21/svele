import { getContext, setContext } from 'svelte'

/**
 * The header's page title, ported from projectNext's PageTitleContext + PageTitleSetter +
 * NavBarTitle trio.
 *
 * projectNext's version is client state written from a useEffect, which means the server renders
 * no title at all - NavBarTitle has to emit an empty placeholder to avoid a layout shift during
 * hydration. That is a real cost of the approach, not an oversight.
 *
 * svele has two routes to the same place, and uses whichever fits:
 *
 *   1. `title` returned from a page's `load`. Available before the layout renders, so the title is
 *      in the server HTML, correct without JavaScript, and never flashes. This is what almost
 *      every page should use.
 *
 *   2. This store, for a title that changes in response to something on the client - a filter, a
 *      selection, a live count. Set it with the <PageTitle> component; it wins over the load value
 *      while mounted and releases on unmount.
 *
 * The ordering is why both exist: during SSR the layout renders <Header> before the page's own
 * markup, so anything a child sets cannot reach a header that has already been emitted. Data
 * resolved in `load` does not have that problem.
 */
const KEY = Symbol('pageTitle')

export type PageTitleStore = {
    /** Set by <PageTitle>; null means "defer to the load value". */
    override: string | null,
}

export function createPageTitleContext(): PageTitleStore {
    const store = $state<PageTitleStore>({ override: null })
    setContext(KEY, store)
    return store
}

export function getPageTitleContext(): PageTitleStore {
    const store = getContext<PageTitleStore | undefined>(KEY)
    if (!store) {
        throw new Error('getPageTitleContext must be used under the root layout')
    }
    return store
}
