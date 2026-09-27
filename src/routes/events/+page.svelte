<script lang="ts">
    import { CalendarPlus } from 'lucide-svelte'
    import EventCard from '$lib/events/EventCard.svelte'
    import TagFilter from '$lib/events/TagFilter.svelte'
    import type { PageData } from './$types'

    let { data }: { data: PageData } = $props()
</script>

<svelte:head>
    <title>Arrangementer · svele</title>
</svelte:head>

<div class="m-2 flex flex-1 flex-col gap-2">
    <div class="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-(--surface-base) p-4 px-3">
        <div class="flex items-baseline gap-3">
            <h1 class="text-2xl font-medium">Arrangementer</h1>
            <span class="text-sm text-(--text-secondary)">
                {data.events.length} kommende
            </span>
        </div>

        <div class="flex items-center gap-2">
            <a href="/events/archive" class="text-sm text-(--accent-blue)">Arkiv</a>
            {#if data.canCreate}
                <a
                    href="/events/ny"
                    class="flex items-center gap-2 rounded-lg bg-(--accent-blue) px-3 py-1.5 text-sm font-semibold text-(--accent-blue-ink) no-underline"
                >
                    <CalendarPlus class="size-4" />
                    Nytt arrangement
                </a>
            {/if}
        </div>
    </div>

    <TagFilter tags={data.tags} activeTags={data.activeTags} basePath="/events" />

    {#if data.events.length === 0}
        <p class="rounded-2xl bg-(--surface-base) p-4 text-sm text-(--text-secondary)">
            Ingen kommende arrangementer.
        </p>
    {:else}
        <ol class="grid gap-2 sm:grid-cols-2">
            {#each data.events as event (event.id)}
                <li class="contents"><EventCard {event} /></li>
            {/each}
        </ol>
    {/if}
</div>
