import type { PageLoad } from './$types'

/**
 * A plain +page.ts rather than +page.server.ts: this page needs no server data, only a title.
 */
export const load: PageLoad = () => ({ title: 'Om svele' })
