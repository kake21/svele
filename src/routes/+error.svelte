<script lang="ts">
    import { page } from '$app/state'
</script>

<div class="m-2 flex flex-1 flex-col gap-2">
    <div class="rounded-2xl bg-(--surface-base) p-4">
        <h1 class="text-5xl font-medium">{page.status}</h1>
        <p class="mt-1 text-(--text-secondary)">{page.error?.message ?? 'Noe gikk galt'}</p>
        <a class="mt-4 inline-block text-(--accent-blue) hover:underline" href="/">
            Tilbake til sitatene
        </a>
    </div>
</div>
