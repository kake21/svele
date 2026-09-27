/**
 * projectNext routes events at /events/[nameAndId], where the segment is a slugified name and the
 * id joined by a dash. The id is what is looked up; the name is there for humans and for search
 * engines, and a stale slug still resolves.
 */
export function eventSlug(event: { id: number, name: string }): string {
    const slug = event.name
        .toLowerCase()
        .replace(/[æ]/g, 'ae').replace(/[ø]/g, 'o').replace(/[å]/g, 'a')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    return `${slug}-${event.id}`
}

export function idFromSlug(nameAndId: string): number | null {
    const id = Number(nameAndId.split('-').at(-1))
    return Number.isInteger(id) && id > 0 ? id : null
}
