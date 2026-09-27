import adapter from '@sveltejs/adapter-node'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
export default {
    preprocess: vitePreprocess(),
    kit: {
        adapter: adapter(),
        alias: {
            // Mirrors projectNext's aliasing style so ported files need minimal edits.
            '@/services': 'src/lib/services',
            '@/server': 'src/lib/server',
            '@/lib': 'src/lib',
            '@/prisma-client-instance': 'src/lib/server/prisma.ts',
            '@/prisma-generated-client': 'generated/prisma/client.ts',
        },
    },
}
