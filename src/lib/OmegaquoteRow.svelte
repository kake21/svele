<script lang="ts">
    import { formatTimestamp } from './formatTimestamp'
    import type { OmegaquoteFiltered } from '@/services/omegaquotes/types'

    // Quotes from the paging endpoint carry timestamp as a string, hence the widened prop type.
    let { quote }: { quote: Omit<OmegaquoteFiltered, 'timestamp'> & { timestamp: Date | string } } = $props()
</script>

<figure>
    <blockquote>{quote.quote}</blockquote>
    <figcaption>
        <span class="author">{quote.author}</span>
        <time>{formatTimestamp(quote.timestamp)}</time>
    </figcaption>
</figure>

<style>
    figure {
        margin: 0;
        padding: 1.1rem 1.25rem;
        background: var(--surface-raised);
        border: 1px solid var(--border);
        border-radius: 0.6rem;
    }

    blockquote {
        margin: 0;
        font-size: 1.05rem;
    }

    blockquote::before {
        content: '\201C';
        color: var(--accent);
        font-family: Georgia, serif;
        font-size: 1.4em;
        line-height: 0;
        vertical-align: -0.25em;
        margin-right: 0.1em;
    }

    blockquote::after {
        content: '\201D';
        color: var(--accent);
        font-family: Georgia, serif;
        font-size: 1.4em;
        line-height: 0;
        vertical-align: -0.25em;
        margin-left: 0.05em;
    }

    figcaption {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 1rem;
        margin-top: 0.7rem;
        font-size: 0.85rem;
        color: var(--muted);
    }

    .author {
        font-weight: 600;
        color: var(--ink);
    }
</style>
