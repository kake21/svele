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

<section class="toolbar">
    <h1>Omega Quotes</h1>
    {#if data.canCreate}
        <button class="primary" onclick={() => (formOpen = !formOpen)}>
            {formOpen ? 'Avbryt' : 'Nytt sitat'}
        </button>
    {/if}
</section>

{#if formOpen && data.canCreate}
    <!--
        A plain form posting to the `create` action. It works with JavaScript off; use:enhance
        upgrades it to prepend the created quote in place instead of reloading the page.
    -->
    <form
        bind:this={formElement}
        method="POST"
        action="?/create"
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
        <label>
            Sitat
            <textarea name="quote" rows="3" required placeholder="Det var en gang…"></textarea>
        </label>
        <label>
            Sitert
            <input name="author" type="text" required placeholder="Navn" />
        </label>

        {#if formErrors.length > 0}
            <ul class="errors">
                {#each formErrors as message (message)}
                    <li>{message}</li>
                {/each}
            </ul>
        {/if}

        <button class="primary" type="submit">Legg til</button>
    </form>
{/if}

<ol class="quotes">
    {#each quotes as quote (quote.id)}
        <li><OmegaquoteRow {quote} /></li>
    {/each}
</ol>

{#if pagingError}
    <p class="errors" role="alert">{pagingError}</p>
{/if}

{#if exhausted}
    <p class="exhausted">Det var alle {quotes.length} sitatene.</p>
{:else}
    <button class="more" onclick={loadMore} disabled={loadingMore}>
        {loadingMore ? 'Henter…' : 'Hent flere'}
    </button>
{/if}

<style>
    .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    h1 {
        margin: 0;
        font-size: 1.85rem;
    }

    form {
        display: grid;
        gap: 0.9rem;
        margin-bottom: 1.75rem;
        padding: 1.25rem;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 0.6rem;
    }

    label {
        display: grid;
        gap: 0.35rem;
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--muted);
    }

    input,
    textarea {
        padding: 0.55rem 0.7rem;
        background: var(--surface-raised);
        border: 1px solid var(--border);
        border-radius: 0.4rem;
        font-weight: 400;
        resize: vertical;
    }

    input:focus-visible,
    textarea:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 1px;
    }

    .quotes {
        display: grid;
        gap: 0.85rem;
        margin: 0 0 1.5rem;
        padding: 0;
        list-style: none;
    }

    button {
        padding: 0.5rem 1rem;
        border-radius: 0.4rem;
        border: 1px solid var(--border);
        background: var(--surface-raised);
        color: var(--ink);
    }

    button.primary {
        background: var(--accent);
        border-color: var(--accent);
        color: var(--accent-ink);
        font-weight: 600;
    }

    button.more {
        width: 100%;
    }

    button:disabled {
        opacity: 0.6;
        cursor: progress;
    }

    .errors {
        margin: 0;
        padding-left: 1.1rem;
        color: var(--danger);
        font-size: 0.9rem;
    }

    p.errors {
        padding-left: 0;
    }

    .exhausted {
        text-align: center;
        color: var(--muted);
        font-size: 0.85rem;
    }
</style>
