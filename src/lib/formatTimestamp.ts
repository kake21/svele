/**
 * Quotes arrive as a Date through the `load` function (SvelteKit serialises with devalue, which
 * preserves Date) but as an ISO string through the paging endpoint (plain JSON). Accepting both
 * keeps the row component from caring which path it came from.
 */
export function formatTimestamp(timestamp: Date | string): string {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
    return date.toLocaleDateString('no-NO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}
