<script lang="ts">
    import { Inbox } from 'lucide-svelte'
    import type { Snippet } from 'svelte'

    let { title, href, empty = false, emptyMessage = 'Ingenting å vise her enda', children }: {
        title: string,
        href: string,
        /** Whether to show the placeholder instead of the rows. */
        empty?: boolean,
        emptyMessage?: string,
        children: Snippet,
    } = $props()
</script>

<!--
    Ported from projectNext's src/app/(frontpage)/LoggedInSection.tsx and its SCSS module.

    Each section is its own island: the card surface belongs to the section rather than to the
    page, so the page gradient shows between them. The heading takes the display serif, and
    "Se flere" is deliberately shaped like the header-item pill so the two read as one kind of
    control.

    React counts children to decide emptiness. A snippet cannot be counted, so the caller passes
    `empty` explicitly - which is the better arrangement anyway, since the caller is the one that
    knows whether a section is empty because there is no data or because it was not permitted to
    read any.
-->
<section class="flex min-w-0 flex-col gap-4 rounded-2xl bg-(--surface-base) p-4 sm:p-6">
    <div class="flex items-center justify-between gap-4">
        <h2 class="font-display truncate text-2xl font-bold">{title}</h2>
        <a
            {href}
            class="flex h-10 shrink-0 items-center rounded-lg bg-(--surface-hover) px-4 text-sm font-medium text-(--text) no-underline transition-colors hover:bg-(--surface-raised)"
        >
            Se flere
        </a>
    </div>

    <!--
        A fixed minimum so an empty island does not collapse next to a full one - projectNext pins
        both the row list and the placeholder to the same height for the same reason.
    -->
    <div class="flex min-h-[19rem] flex-col gap-2">
        {#if empty}
            <div class="flex flex-1 flex-col items-center justify-center gap-2 text-center text-(--text-secondary)">
                <Inbox class="size-12 opacity-50" />
                <p class="m-0 text-sm">{emptyMessage}</p>
            </div>
        {:else}
            {@render children()}
        {/if}
    </div>
</section>
