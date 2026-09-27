export type Page<PageSize extends number, Cursor> = {
    pageSize: PageSize,
    page: number,
    cursor: Cursor | null,
}
