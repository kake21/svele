<script lang="ts">
    import { getPageTitleContext } from './pageTitle.svelte'

    let { title }: { title: string } = $props()

    const store = getPageTitleContext()

    // An effect rather than a plain assignment, so the title follows a changing prop and is
    // released when the page unmounts - otherwise a stale title would outlive its page.
    $effect(() => {
        store.override = title
        return () => {
            store.override = null
        }
    })
</script>
