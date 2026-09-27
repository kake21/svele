import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
    // Tailwind must come before sveltekit so the generated CSS is available to the
    // Svelte component transforms.
    plugins: [tailwindcss(), sveltekit()],
    server: {
        port: 5173,
        // Required for HMR to reach the browser through the container boundary.
        watch: { usePolling: true },
    },
    ssr: {
        // The generated Prisma client is CJS-interop-heavy and must not be bundled by Vite.
        external: ['@prisma/client'],
    },
})
