<script lang="ts">
    import { Pencil } from 'lucide-svelte'
    import { relationshipStatusConfig, sexConfig } from '@/services/users/constants'
    import { formatTimestamp } from '$lib/formatTimestamp'
    import type { PageData } from './$types'

    let { data }: { data: PageData } = $props()

    let profile = $derived(data.profile)
    let fullName = $derived(`${profile.firstname} ${profile.lastname}`)

    let facts = $derived([
        { label: 'Brukernavn', value: `@${profile.username}` },
        { label: 'E-post', value: profile.email },
        { label: 'Mobil', value: profile.mobile ?? '—' },
        { label: 'Kjønn', value: profile.sex ? sexConfig[profile.sex].label : '—' },
        { label: 'Allergier', value: profile.allergies || '—' },
        {
            label: 'Sivilstatus',
            value: profile.relationshipStatusText || relationshipStatusConfig[profile.relationshipStatus].label,
        },
        { label: 'Medlem siden', value: formatTimestamp(profile.createdAt) },
    ])
</script>

<svelte:head>
    <title>{fullName} · svele</title>
</svelte:head>

<div class="m-2 flex flex-1 flex-col gap-2">
    <div class="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-(--surface-base) p-4 px-3">
        <div class="flex items-baseline gap-3">
            <h1 class="text-2xl font-medium">{fullName}</h1>
            <span class="text-sm text-(--text-secondary)">@{profile.username}</span>
        </div>

        {#if data.canEdit}
            <a
                href="/users/{profile.username}/settings"
                class="flex items-center gap-2 rounded-lg bg-(--accent-blue) px-3 py-1.5 text-sm font-semibold text-(--accent-blue-ink) no-underline"
            >
                <Pencil class="size-4" />
                Rediger
            </a>
        {/if}
    </div>

    {#if profile.bio}
        <p class="rounded-2xl bg-(--surface-base) p-4 leading-relaxed">{profile.bio}</p>
    {/if}

    <dl class="grid gap-x-6 gap-y-3 rounded-2xl bg-(--surface-base) p-4 sm:grid-cols-2">
        {#each facts as fact (fact.label)}
            <div class="flex flex-col">
                <dt class="text-xs font-semibold tracking-wide text-(--text-secondary) uppercase">
                    {fact.label}
                </dt>
                <dd class="m-0 break-words">{fact.value}</dd>
            </div>
        {/each}
    </dl>

    {#if profile.memberships.length > 0}
        <div class="flex flex-col gap-2 rounded-2xl bg-(--surface-base) p-4">
            <h2 class="text-xs font-semibold tracking-wide text-(--text-secondary) uppercase">
                Medlemskap
            </h2>
            <ul class="flex flex-wrap gap-2">
                {#each profile.memberships as membership (membership.groupId)}
                    <li class="rounded-lg bg-(--surface-sunken) px-3 py-1.5 text-sm">
                        {membership.group.name}
                        <span class="text-(--text-secondary)">
                            · {membership.admin ? 'Admin' : membership.title}
                        </span>
                    </li>
                {/each}
            </ul>
        </div>
    {/if}
</div>
