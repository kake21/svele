<script lang="ts">
    import '../app.css'
    import DesktopSideBar from '$lib/DesktopSideBar.svelte'
    import Header from '$lib/Header.svelte'

    let { children } = $props()
</script>

<!--
    projectNext lays this out as a CSS grid with named areas and a transitioning column track.
    svele uses nested flex instead: the sidebar animates its own width (see DesktopSideBar), so
    nothing above it has to participate in the transition.

    h-dvh rather than min-h-screen, matching projectNext's 100dvh wrapper: the shell is pinned to
    the viewport and the content column scrolls inside it. That is what keeps the sidebar toggle
    on screen on a long page instead of sitting at the bottom of the document.
-->
<div class="flex h-dvh flex-col">
    <Header />

    <div class="flex min-h-0 flex-1">
        <DesktopSideBar />

        <div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
            {@render children()}

            <footer
                class="m-2 mt-0 rounded-2xl bg-(--surface-base) p-4 text-sm text-(--text-secondary)"
            >
                Service layer ported from <code
                    class="rounded bg-(--surface-sunken) px-1.5 py-0.5 text-xs"
                    >projectNext/src/services/omegaquotes</code
                >. Transport rewritten for SvelteKit.
            </footer>
        </div>
    </div>
</div>
