import type { Page } from './types'

/**
 * Generates the cursor-paging selection for a given page. If the page has a cursor it uses cursor
 * paging, otherwise it falls back to offset pagination. Ported from projectNext unchanged.
 */
export function cursorPageingSelection<const PageSize extends number, Cursor>(
    page: Page<PageSize, Cursor>
): {
    take: number,
    skip: number,
    cursor?: NonNullable<Cursor>,
} {
    return page.cursor ? {
        cursor: page.cursor,
        take: page.pageSize,
        skip: 1,
    } : {
        take: page.pageSize,
        skip: page.page * page.pageSize,
    }
}
