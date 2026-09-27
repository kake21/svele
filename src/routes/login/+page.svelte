<script lang="ts">
    import { enhance } from '$app/forms'
    import type { ActionReturn } from '@/services/actionTypes'
    import type { ActionData, PageData } from './$types'

    let { data, form }: { data: PageData, form: ActionData } = $props()

    let submitting = $state(false)

    let errors = $derived.by(() => {
        const failure = form as ActionReturn<unknown> | null
        if (!failure || failure.success) return []
        return failure.error?.map(message => message.message) ?? [failure.errorCode]
    })
</script>

<svelte:head>
    <title>Logg inn · svele</title>
</svelte:head>

<div class="m-2 flex flex-1 flex-col gap-2">
    <div class="rounded-2xl bg-(--surface-base) p-4 px-3">
        <h1 class="text-2xl font-medium">Logg inn</h1>
    </div>

    <form
        method="POST"
        class="grid max-w-md gap-3 rounded-2xl bg-(--surface-base) p-4"
        use:enhance={() => {
            submitting = true
            return async ({ update }) => {
                submitting = false
                // Keep the typed username, drop the password.
                await update({ reset: false })
            }
        }}
    >
        <input type="hidden" name="callbackUrl" value={data.callbackUrl} />

        <label class="grid gap-1.5 text-sm font-semibold text-(--text-secondary)">
            Brukernavn
            <input
                name="username"
                type="text"
                autocomplete="username"
                required
                value={form && !form.success ? (form.username ?? '') : ''}
                class="rounded-lg border border-(--border) bg-(--surface-sunken) px-3 py-2 font-normal text-(--text) focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--accent-blue)"
            />
        </label>

        <label class="grid gap-1.5 text-sm font-semibold text-(--text-secondary)">
            Passord
            <input
                name="password"
                type="password"
                autocomplete="current-password"
                required
                class="rounded-lg border border-(--border) bg-(--surface-sunken) px-3 py-2 font-normal text-(--text) focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--accent-blue)"
            />
        </label>

        {#if errors.length > 0}
            <ul class="list-disc pl-5 text-sm text-(--danger)" role="alert">
                {#each errors as message (message)}
                    <li>{message}</li>
                {/each}
            </ul>
        {/if}

        <button
            type="submit"
            disabled={submitting}
            class="justify-self-start rounded-lg bg-(--accent-blue) px-4 py-2 font-semibold text-(--accent-blue-ink) disabled:cursor-progress disabled:opacity-60"
        >
            {submitting ? 'Logger inn…' : 'Logg inn'}
        </button>
    </form>
</div>
