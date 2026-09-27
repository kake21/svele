<script lang="ts">
    import { page } from '$app/state'
</script>

<h1>{page.status}</h1>
<p>{page.error?.message ?? 'Noe gikk galt'}</p>
<a href="/">Tilbake til sitatene</a>

<style>
    h1 {
        margin-bottom: 0.25rem;
        font-size: 3rem;
    }

    p {
        margin-top: 0;
        color: var(--muted);
    }
</style>
