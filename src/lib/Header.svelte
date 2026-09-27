<!--
    Ported from the React version. Two Svelte-specific changes:
      - `class` rather than `className`
      - the mask declarations move into a scoped <style> block instead of an inline style
        object, so the vendor-prefixed pair does not have to be written twice by hand
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
