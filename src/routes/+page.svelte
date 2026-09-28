<script lang="ts">
    import { ArrowRight, CalendarDays, Quote, Users } from 'lucide-svelte'
    import EventCard from '$lib/events/EventCard.svelte'
    import { formatTimestamp } from '$lib/formatTimestamp'
    import type { PageData } from './$types'

    let { data }: { data: PageData } = $props()

    let stats = $derived([
        { label: 'brukere', value: data.counts.users, href: '/users', icon: Users },
        { label: 'sitater', value: data.counts.quotes, href: '/sitater', icon: Quote },
        { label: 'arrangementer', value: data.counts.events, href: '/events', icon: CalendarDays },
    ])
</script>

<svelte:head>
    <title>svele</title>
    <meta
        name="description"
        content="svele er en én-domenes port av projectNext til SvelteKit, bygget for å teste om ServiceOperation-mønsteret overlever utenfor Next.js."
    />
</svelte:head>

<div class="m-2 flex flex-1 flex-col gap-2">
    <!-- Hero -->
    <section class="flex flex-col gap-4 rounded-2xl bg-(--surface-base) p-6 sm:p-10">
        <p class="text-xs font-semibold tracking-[0.12em] text-(--accent-blue) uppercase">
            svelte &times; vev
        </p>

        <h1 class="max-w-3xl text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl">
            projectNext, portert til SvelteKit —
            <span class="text-(--text-secondary)">og målt underveis.</span>
        </h1>

        <p class="max-w-2xl text-lg leading-relaxed text-(--text-secondary)">
            svele porterer sitater, brukere og arrangementer fra projectNext for å svare på ett
            spørsmål: overlever ServiceOperation-mønsteret utenfor Next.js? Tjenestelaget kom over
            nesten uendret. Det var transportlaget som måtte skrives om.
        </p>

        <div class="mt-1 flex flex-wrap gap-2">
            <a
                href="/events"
                class="flex items-center gap-2 rounded-lg bg-(--accent-blue) px-4 py-2.5 font-semibold text-(--accent-blue-ink) no-underline"
            >
                Se arrangementer
                <ArrowRight class="size-4" />
            </a>
            <a
                href="/om"
                class="rounded-lg border border-(--border) px-4 py-2.5 font-semibold text-(--text) no-underline hover:bg-(--surface-sunken)"
            >
                Om prosjektet
            </a>
            {#if !data.signedIn}
                <a
                    href="/login"
                    class="rounded-lg px-4 py-2.5 font-semibold text-(--text-secondary) no-underline hover:text-(--text)"
                >
                    Logg inn
                </a>
            {/if}
        </div>
    </section>

    <!-- Live counts, straight out of the ported schema -->
    <section class="grid gap-2 sm:grid-cols-3">
        {#each stats as stat (stat.label)}
            {@const Icon = stat.icon}
            <a
                href={stat.href}
                class="flex items-center gap-4 rounded-2xl bg-(--surface-base) p-4 no-underline hover:outline-2 hover:outline-(--accent-blue)"
            >
                <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-(--surface-sunken)">
                    <Icon class="size-5 text-(--accent-blue)" />
                </span>
                <span class="flex flex-col">
                    <span class="text-2xl font-semibold tabular-nums text-(--text)">{stat.value}</span>
                    <span class="text-sm text-(--text-secondary)">{stat.label}</span>
                </span>
            </a>
        {/each}
    </section>

    <!-- Upcoming events -->
    {#if data.events.length > 0}
        <section class="flex flex-col gap-2">
            <div class="flex items-baseline justify-between gap-3 rounded-2xl bg-(--surface-base) px-4 py-3">
                <h2 class="text-lg font-semibold">Neste arrangementer</h2>
                <a href="/events" class="text-sm text-(--accent-blue)">Alle</a>
            </div>
            <ol class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {#each data.events as event (event.id)}
                    <li class="contents"><EventCard {event} /></li>
                {/each}
            </ol>
        </section>
    {/if}

    <!-- Recent quotes -->
    {#if data.quotes.length > 0}
        <section class="flex flex-col gap-2">
            <div class="flex items-baseline justify-between gap-3 rounded-2xl bg-(--surface-base) px-4 py-3">
                <h2 class="text-lg font-semibold">Siste sitater</h2>
                <a href="/sitater" class="text-sm text-(--accent-blue)">Alle</a>
            </div>
            <ol class="grid gap-2">
                {#each data.quotes as quote (quote.id)}
                    <li>
                        <figure class="rounded-2xl bg-(--surface-base) p-4">
                            <blockquote class="text-base">
                                <span class="text-(--accent-blue)" aria-hidden="true">&ldquo;</span
                                >{quote.quote}<span class="text-(--accent-blue)" aria-hidden="true"
                                    >&rdquo;</span
                                >
                            </blockquote>
                            <figcaption class="mt-2 flex items-baseline justify-between gap-4 text-sm">
                                <span class="font-semibold text-(--text)">{quote.author}</span>
                                <time class="text-(--text-secondary)">
                                    {formatTimestamp(quote.timestamp)}
                                </time>
                            </figcaption>
                        </figure>
                    </li>
                {/each}
            </ol>
        </section>
    {/if}
</div>
