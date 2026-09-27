<script lang="ts">
    import '../app.css'
    import Header from '$lib/Header.svelte'

    let { children } = $props()
</script>

<!--
    min-h-screen + flex-col is what lets the page's own root use `flex-1` - without a flex
    column of known height here, `flex-1` on the child has nothing to grow against.
-->
<div class="flex min-h-screen flex-col bg-(--bg)">
    <Header />

    {@render children()}

    <footer class="m-2 mt-0 rounded-2xl bg-(--surface-base) p-4 text-sm text-(--text-secondary)">
        Service layer ported from <code class="rounded bg-(--surface-sunken) px-1.5 py-0.5 text-xs"
            >projectNext/src/services/omegaquotes</code
        >. Transport rewritten for SvelteKit.
    </footer>
</div>
