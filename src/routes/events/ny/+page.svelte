<script lang="ts">
    import { enhance } from '$app/forms'
    import { eventCanBeViewdByOptions } from '@/services/events/constants'
    import type { ActionReturn } from '@/services/actionTypes'
    import type { ActionData, PageData } from './$types'

    let { data, form }: { data: PageData, form: ActionData } = $props()

    let takesRegistration = $state(false)

    let errors = $derived.by(() => {
        const result = form as ActionReturn<unknown> | null
        if (!result || result.success) return []
        return result.error?.map(message =>
            `${message.path?.length ? `${message.path.join('.')}: ` : ''}${message.message}`) ?? [result.errorCode]
    })

    const inputClass =
        'rounded-lg border border-(--border) bg-(--surface-sunken) px-3 py-2 font-normal text-(--text) focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--accent-blue)'
    const labelClass = 'grid gap-1.5 text-sm font-semibold text-(--text-secondary)'
</script>

<svelte:head>
    <title>Nytt arrangement · svele</title>
</svelte:head>

<div class="m-2 flex flex-1 flex-col gap-2">
    <div class="rounded-2xl bg-(--surface-base) p-4 px-3">
        <h1 class="text-2xl font-medium">Nytt arrangement</h1>
    </div>

    {#if errors.length > 0}
        <ul class="list-disc rounded-2xl bg-(--surface-base) p-4 pl-9 text-sm text-(--danger)" role="alert">
            {#each errors as message (message)}<li>{message}</li>{/each}
        </ul>
    {/if}

    <form method="POST" class="grid max-w-2xl gap-3 rounded-2xl bg-(--surface-base) p-4" use:enhance>
        <label class={labelClass}>
            Navn
            <input name="name" type="text" required minlength="5" maxlength="70" class={inputClass} />
        </label>

        <label class={labelClass}>
            Sted
            <input name="location" type="text" required minlength="2" class={inputClass} />
        </label>

        <label class={labelClass}>
            Beskrivelse
            <textarea name="descriptionMd" rows="4" class="{inputClass} resize-y"></textarea>
        </label>

        <label class={labelClass}>
            Forsidebilde (URL)
            <input name="coverImageUrl" type="url" placeholder="https://…" class={inputClass} />
        </label>

        <div class="grid gap-3 sm:grid-cols-2">
            <label class={labelClass}>
                Starttid
                <input name="eventStart" type="datetime-local" required class={inputClass} />
            </label>
            <label class={labelClass}>
                Sluttid
                <input name="eventEnd" type="datetime-local" required class={inputClass} />
            </label>
        </div>

        <label class={labelClass}>
            Synlig for
            <select name="canBeViewdBy" class={inputClass}>
                {#each eventCanBeViewdByOptions as option (option.value)}
                    <option value={option.value}>{option.label}</option>
                {/each}
            </select>
        </label>

        {#if data.tags.length > 0}
            <fieldset class="grid gap-1.5 border-0 p-0">
                <legend class="text-sm font-semibold text-(--text-secondary)">Tags</legend>
                <div class="flex flex-wrap gap-3">
                    {#each data.tags as tag (tag.id)}
                        <label class="flex items-center gap-1.5 text-sm font-normal">
                            <input type="checkbox" name="tagIds" value={tag.id} />
                            {tag.name}
                        </label>
                    {/each}
                </div>
            </fieldset>
        {/if}

        <label class="flex items-center gap-2 text-sm font-semibold text-(--text-secondary)">
            <input type="checkbox" name="takesRegistration" bind:checked={takesRegistration} />
            Tar påmelding
        </label>

        {#if takesRegistration}
            <div class="grid gap-3 rounded-lg bg-(--surface-sunken) p-3 sm:grid-cols-2">
                <label class={labelClass}>
                    Plasser
                    <input name="places" type="number" min="0" value="0" class={inputClass} />
                </label>
                <label class="flex items-end gap-2 pb-2 text-sm font-semibold text-(--text-secondary)">
                    <input type="checkbox" name="waitingList" />
                    Venteliste
                </label>
                <label class={labelClass}>
                    Påmelding åpner
                    <input name="registrationStart" type="datetime-local" class={inputClass} />
                </label>
                <label class={labelClass}>
                    Påmelding stenger
                    <input name="registrationEnd" type="datetime-local" class={inputClass} />
                </label>
            </div>
        {/if}

        <button
            type="submit"
            class="justify-self-start rounded-lg bg-(--accent-blue) px-4 py-2 font-semibold text-(--accent-blue-ink)"
        >
            Opprett
        </button>
    </form>
</div>
