<script lang="ts">
    import { LogIn } from 'lucide-svelte'

    let { user }: { user: { username: string, firstname: string } | null } = $props()
</script>

<!--
    Ported from the React version. Two Svelte-specific changes: `class` rather than `className`,
    and the mask declarations move into a scoped <style> block instead of an inline style object,
    so the vendor-prefixed pair does not have to be written twice by hand.
-->
<header class="w-full">
    <nav class="flex h-16 m-2 mb-0 items-center gap-2 rounded-2xl text-(--text)">
        <div class="bg-(--surface-base) p-2 rounded-2xl">
            <a
                href="/"
                aria-label="Go to homepage"
                class="flex h-12 w-12 items-center justify-center rounded-lg bg-(--accent-blue) p-2"
            >
                <span
                    role="img"
                    aria-label="logo"
                    class="logo h-7.5 w-7.5 bg-(--surface-base)"
                ></span>
            </a>
        </div>

        <span class="ml-2 text-3xl font-medium">svele</span>

        <div class="ml-auto flex h-full items-center gap-2 rounded-2xl bg-(--surface-base) px-3">
            {#if user}
                <a
                    href="/users/{user.username}"
                    class="text-sm font-semibold text-(--text) hover:text-(--accent-blue)"
                >
                    {user.firstname}
                </a>
                <form method="POST" action="/logout">
                    <button
                        type="submit"
                        class="rounded-lg px-3 py-1.5 text-sm font-semibold text-(--text-secondary) hover:bg-(--surface-sunken) hover:text-(--text)"
                    >
                        Logg ut
                    </button>
                </form>
            {:else}
                <a
                    href="/login"
                    class="flex items-center gap-2 rounded-lg bg-(--accent-blue) px-3 py-1.5 text-sm font-semibold text-(--accent-blue-ink)"
                >
                    <LogIn class="size-4" />
                    Logg inn
                </a>
            {/if}
        </div>
    </nav>
</header>

<style>
    .logo {
        -webkit-mask-image: url('/favicon.svg');
        mask-image: url('/favicon.svg');
        -webkit-mask-repeat: no-repeat;
        mask-repeat: no-repeat;
        -webkit-mask-size: contain;
        mask-size: contain;
        -webkit-mask-position: center;
        mask-position: center;
    }
</style>
