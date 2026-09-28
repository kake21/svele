<script lang="ts">
    import type { Snippet } from 'svelte'

    let { href, progress, lead, main, meta }: {
        /** Renders as a link when given, a plain div otherwise. */
        href?: string,
        /** 0-1. Draws the fill bar along the bottom edge; omit for no bar. */
        progress?: number,
        lead: Snippet,
        main: Snippet,
        meta?: Snippet,
    } = $props()

    let clamped = $derived(progress === undefined ? null : Math.max(0, Math.min(progress, 1)))
</script>

<!--
    projectNext's `listRow` mixin, which EventCard, OmegaquoteRow and the other row renderings all
    share. Three slots - a narrow lead column, a flexible middle, an optional right-aligned meta -
    plus an absolutely positioned fill bar along the bottom edge.

    The mixin uses container queries to drop the meta column when the row itself is narrow rather
    than when the viewport is, because these rows appear both full width and inside half-width
    islands. That is worth keeping: @container, not a media query.
-->
{#snippet body()}
    <div class="flex w-16 shrink-0 flex-col items-center justify-center leading-none">
        {@render lead()}
    </div>

    <div class="flex min-w-0 flex-1 flex-col justify-center gap-1 px-4">
        {@render main()}
    </div>

    {#if meta}
        <div
            class="hidden shrink-0 flex-col items-end justify-center gap-1 px-4 text-right text-xs text-(--text-secondary) @[34rem]:flex"
        >
            {@render meta()}
        </div>
    {/if}

    {#if clamped !== null}
        <div class="absolute inset-x-0 bottom-0 h-1 bg-(--surface-hover)">
            <div class="h-full bg-(--accent-blue)" style="width: {clamped * 100}%"></div>
        </div>
    {/if}
{/snippet}

{#if href}
    <a
        {href}
        class="relative flex h-24 items-stretch overflow-hidden rounded-2xl bg-(--surface-raised) text-(--text) no-underline transition-colors hover:bg-(--surface-hover) @container"
    >
        {@render body()}
    </a>
{:else}
    <div
        class="relative flex h-24 items-stretch overflow-hidden rounded-2xl bg-(--surface-raised) text-(--text) @container"
    >
        {@render body()}
    </div>
{/if}
