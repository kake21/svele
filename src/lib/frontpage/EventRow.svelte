<script lang="ts">
    import ListRow from './ListRow.svelte'
    import { eventSlug } from '@/services/events/slug'
    import type { EventExpanded } from '@/services/events/types'

    let { event }: { event: EventExpanded } = $props()

    const months = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des']

    let start = $derived(new Date(event.eventStart))

    // projectNext shows the registration window here when an event takes registrations, on the
    // grounds that it is what you act on. svele shows the event window instead: a registration
    // window is usually days or weeks wide, and rendering it as two clock hours produces things
    // like "19-17" - an end apparently before its start. The event window is the one that two
    // hours can actually describe.
    let from = $derived(new Date(event.eventStart))
    let to = $derived(new Date(event.eventEnd))

    let attendance = $derived(
        event.takesRegistration && event.places > 0
            ? event.numOfRegistrations / event.places
            : undefined
    )

    const hour = (date: Date) => String(date.getHours()).padStart(2, '0')
</script>

<ListRow href="/events/{eventSlug(event)}" progress={attendance}>
    {#snippet lead()}
        <b class="text-2xl font-normal text-(--text)">{start.getDate()}</b>
        <span class="text-xs tracking-wide text-(--text-secondary) uppercase">
            {months[start.getMonth()]}
        </span>
    {/snippet}

    {#snippet main()}
        <h3 class="m-0 truncate text-base font-medium text-(--text)">{event.name}</h3>
        {#if event.tags.length > 0}
            <div class="flex gap-1.5 overflow-hidden">
                {#each event.tags as tag (tag.id)}
                    <span
                        class="shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold"
                        style="background: rgb({tag.colorR} {tag.colorG} {tag.colorB} / 0.18); color: rgb({tag.colorR} {tag.colorG} {tag.colorB})"
                    >{tag.name}</span>
                {/each}
            </div>
        {/if}
    {/snippet}

    {#snippet meta()}
        {#if event.location}<span class="max-w-full truncate">{event.location}</span>{/if}
        <span>{hour(from)}–{hour(to)}</span>
        {#if event.takesRegistration}
            <span class="font-medium text-(--text)">
                {event.numOfRegistrations} / {event.places}
            </span>
        {/if}
    {/snippet}
</ListRow>
