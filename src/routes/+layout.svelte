<script lang="ts">
    import '../app.css'

    let { children } = $props()
</script>

<div class="shell">
    <header>
        <a class="brand" href="/">
            <span class="mark">S</span>
            <span class="wordmark">svele</span>
        </a>
        <p class="tagline">svelte &times; vev &mdash; a mini projectNext</p>
    </header>

    <main>
        {@render children()}
    </main>

    <footer>
        <p>
            Service layer ported from
            <code>projectNext/src/services/omegaquotes</code>. Transport rewritten for SvelteKit.
        </p>
    </footer>
</div>

<style>
    .shell {
        max-width: 44rem;
        margin: 0 auto;
        padding: 0 1.25rem;
    }

    header {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 0.4rem 1.2rem;
        padding: 2.2rem 0 1.4rem;
        border-bottom: 1px solid var(--border);
    }

    .brand {
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
        text-decoration: none;
        color: inherit;
    }

    .mark {
        display: grid;
        place-items: center;
        width: 2rem;
        height: 2rem;
        border-radius: 0.5rem;
        background: var(--accent);
        color: var(--accent-ink);
        font-family: Georgia, serif;
        font-size: 1.25rem;
        line-height: 1;
    }

    .wordmark {
        font-size: 1.5rem;
        font-weight: 600;
        letter-spacing: -0.01em;
    }

    .tagline {
        margin: 0;
        color: var(--muted);
        font-size: 0.9rem;
    }

    main {
        padding: 2rem 0 3rem;
    }

    footer {
        padding: 1.5rem 0 3rem;
        border-top: 1px solid var(--border);
        color: var(--muted);
        font-size: 0.85rem;
    }

    footer p {
        margin: 0;
    }

    code {
        font-size: 0.85em;
        background: var(--surface);
        padding: 0.1em 0.35em;
        border-radius: 0.25rem;
    }
</style>
