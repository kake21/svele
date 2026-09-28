<script lang="ts">
    import { page } from '$app/state'
    import PanelLeftClose from 'lucide-svelte/icons/panel-left-close'
    import PanelLeftOpen from 'lucide-svelte/icons/panel-left-open'
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
      $gap * 5 = 2.5rem -> h-12   (toggle: matched to a nav row, see below)
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
    <!--
        One island holding both the links and the toggle, so the sidebar reads as a single panel
        rather than a panel with a detached control under it. The island is pinned to the expanded
        width and clipped by the aside, which is what lets the width animate without relaying out
        anything inside it.
    -->
    <div class="flex min-h-0 w-[220px] flex-1 flex-col gap-1 rounded-2xl bg-(--surface-base) p-2">
        <nav
            class="flex min-h-0 flex-1 flex-col items-stretch gap-1 overflow-x-hidden overflow-y-auto"
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

        <!--
            Same geometry as a nav row - h-12, px-3, icon at ml-1 - so the toggle's glyph sits on
            the same vertical line as every nav icon whether the sidebar is open or shut. The
            border is what keeps it reading as a control rather than a fifth destination.
        -->
        <button
            type="button"
            onclick={() => (expanded = !expanded)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse navigation' : 'Expand navigation'}
            class="mt-1 flex h-12 shrink-0 items-center rounded-lg border-t border-(--border) px-3 text-(--text-secondary) transition-colors duration-300 ease-out hover:bg-(--accent-blue) hover:text-(--accent-blue-ink)"
        >
            {#if expanded}
                <PanelLeftClose class="ml-1 size-4 shrink-0" />
            {:else}
                <PanelLeftOpen class="ml-1 size-4 shrink-0" />
            {/if}
            <span
                class="ml-2 overflow-hidden whitespace-nowrap transition-opacity duration-300 ease-out"
                class:opacity-0={!expanded}
            >
                Skjul meny
            </span>
        </button>
    </div>
</aside>
