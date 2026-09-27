<script lang="ts">
    import { enhance } from '$app/forms'
    import { relationshipStatusConfig, sexConfig } from '@/services/users/constants'
    import type { ActionReturn } from '@/services/actionTypes'
    import type { ActionData, PageData } from './$types'

    let { data, form }: { data: PageData, form: ActionData } = $props()

    let profile = $derived(data.profile)
    let saved = $state<string | null>(null)

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
    <title>Rediger {profile.firstname} · svele</title>
</svelte:head>

<div class="m-2 flex flex-1 flex-col gap-2">
    <div class="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-(--surface-base) p-4 px-3">
        <h1 class="text-2xl font-medium">Rediger profil</h1>
        <a href="/users/{profile.username}" class="text-sm text-(--accent-blue)">
            Tilbake til profilen
        </a>
    </div>

    {#if errors.length > 0}
        <ul class="list-disc rounded-2xl bg-(--surface-base) p-4 pl-9 text-sm text-(--danger)" role="alert">
            {#each errors as message (message)}
                <li>{message}</li>
            {/each}
        </ul>
    {:else if saved}
        <p class="rounded-2xl bg-(--surface-base) p-4 text-sm text-(--accent-blue)">{saved}</p>
    {/if}

    <form
        method="POST"
        action="?/profile"
        class="grid max-w-xl gap-3 rounded-2xl bg-(--surface-base) p-4"
        use:enhance={() => async ({ result, update }) => {
            saved = result.type === 'success' ? 'Profilen er lagret.' : null
            await update({ reset: false })
        }}
    >
        <h2 class="text-xs font-semibold tracking-wide text-(--text-secondary) uppercase">
            Om deg
        </h2>

        <label class={labelClass}>
            Bio
            <textarea name="bio" rows="3" class="{inputClass} resize-y">{profile.bio}</textarea>
        </label>

        <label class={labelClass}>
            Allergier
            <input name="allergies" type="text" value={profile.allergies ?? ''} class={inputClass} />
        </label>

        <label class={labelClass}>
            Kjønn
            <select name="sex" class={inputClass}>
                <option value="">Ikke oppgitt</option>
                {#each Object.entries(sexConfig) as [value, config] (value)}
                    <option {value} selected={profile.sex === value}>{config.label}</option>
                {/each}
            </select>
        </label>

        <label class={labelClass}>
            Sivilstatus
            <select name="relationshipStatus" class={inputClass}>
                {#each Object.entries(relationshipStatusConfig) as [value, config] (value)}
                    <option {value} selected={profile.relationshipStatus === value}>{config.label}</option>
                {/each}
            </select>
        </label>

        <label class={labelClass}>
            Utdypning
            <input
                name="relationshipStatusText"
                type="text"
                value={profile.relationshipStatusText}
                class={inputClass}
            />
        </label>

        <button
            type="submit"
            class="justify-self-start rounded-lg bg-(--accent-blue) px-4 py-2 font-semibold text-(--accent-blue-ink)"
        >
            Lagre
        </button>
    </form>

    {#if data.isSelf}
        <form
            method="POST"
            action="?/password&id={profile.id}"
            class="grid max-w-xl gap-3 rounded-2xl bg-(--surface-base) p-4"
            use:enhance={() => async ({ result, update }) => {
                saved = result.type === 'success' ? 'Passordet er endret. Andre pålogginger er logget ut.' : null
                await update({ reset: true })
            }}
        >
            <h2 class="text-xs font-semibold tracking-wide text-(--text-secondary) uppercase">
                Bytt passord
            </h2>
            <p class="text-sm text-(--text-secondary)">
                Minst 12 tegn. Alle andre pålogginger blir logget ut.
            </p>

            <label class={labelClass}>
                Nytt passord
                <input name="password" type="password" autocomplete="new-password" required class={inputClass} />
            </label>

            <label class={labelClass}>
                Gjenta passord
                <input name="confirmPassword" type="password" autocomplete="new-password" required class={inputClass} />
            </label>

            <button
                type="submit"
                class="justify-self-start rounded-lg bg-(--accent-blue) px-4 py-2 font-semibold text-(--accent-blue-ink)"
            >
                Endre passord
            </button>
        </form>
    {/if}
</div>
