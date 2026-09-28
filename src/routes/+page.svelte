<script lang="ts">
    import EventRow from '$lib/frontpage/EventRow.svelte'
    import QuoteRow from '$lib/frontpage/QuoteRow.svelte'
    import Section from '$lib/frontpage/Section.svelte'
    import UserRow from '$lib/frontpage/UserRow.svelte'
    import type { PageData } from './$types'

    let { data }: { data: PageData } = $props()
</script>

<svelte:head>
    <title>svele</title>
    <meta
        name="description"
        content="svele er en port av projectNext til SvelteKit, bygget for å teste om ServiceOperation-mønsteret overlever utenfor Next.js."
    />
</svelte:head>

<div class="m-2 flex flex-1 flex-col gap-2">
    <div class="grid gap-2 lg:grid-cols-2">
        <Section
            title="Hvad der hender"
            href="/events"
            empty={data.upcoming.length === 0}
            emptyMessage="Det er for tiden ingen kommende arrangementer"
        >
            {#each data.upcoming as event (event.id)}
                <EventRow {event} />
            {/each}
        </Section>

        <Section
            title="Omegaquotes"
            href="/sitater"
            empty={data.quotes.length === 0}
            emptyMessage={data.canReadQuotes
                ? 'Det er ingen sitater å vise enda'
                : 'Du har ikke tilgang til sitatene'}
        >
            {#each data.quotes as quote (quote.id)}
                <QuoteRow {quote} />
            {/each}
        </Section>

        <Section
            title="Arkiv"
            href="/events/archive"
            empty={data.archived.length === 0}
            emptyMessage="Det er ingen tidligere arrangementer enda"
        >
            {#each data.archived as event (event.id)}
                <EventRow {event} />
            {/each}
        </Section>

        <Section
            title="Brukere"
            href="/users"
            empty={data.users.length === 0}
            emptyMessage={data.canReadUsers
                ? 'Det er ingen brukere å vise enda'
                : data.signedIn
                    ? 'Du har ikke tilgang til brukerlisten'
                    : 'Logg inn for å se brukerlisten'}
        >
            {#each data.users as user (user.id)}
                <UserRow {user} />
            {/each}
        </Section>
    </div>
</div>
