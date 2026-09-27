import { Info, Quote } from 'lucide-svelte'
import type { IconProps } from 'lucide-svelte'
import type { ComponentType, SvelteComponent } from 'svelte'

/**
 * Mirrors projectNext's src/app/_components/NavBar/navDef.ts: the nav is data, and the sidebar
 * just renders it.
 *
 * projectNext stores a FontAwesome IconDefinition per item and renders it through
 * @fortawesome/react-fontawesome. svele stores a lucide-svelte component instead - same
 * data-driven shape, but the icons are plain Svelte components, so each one imported is each one
 * bundled and there is no icon-library runtime in between.
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
