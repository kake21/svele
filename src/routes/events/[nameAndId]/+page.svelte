<script lang="ts">
    import { enhance } from '$app/forms'
    import { invalidateAll } from '$app/navigation'
    import { CalendarDays, MapPin, Users } from 'lucide-svelte'
    import { formatEventRange } from '$lib/events/formatEventDate'
    import type { ActionReturn } from '@/services/actionTypes'
    import type { ActionData, PageData } from './$types'

    let { data, form }: { data: PageData, form: ActionData } = $props()

    let event = $derived(data.event)
    let notice = $state<string | null>(null)

    let errors = $derived.by(() => {
        const result = form as ActionReturn<unknown> | null
        if (!result || result.success) return []
        return result.error?.map(message => message.message) ?? [result.errorCode]
    })

    let registrationOpen = $derived(
        event.takesRegistration
        && new Date(event.registrationStart) <= new Date()
        && new Date(event.registrationEnd) >= new Date()
    )
    let full = $derived(event.numOfRegistrations >= event.places)
</script>

<svelte:head>
    <title>{event.name} · svele</title>
</svelte:head>

<div class="m-2 flex flex-1 flex-col gap-2">
    <div class="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-(--surface-base) p-4 px-3">
        <h1 class="text-2xl font-medium">{event.name}</h1>
        <div class="flex flex-wrap gap-1.5">
            {#each event.tags as tag (tag.id)}
                <span
                    class="rounded px-2 py-0.5 text-xs font-semibold"
                    style="background: rgb({tag.colorR} {tag.colorG} {tag.colorB} / 0.18); color: rgb({tag.colorR} {tag.colorG} {tag.colorB})"
                >{tag.name}</span>
            {/each}
        </div>
    </div>

    {#if event.coverImageUrl}
        <img src={event.coverImageUrl} alt="" class="max-h-80 w-full rounded-2xl object-cover" />
    {/if}

    <div class="flex flex-wrap gap-x-6 gap-y-2 rounded-2xl bg-(--surface-base) p-4 text-sm">
        <span class="flex items-center gap-2">
            <CalendarDays class="size-4 text-(--text-secondary)" />
            {formatEventRange(event.eventStart, event.eventEnd)}
        </span>
        {#if event.location}
            <span class="flex items-center gap-2">
                <MapPin class="size-4 text-(--text-secondary)" />{event.location}
            </span>
        {/if}
        {#if event.takesRegistration}
            <span class="flex items-center gap-2">
                <Users class="size-4 text-(--text-secondary)" />
                {event.numOfRegistrations}/{event.places} påmeldte
                {#if event.numOnWaitingList > 0}
                    · {event.numOnWaitingList} på venteliste
                {/if}
            </span>
        {/if}
    </div>

    {#if event.descriptionMd}
        <p class="rounded-2xl bg-(--surface-base) p-4 leading-relaxed whitespace-pre-wrap">
            {event.descriptionMd}
        </p>
    {/if}

    {#if errors.length > 0}
        <ul class="list-disc rounded-2xl bg-(--surface-base) p-4 pl-9 text-sm text-(--danger)" role="alert">
            {#each errors as message (message)}<li>{message}</li>{/each}
        </ul>
    {:else if notice}
        <p class="rounded-2xl bg-(--surface-base) p-4 text-sm text-(--accent-blue)">{notice}</p>
    {/if}

    {#if event.takesRegistration}
        <div class="flex flex-wrap items-center gap-3 rounded-2xl bg-(--surface-base) p-4">
            {#if !data.canRegister}
                <p class="m-0 text-sm text-(--text-secondary)">
                    <a href="/login" class="text-(--accent-blue)">Logg inn</a> for å melde deg på.
                </p>
            {:else if data.isRegistered}
                <form
                    method="POST"
                    action="?/unregister"
                    use:enhance={() => async ({ result }) => {
                        notice = result.type === 'success' ? 'Du er meldt av.' : null
                        await invalidateAll()
                    }}
                >
                    <button
                        class="rounded-lg border border-(--border) px-4 py-2 font-semibold text-(--text)"
                    >Meld meg av</button>
                </form>
            {:else}
                <form
                    method="POST"
                    action="?/register"
                    use:enhance={() => async ({ result }) => {
                        notice = result.type === 'success'
                            ? ((result.data as { data?: { onWaitingList?: boolean } })?.data?.onWaitingList
                                ? 'Du er på venteliste.'
                                : 'Du er påmeldt.')
                            : null
                        await invalidateAll()
                    }}
                >
                    <button
                        disabled={!registrationOpen}
                        class="rounded-lg bg-(--accent-blue) px-4 py-2 font-semibold text-(--accent-blue-ink) disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {#if !registrationOpen}
                            Påmelding stengt
                        {:else if full && event.waitingList}
                            Sett meg på venteliste
                        {:else}
                            Meld meg på
                        {/if}
                    </button>
                </form>
            {/if}
        </div>
    {/if}

    {#if data.registrations}
        <div class="flex flex-col gap-2 rounded-2xl bg-(--surface-base) p-4">
            <h2 class="text-xs font-semibold tracking-wide text-(--text-secondary) uppercase">
                Påmeldte ({data.registrations.length})
            </h2>
            <ol class="grid gap-1">
                {#each data.registrations as registration, index (registration.id)}
                    <li class="flex items-baseline gap-2 text-sm">
                        <span class="w-6 text-right text-(--text-secondary) tabular-nums">
                            {index + 1}.
                        </span>
                        {#if registration.user}
                            <a href="/users/{registration.user.username}" class="text-(--text)">
                                {registration.user.firstname} {registration.user.lastname}
                            </a>
                        {:else}
                            <span>{registration.contact?.name} <span class="text-(--text-secondary)">(gjest)</span></span>
                        {/if}
                        {#if index >= event.places}
                            <span class="text-xs text-(--text-secondary)">venteliste</span>
                        {/if}
                    </li>
                {/each}
            </ol>
        </div>
    {/if}
</div>
