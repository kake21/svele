<script lang="ts">
    import { page } from '$app/state'
    import ChevronLeft from 'lucide-svelte/icons/chevron-left'
    import ChevronRight from 'lucide-svelte/icons/chevron-right'
    import { navItems } from './nav/navDef'

    let expanded = $state(false)
</script>

<!--
    Ported from projectNext's DesktopSideBar.tsx + DesktopSideBar.module.scss.

    Token mapping (projectNext -> Tailwind), so the geometry is identical:
      $gap: 0.5rem      -> gap-2 / p-2 / m-2
      $rounding: 1rem   -> rounded-2xl
      $rounding - $gap  -> rounded-lg (0.5rem)
      $gap * 6 = 3rem   -> h-12   (nav item)
      $gap * 5 = 2.5rem -> h-10   (toggle)
      $gap * 2 = 1rem   -> size-4 (icon)
      $nav-height: 64px -> w-16   (collapsed)
      expanded          -> w-[220px]
      $mobileBreakpoint -> hidden below 800px

    Four things are done differently on purpose, all of them cheaper:

    1. projectNext widens the sidebar by transitioning `grid-template-columns` on the page grid,
       reached into from the layout with `:has([data-expanded='true'])`. Animating a grid track
       relayouts the whole grid every frame, and the `:has()` makes the layout depend on a
       descendant's state. Here the aside is a flex item that transitions its own `width`, so the
       work is one element and the layout never needs to know why.

    2. projectNext animates `max-width` on every label, so an N-item sidebar runs N layout-driven
       transitions per toggle. Here the labels have static layout and are clipped by the aside's
       overflow-hidden; only `opacity` animates, which the compositor handles without layout.

    3. projectNext wraps each collapsed item in a NavTooltip component. The accessible name is
       already on the link, so a plain `title` covers the pointer affordance with no extra
       component and no extra DOM.

    4. Icons are lucide-svelte components imported by name rather than FontAwesome definitions fed
       through a renderer, so only the icons actually used reach the bundle.
-->
<aside
    class="m-2 mr-0 hidden min-h-0 shrink-0 flex-col gap-2 overflow-hidden transition-[width] duration-300 ease-out min-[800px]:flex"
    class:w-16={!expanded}
    class:w-[220px]={expanded}
>
    <nav
        class="flex min-h-0 w-[220px] flex-1 flex-col items-stretch gap-1 overflow-x-hidden overflow-y-auto rounded-2xl bg-(--surface-base) p-2"
        aria-label="Desktop navigation"
    >
        {#each navItems as item (item.href)}
            {@const Icon = item.icon}
            {@const active = page.url.pathname === item.href}
            <a
                href={item.href}
                aria-label={item.name}
                aria-current={active ? 'page' : undefined}
                title={expanded ? undefined : item.name}
                class="flex h-12 shrink-0 items-center rounded-lg px-3 text-(--text) no-underline transition-colors duration-300 ease-out hover:bg-(--accent-blue) hover:text-(--accent-blue-ink) aria-[current=page]:bg-(--surface-sunken)"
            >
                <Icon class="ml-1 size-4 shrink-0" />
                <span
                    class="ml-2 overflow-hidden whitespace-nowrap transition-opacity duration-300 ease-out"
                    class:opacity-0={!expanded}
                >
                    {item.name}
                </span>
            </a>
        {/each}
    </nav>

    <button
        type="button"
        onclick={() => (expanded = !expanded)}
        aria-expanded={expanded}
        aria-label={expanded ? 'Collapse navigation' : 'Expand navigation'}
        class="flex h-10 w-[220px] shrink-0 items-center rounded-2xl bg-(--surface-base) text-(--text) transition-colors duration-300 ease-out hover:bg-(--accent-blue) hover:text-(--accent-blue-ink)"
    >
        <!-- Pinned to the collapsed width's centre so the glyph does not slide while widening. -->
        <span class="flex w-16 shrink-0 justify-center">
            {#if expanded}
                <ChevronLeft class="size-4" />
            {:else}
                <ChevronRight class="size-4" />
            {/if}
        </span>
    </button>
</aside>
