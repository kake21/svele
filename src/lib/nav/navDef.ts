import Info from 'lucide-svelte/icons/info'
import Quote from 'lucide-svelte/icons/quote'
import type { IconProps } from 'lucide-svelte'
import type { ComponentType, SvelteComponent } from 'svelte'

/**
 * Mirrors projectNext's src/app/_components/NavBar/navDef.ts: the nav is data, and the sidebar
 * just renders it.
 *
 * projectNext stores a FontAwesome IconDefinition per item and renders it through
 * @fortawesome/react-fontawesome. svele stores a lucide-svelte component instead.
 *
 * This was measured rather than assumed. Same four icons, same production build:
 *
 *     lucide-svelte   146,148 B raw / 48,257 B gzipped   (layout chunk 38,384 B)
 *     FontAwesome     214,625 B raw / 70,110 B gzipped   (layout chunk 107,268 B)
 *
 * The difference is @fortawesome/fontawesome-svg-core, a runtime that ships whether or not you
 * use the registry, DOM watching, layers, transforms and masks it exists to provide. A lucide
 * icon compiles to a Svelte component with inline SVG and needs no runtime at all.
 *
 * Icons are imported per-file rather than from the lucide-svelte barrel. The production bundle is
 * byte-identical either way - Rollup tree-shakes the barrel cleanly - but the dev server starts
 * faster with fewer modules in the graph (476ms vs 684ms cold).
 */
export type NavItem = {
    name: string,
    href: string,
    // lucide-svelte 1.x still ships icons as legacy class components, so this is
    // ComponentType<SvelteComponent<...>> rather than Svelte 5's functional `Component`.
    icon: ComponentType<SvelteComponent<IconProps>>,
}

export const navItems: NavItem[] = [
    {
        name: 'Sitater',
        href: '/',
        icon: Quote,
    },
    {
        name: 'Om svele',
        href: '/om',
        icon: Info,
    },
]
