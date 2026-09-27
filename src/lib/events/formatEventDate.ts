/**
 * projectNext uses Luxon and a getOsloTime() helper throughout its event logic. svele keeps the
 * comparisons in plain Date - they are all "is this before now", which is timezone-independent -
 * and pins only the *display* to Europe/Oslo through Intl. That drops the Luxon dependency
 * without changing what a reader sees.
 */
const osloDateTime = new Intl.DateTimeFormat('no-NO', {
    timeZone: 'Europe/Oslo',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
})

const osloDate = new Intl.DateTimeFormat('no-NO', {
    timeZone: 'Europe/Oslo',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
})

function toDate(value: Date | string): Date {
    return value instanceof Date ? value : new Date(value)
}

export function formatEventDateTime(value: Date | string): string {
    return osloDateTime.format(toDate(value))
}

export function formatEventDate(value: Date | string): string {
    return osloDate.format(toDate(value))
}

/**
 * Start and end on the same Oslo day render as one range rather than two timestamps.
 */
export function formatEventRange(start: Date | string, end: Date | string): string {
    const startDate = toDate(start)
    const endDate = toDate(end)
    const sameDay = osloDate.format(startDate) === osloDate.format(endDate)

    if (!sameDay) return `${formatEventDateTime(startDate)} – ${formatEventDateTime(endDate)}`

    const time = new Intl.DateTimeFormat('no-NO', {
        timeZone: 'Europe/Oslo', hour: '2-digit', minute: '2-digit',
    })
    return `${formatEventDateTime(startDate)} – ${time.format(endDate)}`
}
