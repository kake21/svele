<script lang="ts">
    import { MapPin, Users } from 'lucide-svelte'
    import { formatEventRange } from './formatEventDate'
    import { eventSlug } from '@/services/events/slug'
    import type { EventExpanded } from '@/services/events/types'

    let { event }: { event: EventExpanded } = $props()

    let full = $derived(event.takesRegistration && event.numOfRegistrations >= event.places)
</script>

<a
    href="/events/{eventSlug(event)}"
    class="flex flex-col gap-2 rounded-2xl bg-(--surface-base) p-4 no-underline hover:outline-2 hover:outline-(--accent-blue)"
>
    {#if event.coverImageUrl}
        <img
            src={event.coverImageUrl}
            alt=""
            class="mb-1 max-h-40 w-full rounded-lg object-cover"
            loading="lazy"
        />
    {/if}

    <div class="flex flex-wrap gap-1.5">
        {#each event.tags as tag (tag.id)}
            <span
                class="rounded px-2 py-0.5 text-xs font-semibold"
                style="background: rgb({tag.colorR} {tag.colorG} {tag.colorB} / 0.18); color: rgb({tag.colorR} {tag.colorG} {tag.colorB})"
            >
                {tag.name}
            </span>
        {/each}
    </div>

    <h2 class="text-lg font-semibold text-(--text)">{event.name}</h2>

    <p class="m-0 text-sm text-(--text-secondary)">
        {formatEventRange(event.eventStart, event.eventEnd)}
    </p>

    <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-(--text-secondary)">
        {#if event.location}
            <span class="flex items-center gap-1.5">
                <MapPin class="size-4" />{event.location}
            </span>
        {/if}
        {#if event.takesRegistration}
            <span class="flex items-center gap-1.5" class:text-(--danger)={full}>
                <Users class="size-4" />
                {event.numOfRegistrations}/{event.places}
                {#if event.numOnWaitingList > 0}
                    <span>(+{event.numOnWaitingList} på venteliste)</span>
                {/if}
            </span>
        {/if}
    </div>
</a>
