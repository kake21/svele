<script lang="ts">
    import type { EventTag } from '../../../generated/prisma/client.js'

    let { tags, activeTags, basePath }: {
        tags: EventTag[],
        activeTags: string[],
        basePath: string,
    } = $props()

    // Filters live in the URL, so a filtered list is a shareable link and the back button works.
    function hrefFor(name: string): string {
        const next = activeTags.includes(name)
            ? activeTags.filter(tag => tag !== name)
            : [...activeTags, name]
        const params = new URLSearchParams()
        for (const tag of next) params.append('tag', tag)
        return `${basePath}${params.toString() ? `?${params}` : ''}`
    }
</script>

{#if tags.length > 0}
    <div class="flex flex-wrap items-center gap-2 rounded-2xl bg-(--surface-base) p-3">
        <span class="text-xs font-semibold tracking-wide text-(--text-secondary) uppercase">
            Filter
        </span>
        {#each tags as tag (tag.id)}
            {@const active = activeTags.includes(tag.name)}
            <a
                href={hrefFor(tag.name)}
                aria-current={active ? 'true' : undefined}
                class="rounded-lg px-2.5 py-1 text-sm font-semibold no-underline"
                style={active
                    ? `background: rgb(${tag.colorR} ${tag.colorG} ${tag.colorB}); color: white`
                    : `background: rgb(${tag.colorR} ${tag.colorG} ${tag.colorB} / 0.15); color: rgb(${tag.colorR} ${tag.colorG} ${tag.colorB})`}
            >
                {tag.name}
            </a>
        {/each}
        {#if activeTags.length > 0}
            <a href={basePath} class="ml-1 text-sm text-(--text-secondary)">Nullstill</a>
        {/if}
    </div>
{/if}
