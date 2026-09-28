<script lang="ts">
    import { enhance } from '$app/forms'
    import OmegaquoteRow from '$lib/OmegaquoteRow.svelte'
    import type { ActionReturn } from '@/services/actionTypes'
    import type { OmegaquoteFiltered } from '@/services/omegaquotes/types'
    import type { PageData } from './$types'

    let { data }: { data: PageData } = $props()

    type Quote = Omit<OmegaquoteFiltered, 'timestamp'> & { timestamp: Date | string }

    // The rendered list is the server-rendered first page with locally created quotes on top and
    // paged-in quotes below. Keeping those as three separate pieces of state - rather than copying
    // data.quotes into one mutable array - means a reload of the load function flows through
    // instead of being shadowed by a stale copy.
    let createdQuotes = $state<Quote[]>([])
    let pagedQuotes = $state<Quote[]>([])
    let quotes = $derived<Quote[]>([...createdQuotes, ...data.quotes, ...pagedQuotes])

    let page = $state(1)
    let reachedEnd = $state(false)
    let exhausted = $derived(reachedEnd || data.quotes.length < data.pageSize)

    let loadingMore = $state(false)
    let formOpen = $state(false)
    let formErrors = $state<string[]>([])
    let pagingError = $state<string | null>(null)
    let formElement: HTMLFormElement | undefined = $state()

    function errorMessages(result: unknown): string[] {
        const actionError = result as ActionReturn<unknown> | undefined
        if (!actionError || actionError.success) return ['Ukjent feil']
        return actionError.error?.map(message => message.message) ?? [actionError.errorCode]
    }

    async function loadMore() {
        loadingMore = true
        pagingError = null

        const cursor = quotes.at(-1)?.id
        const query = new URLSearchParams({
            pageSize: String(data.pageSize),
            page: String(page),
            ...(cursor === undefined ? {} : { cursor: String(cursor) }),
        })

        try {
            const response = await fetch(`/api/quotes?${query}`)
            const result: ActionReturn<Quote[]> = await response.json()

            if (!result.success) {
                pagingError = errorMessages(result).join(', ')
                return
            }

            pagedQuotes = [...pagedQuotes, ...result.data]
            page += 1
            if (result.data.length < data.pageSize) reachedEnd = true
        } catch {
            pagingError = 'Klarte ikke å hente flere sitater'
        } finally {
            loadingMore = false
        }
    }
</script>

<svelte:head>
    <title>Omega Quotes &middot; svele</title>
</svelte:head>

<div class="m-2 flex flex-1 flex-col gap-2">
    <div
        class="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-(--surface-base) p-4 px-3"
    >
        <div class="flex items-baseline gap-3">
            <h1 class="text-2xl font-medium">Omega Quotes</h1>
            <span class="text-sm text-(--text-secondary)">
                {quotes.length}{exhausted ? '' : '+'} sitater
            </span>
        </div>

        {#if data.canCreate}
            <button
                class="rounded-lg bg-(--accent-blue) px-4 py-2 font-semibold text-(--accent-blue-ink)"
                onclick={() => (formOpen = !formOpen)}
            >
                {formOpen ? 'Avbryt' : 'Nytt sitat'}
            </button>
        {/if}
    </div>

    {#if formOpen && data.canCreate}
        <!--
            A plain form posting to the `create` action. It works with JavaScript off; use:enhance
            upgrades it to prepend the created quote in place instead of reloading the page.
        -->
        <form
            bind:this={formElement}
            method="POST"
            action="?/create"
            class="grid gap-3 rounded-2xl bg-(--surface-base) p-4"
            use:enhance={() => async ({ result }) => {
                if (result.type === 'success' && (result.data as ActionReturn<Quote>)?.success) {
                    createdQuotes = [(result.data as { data: Quote }).data, ...createdQuotes]
                    formErrors = []
                    formOpen = false
                    formElement?.reset()
                    return
                }
                if (result.type === 'failure') {
                    formErrors = errorMessages(result.data)
                    return
                }
                formErrors = ['Ukjent feil']
            }}
        >
            <label class="grid gap-1.5 text-sm font-semibold text-(--text-secondary)">
                Sitat
                <textarea
                    name="quote"
                    rows="3"
                    required
                    placeholder="Det var en gang…"
                    class="resize-y rounded-lg border border-(--border) bg-(--surface-sunken) px-3 py-2 font-normal text-(--text) focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--accent-blue)"
                ></textarea>
            </label>
            <label class="grid gap-1.5 text-sm font-semibold text-(--text-secondary)">
                Sitert
                <input
                    name="author"
                    type="text"
                    required
                    placeholder="Navn"
                    class="rounded-lg border border-(--border) bg-(--surface-sunken) px-3 py-2 font-normal text-(--text) focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--accent-blue)"
                />
            </label>

            {#if formErrors.length > 0}
                <ul class="list-disc pl-5 text-sm text-(--danger)">
                    {#each formErrors as message (message)}
                        <li>{message}</li>
                    {/each}
                </ul>
            {/if}

            <button
                class="justify-self-start rounded-lg bg-(--accent-blue) px-4 py-2 font-semibold text-(--accent-blue-ink)"
                type="submit"
            >
                Legg til
            </button>
        </form>
    {/if}

    <ol class="grid gap-2">
        {#each quotes as quote (quote.id)}
            <li><OmegaquoteRow {quote} /></li>
        {/each}
    </ol>

    {#if pagingError}
        <p class="rounded-2xl bg-(--surface-base) p-4 text-sm text-(--danger)" role="alert">
            {pagingError}
        </p>
    {/if}

    {#if exhausted}
        <p class="rounded-2xl bg-(--surface-base) p-4 text-center text-sm text-(--text-secondary)">
            Det var alle {quotes.length} sitatene.
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
</div>
