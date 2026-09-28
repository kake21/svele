<script lang="ts">
    import { untrack } from 'svelte'
    import { goto } from '$app/navigation'
    import { Search } from 'lucide-svelte'
    import PageTitle from '$lib/PageTitle.svelte'
    import type { ActionReturn } from '@/services/actionTypes'
    import type { PageData } from './$types'

    let { data }: { data: PageData } = $props()

    type Row = PageData['users'][number]

    let pagedUsers = $state<Row[]>([])
    let users = $derived<Row[]>([...data.users, ...pagedUsers])

    let page = $state(1)
    let reachedEnd = $state(false)
    let exhausted = $derived(reachedEnd || data.users.length < data.pageSize)
    let loadingMore = $state(false)
    let pagingError = $state<string | null>(null)

    // Local mirrors of the URL filter, so typing does not navigate on every keystroke. untrack
    // makes the one-time seeding explicit - these are editable inputs, not derivations, and must
    // not be clobbered mid-keystroke when the load function returns.
    let query = $state(untrack(() => data.filter.partOfName))
    let groupId = $state<string>(untrack(() => data.filter.groupId ? String(data.filter.groupId) : ''))

    function applyFilter() {
        const params = new URLSearchParams()
        if (query) params.set('q', query)
        if (groupId) params.set('group', groupId)
        if (data.filter.sortField !== 'name') params.set('sort', data.filter.sortField)
        goto(`/users${params.toString() ? `?${params}` : ''}`, { keepFocus: true })
    }

    async function loadMore() {
        loadingMore = true
        pagingError = null

        const params = new URLSearchParams({
            pageSize: String(data.pageSize),
            page: String(page),
            sort: data.filter.sortField,
        })
        if (query) params.set('q', query)
        if (groupId) params.set('group', groupId)
        const cursor = users.at(-1)?.id
        if (cursor !== undefined) params.set('cursor', String(cursor))

        try {
            const response = await fetch(`/api/users?${params}`)
            const result: ActionReturn<Row[]> = await response.json()
            if (!result.success) {
                pagingError = result.error?.map(message => message.message).join(', ') ?? result.errorCode
                return
            }
            pagedUsers = [...pagedUsers, ...result.data]
            page += 1
            if (result.data.length < data.pageSize) reachedEnd = true
        } catch {
            pagingError = 'Klarte ikke å hente flere brukere'
        } finally {
            loadingMore = false
        }
    }

    // A new server-rendered first page means the filter changed; drop what we paged in under the
    // old one rather than showing two filters' results stacked.
    $effect(() => {
        void data.users
        pagedUsers = []
        page = 1
        reachedEnd = false
    })
</script>

<!--
    The load function already supplies "Brukere", which is what the server renders. This overrides
    it on the client with the live count, which changes as rows page in - the case the static
    title cannot cover, and the reason the store exists alongside it.
-->
<PageTitle title="Brukere · {users.length}{exhausted ? '' : '+'}" />

<svelte:head>
    <title>Brukere · svele</title>
</svelte:head>

<div class="m-2 flex flex-1 flex-col gap-2">
    <div class="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-(--surface-base) p-4 px-3">
        <div class="flex items-baseline gap-3">
            <h1 class="text-2xl font-medium">Brukere</h1>
            <span class="text-sm text-(--text-secondary)">
                {users.length}{exhausted ? '' : '+'} brukere
            </span>
        </div>

        <form
            class="flex flex-wrap items-center gap-2"
            onsubmit={event => { event.preventDefault(); applyFilter() }}
        >
            <label class="relative flex items-center">
                <Search class="pointer-events-none absolute left-2.5 size-4 text-(--text-secondary)" />
                <input
                    type="search"
                    bind:value={query}
                    placeholder="Søk på navn"
                    aria-label="Søk på navn"
                    class="w-48 rounded-lg border border-(--border) bg-(--surface-sunken) py-1.5 pr-3 pl-8 text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--accent-blue)"
                />
            </label>

            {#if data.groups.length > 0}
                <select
                    bind:value={groupId}
                    onchange={applyFilter}
                    aria-label="Filtrer på gruppe"
                    class="rounded-lg border border-(--border) bg-(--surface-sunken) px-2 py-1.5 text-sm"
                >
                    <option value="">Alle grupper</option>
                    {#each data.groups as group (group.id)}
                        <option value={String(group.id)}>{group.name} ({group._count.memberships})</option>
                    {/each}
                </select>
            {/if}

            <button
                type="submit"
                class="rounded-lg bg-(--accent-blue) px-3 py-1.5 text-sm font-semibold text-(--accent-blue-ink)"
            >
                Søk
            </button>
        </form>
    </div>

    {#if users.length === 0}
        <p class="rounded-2xl bg-(--surface-base) p-4 text-sm text-(--text-secondary)">
            Ingen brukere passet søket.
        </p>
    {:else}
        <ol class="grid gap-2">
            {#each users as user (user.id)}
                <li>
                    <a
                        href="/users/{user.username}"
                        class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-2xl bg-(--surface-base) p-4 no-underline hover:outline-2 hover:outline-(--accent-blue)"
                    >
                        <span class="flex items-baseline gap-2">
                            <span class="font-semibold text-(--text)">
                                {user.firstname} {user.lastname}
                            </span>
                            <span class="text-sm text-(--text-secondary)">@{user.username}</span>
                        </span>
                        <span class="flex flex-wrap gap-1.5">
                            {#each user.memberships as membership (membership.groupId)}
                                <span class="rounded bg-(--surface-sunken) px-2 py-0.5 text-xs text-(--text-secondary)">
                                    {membership.group.name}{membership.admin ? ' ★' : ''}
                                </span>
                            {/each}
                        </span>
                    </a>
                </li>
            {/each}
        </ol>
    {/if}

    {#if pagingError}
        <p class="rounded-2xl bg-(--surface-base) p-4 text-sm text-(--danger)" role="alert">{pagingError}</p>
    {/if}

    {#if users.length > 0}
        {#if exhausted}
            <p class="rounded-2xl bg-(--surface-base) p-4 text-center text-sm text-(--text-secondary)">
                Det var alle {users.length} brukerne.
            </p>
        {:else}
            <button
                class="rounded-2xl bg-(--surface-base) p-4 text-(--text) disabled:cursor-progress disabled:opacity-60"
                onclick={loadMore}
                disabled={loadingMore}
            >
                {loadingMore ? 'Henter…' : 'Hent flere'}
            </button>
        {/if}
    {/if}
</div>
