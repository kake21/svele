<svelte:head>
    <title>Om svele</title>
</svelte:head>

<div class="m-2 flex flex-1 flex-col gap-2">
    <div
        class="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-(--surface-base) p-4 px-3"
    >
        <h1 class="text-2xl font-medium">Om svele</h1>
        <span class="text-sm text-(--text-secondary)">svelte &times; vev</span>
    </div>

    <div class="flex flex-col gap-3 rounded-2xl bg-(--surface-base) p-4 leading-relaxed">
        <p>
            svele er en én-domenes port av <strong>projectNext</strong> til SvelteKit, bygget for å
            teste om ServiceOperation-mønsteret overlever utenfor Next.js.
        </p>
        <p>
            Tjenestelaget — <code class="rounded bg-(--surface-sunken) px-1.5 py-0.5 text-xs"
                >operations</code
            >,
            <code class="rounded bg-(--surface-sunken) px-1.5 py-0.5 text-xs">schemas</code>,
            <code class="rounded bg-(--surface-sunken) px-1.5 py-0.5 text-xs">auth</code> og
            pagineringen — kom over nesten uendret. Det var transportlaget som måtte skrives om:
            SvelteKit har to transporter der Next har én, så
            <code class="rounded bg-(--surface-sunken) px-1.5 py-0.5 text-xs">makeAction()</code> ble
            til tre mindre hjelpere, og tjenestemappen mistet
            <code class="rounded bg-(--surface-sunken) px-1.5 py-0.5 text-xs">actions.ts</code> helt.
        </p>
        <p class="text-(--text-secondary)">
            Hele gjennomgangen ligger i <code
                class="rounded bg-(--surface-sunken) px-1.5 py-0.5 text-xs">README.md</code
            > i repoet.
        </p>
    </div>
</div>
