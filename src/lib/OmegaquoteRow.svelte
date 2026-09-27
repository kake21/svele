<script lang="ts">
    import { formatTimestamp } from './formatTimestamp'
    import type { OmegaquoteFiltered } from '@/services/omegaquotes/types'

    // Quotes from the paging endpoint carry timestamp as a string, hence the widened prop type.
    let { quote }: { quote: Omit<OmegaquoteFiltered, 'timestamp'> & { timestamp: Date | string } } =
        $props()
</script>

<figure class="rounded-2xl bg-(--surface-base) p-4">
    <blockquote class="text-base">
        <span class="text-(--accent-blue)" aria-hidden="true">&ldquo;</span>{quote.quote}<span
            class="text-(--accent-blue)"
            aria-hidden="true">&rdquo;</span
        >
    </blockquote>
    <figcaption class="mt-2 flex items-baseline justify-between gap-4 text-sm">
        <span class="font-semibold text-(--text)">{quote.author}</span>
        <time class="text-(--text-secondary)">{formatTimestamp(quote.timestamp)}</time>
    </figcaption>
</figure>
