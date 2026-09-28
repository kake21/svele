<script lang="ts">
    import { Quote } from 'lucide-svelte'
    import ListRow from './ListRow.svelte'
    import { formatTimestamp } from '$lib/formatTimestamp'
    import type { OmegaquoteFiltered } from '@/services/omegaquotes/types'

    let { quote }: { quote: Omit<OmegaquoteFiltered, 'timestamp'> & { timestamp: Date | string } } =
        $props()
</script>

<!--
    projectNext's OmegaquoteRow. It is deliberately not a link - there is nowhere to go - so the
    row renders as a div and gets no hover affordance that would suggest otherwise.

    The quote takes the display serif in italic and is clamped to two lines, since a quote rarely
    fits the single ellipsised line a row title normally gets.
-->
<ListRow>
    {#snippet lead()}
        <Quote class="size-5 text-(--text-secondary)" />
    {/snippet}

    {#snippet main()}
        <p class="font-display m-0 line-clamp-2 text-base font-medium text-(--text) italic">
            {quote.quote}
        </p>
        <p class="m-0 truncate text-sm text-(--text-secondary)">{quote.author}</p>
    {/snippet}

    {#snippet meta()}
        <span>{formatTimestamp(quote.timestamp)}</span>
    {/snippet}
</ListRow>
