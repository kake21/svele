<script lang="ts">
    import { untrack } from 'svelte'
    import { goto } from '$app/navigation'
    import { Search } from 'lucide-svelte'
    import EventCard from '$lib/events/EventCard.svelte'
    import TagFilter from '$lib/events/TagFilter.svelte'
    import type { PageData } from './$types'

    let { data }: { data: PageData } = $props()

    let query = $state(untrack(() => data.query))

    function search() {
        const params = new URLSearchParams()
        if (query) params.set('q', query)
        for (const tag of data.activeTags) params.append('tag', tag)
        goto(`/events/archive${params.toString() ? `?${params}` : ''}`, { keepFocus: true })
    }
</script>

<svelte:head>
    <title>Arrangementsarkiv · svele</title>
</svelte:head>

<div class="m-2 flex flex-1 flex-col gap-2">
    <div class="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-(--surface-base) p-4 px-3">
        <div class="flex items-baseline gap-3">
            <h1 class="text-2xl font-medium">Arkiv</h1>
            <span class="text-sm text-(--text-secondary)">{data.events.length} tidligere</span>
        </div>

        <form class="flex items-center gap-2" onsubmit={event => { event.preventDefault(); search() }}>
            <label class="relative flex items-center">
                <Search class="pointer-events-none absolute left-2.5 size-4 text-(--text-secondary)" />
                <input
                    type="search"
                    bind:value={query}
                    placeholder="Søk på navn"
                    aria-label="Søk på navn"
                    class="w-48 rounded-lg border border-(--border) bg-(--surface-sunken) py-1.5 pr-3 pl-8 text-sm"
                />
            </label>
            <a href="/events" class="text-sm text-(--accent-blue)">Kommende</a>
        </form>
    </div>

    <TagFilter tags={data.tags} activeTags={data.activeTags} basePath="/events/archive" />

    {#if data.events.length === 0}
        <p class="rounded-2xl bg-(--surface-base) p-4 text-sm text-(--text-secondary)">
            Ingen tidligere arrangementer passet søket.
        </p>
    {:else}
        <ol class="grid gap-2 sm:grid-cols-2">
            {#each data.events as event (event.id)}
                <li class="contents"><EventCard {event} /></li>
            {/each}
        </ol>
    {/if}
</div>
