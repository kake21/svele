| SCSS modules | Tailwind v4 | **rewritten** |
| `NavBar/DesktopSideBar.tsx` + `.module.scss` | `lib/DesktopSideBar.svelte` | **ported, optimised** |
| `NavBar/navDef.ts` (FontAwesome) | `lib/nav/navDef.ts` (lucide-svelte) | **ported** |
| `layout.module.scss` gradient | `app.css` on the canvas | **ported** |
# Svele

mini SvelteKit port of projectNext

A one-domain SvelteKit port of projectNext, built to answer one question: **does the
ServiceOperation pattern survive outside Next.js?** It ports `omegaquotes` end to end — service
layer, validation, error contract, cursor paging, create form — with no auth.

## Running it

Two ways. The Nix shell is faster to work in; the full Docker stack is closer to how projectNext
runs and needs nothing installed.

### With Nix (recommended on NixOS)

Postgres stays in a container, everything else runs natively:

```bash
docker compose up -d db     # Postgres only, host port 5433
nix develop                 # or `direnv allow` once, then just cd here
npm ci
npx prisma db push
npm run db:seed
npm run dev                 # http://localhost:5173
```

Do **not** run the full `docker compose up` at the same time — the svele container publishes 5173
too.

`nix build` produces the adapter-node production server, and `nix run` starts it:

```bash
nix build                                      # ./result/bin/svele
DB_URI=postgresql://svele:svele@localhost:5433/svele PORT=3000 ./result/bin/svele
```

### With Docker only

```bash
cp .env.default .env      # already done
docker compose up --build
```

Then open <http://localhost:5173>. First boot runs `prisma db push`, seeds 25 quotes, and starts
Vite. The database is on host port **5433** so it does not collide with projectNext's 5432.

```bash
docker compose exec svele npx svelte-check --tsconfig ./tsconfig.json   # typecheck
docker compose exec db psql -U svele -d svele                           # poke the db
docker compose down -v                                                  # reset everything
```

## Nix notes

The flake exists mostly to solve one problem, and it is worth knowing what it is.

**Prisma's prebuilt engine binaries do not run on NixOS.** They are dynamically linked against an
FHS layout that does not exist, and the failure is a confusing ENOENT naming the *interpreter*
rather than the file. Prisma 7 narrows this to a single binary: with a driver adapter (svele uses
`PrismaPg`) there is no native query engine at runtime at all, and schema parsing moved to WASM.
Only `prisma db push` and `migrate` still need a native `schema-engine`.

nixpkgs' `prisma-engines` ships exactly that one binary and carries a setup-hook exporting
`PRISMA_SCHEMA_ENGINE_BINARY`, so listing it in `devShells.default` is the whole fix — no `patchelf`,
no `nix-ld`, no FHS user env. nixos-unstable currently has **prisma-engines 7.10.0**, an exact match
for the `prisma` version in `package-lock.json`; if those ever drift, pin the npm side to whatever
`pkgs.prisma-engines.version` reports, because Prisma checks that the engine matches the CLI.

Three smaller things the flake encodes:

- **`svelte-kit sync` must run before `prisma generate`**, not after. Prisma 7's `prisma-client`
  generator emits TypeScript and reads `tsconfig.json` to do it, and `tsconfig.json` extends
  `.svelte-kit/tsconfig.json`. Getting this backwards fails with a misleading
  `File './.svelte-kit/tsconfig.json' not found`.
- **`@sveltejs/kit` is a runtime dependency, not a dev one.** adapter-node leaves it external rather
  than bundling it, so `npm prune --omit=dev` would delete it out from under the built server. It
  sits in `dependencies` for that reason. `svelte` genuinely is dev-only — the compiler output is
  self-contained for SSR.
- **`prisma:warn Prisma failed to detect the libssl/openssl version` is harmless here.** Prisma
  probes for libssl to pick a query engine build, and svele never loads a query engine. Putting
  openssl on `LD_LIBRARY_PATH` does not silence it, so the flake does not pretend to.

The `nix build` closure is ~360MB. That is Prisma rather than packaging: `@prisma/client` 7.x
declares the entire `prisma` CLI as a runtime dependency, which drags in `effect`, `@electric-sql`
and `typescript`. Pruning keeps them because the dependency graph genuinely asks for them.
## Styling

Tailwind v4, via `@tailwindcss/vite` — no `tailwind.config.js`, no PostCSS config. `src/app.css` is
`@import 'tailwindcss'` plus a `:root` token block and a `prefers-color-scheme: dark` override.

Tokens are referenced through v4's arbitrary-property shorthand — `bg-(--surface-base)`,
`text-(--text-secondary)` — rather than through `@theme`, so component class names match the ones
the layout was specified in. No component carries a `<style>` block any more, with one deliberate
exception: `Header.svelte` keeps a scoped block for the logo's mask declarations, so the
vendor-prefixed pair does not have to be written twice inline.

Page structure follows a fixed shape:

```svelte
<div class="m-2 flex flex-1 flex-col gap-2">
    <div class="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-(--surface-base) p-4 px-3">
        <!-- toolbar -->
    </div>
    <!-- content -->
</div>
```

`flex-1` only works because `+layout.svelte` wraps everything in `min-h-screen flex-col` — without a
flex column of known height above it, the page root has nothing to grow against.

The header logo is a `<span>` whose background is masked by the SVG, rather than an `<img>`. That is
what lets it take its colour from `bg-(--surface-base)` and flip with the theme; an `<img>` would
keep the file's own colours.

## The sidebar

Ported from projectNext's `DesktopSideBar.tsx` + `DesktopSideBar.module.scss`, geometry intact —
64px collapsed (`$nav-height`), 220px expanded, 3rem rows, 2.5rem toggle, hidden below 800px. The
SCSS variables map cleanly onto Tailwind's scale because `$gap: 0.5rem` and `$rounding: 1rem` are
exactly `gap-2` and `rounded-2xl`.

Four deliberate differences, all cheaper than the original:

1. **The width transition moved off the grid.** projectNext animates `grid-template-columns` on the
   page wrapper, reached into from the layout with `:has(.sideBar [data-expanded='true'])`.
   Animating a grid track relayouts the whole grid every frame, and the `:has()` makes the page
   layout depend on a descendant's state. Here the aside is a flex item transitioning its own
   `width` — one element, and the layout never needs to know why.
2. **Labels fade instead of resizing.** projectNext transitions `max-width` on every label, so an
   N-item sidebar runs N layout-driven transitions per toggle. Here labels have static layout and
   are clipped by the aside's `overflow-hidden`; only `opacity` animates, which the compositor
   handles without touching layout.
3. **No tooltip component.** The accessible name is already on the link via `aria-label`, so a
   `title` covers the pointer affordance — one less component and one less DOM subtree per item.
4. **lucide-svelte instead of FontAwesome.** `navDef.ts` keeps projectNext's data-driven shape, but
   an icon is a Svelte component rather than an `IconDefinition` fed through a renderer. Measured
   on the same four icons and the same production build:

   | icons | client JS | gzipped | layout chunk |
   | --- | --- | --- | --- |
   | lucide-svelte | 146,148 B | 48,257 B | 38,384 B |
   | FontAwesome | 214,625 B | 70,110 B | 107,268 B |

   FontAwesome costs **+47% raw, +45% gzipped**, and nearly triples the chunk the sidebar lives in.
   The difference is `@fortawesome/fontawesome-svg-core`: a runtime that ships whether or not you
   use the registry, DOM watching, layers, transforms and masks it exists to provide. A lucide icon
   compiles to a Svelte component with inline SVG and needs no runtime at all.

   Icons are imported per-file rather than from the `lucide-svelte` barrel. The production bundle
   is byte-identical either way - Rollup tree-shakes the barrel cleanly - but the dev server cold
   starts in 476ms instead of 684ms with fewer modules in the graph.

   Note that lucide-svelte 1.x still ships legacy class components, so `NavItem['icon']` is
   `ComponentType<SvelteComponent<IconProps>>` rather than Svelte 5's functional `Component`.

Also added: `aria-expanded` on the toggle, `aria-current="page"` on the active item, and a
`prefers-reduced-motion` block — the sidebar is the only thing in svele that animates.

One structural consequence. projectNext's wrapper is exactly `100dvh` with the content area
scrolling inside it, which is what keeps the toggle on screen. svele originally scrolled the whole
document, which pushed the toggle to the bottom of a long page, so `+layout.svelte` now pins the
shell to `h-dvh` and gives the content column `overflow-y-auto`. Same reason projectNext does it.

The page background gradient comes from `layout.module.scss`:

```
linear-gradient(125deg, color-mix(in srgb, $accent-blue 30%, transparent) 0%,
                        color-mix(in srgb, $surface-base 20%, transparent) 70%), $surface-raised
```

projectNext puts it on `<body>`, which is safe there because the body is always exactly one
viewport tall. It sits on the canvas here with `background-attachment: fixed` so it stays
viewport-sized however long a page gets. svele has no `--surface-raised`; `--bg` is the same role.

## What was ported and what was rewritten

| projectNext | svele | verdict |
| --- | --- | --- |
| `src/services/omegaquotes/{auth,constants,operations,schemas,types}.ts` | same five files, same names | **copy-paste**, only import paths changed |
| `src/lib/paging/*` | `src/lib/paging/*` | **copy-paste**, unchanged logic |
| `src/services/error.ts`, `actionTypes.ts`, `actionError.ts` | same | **copy-paste**, trimmed to the codes in use |
| `src/services/serviceOperation.ts` (~600 lines) | `src/lib/server/serviceOperation.ts` (~236) | **ported**, see below |
| `src/services/omegaquotes/actions.ts` | *does not exist* | **deleted** — see below |
| `makeAction()` + 8 overloads | `makeFormAction` / `makeEndpoint` / `callOperation` | **rewritten**, ~110 lines total |
| `ServerSession.fromNextAuth()` | `hooks.server.ts` → `event.locals.session` | **rewritten**, and better |
| `src/app/omegaquotes/*.tsx` + paging context | `src/routes/+page.svelte` + `OmegaquoteRow.svelte` | **rewritten** |

### The service layer ported clean

`operations.ts` is essentially identical to projectNext's. `defineOperation`, the zod schemas, the
authorizer call, `cursorPageingSelection` — all unchanged. This is the headline result: the 41
service domains in projectNext are **not** Next.js code, and a migration would not have to touch
their business logic.

### `serviceOperation.ts` shrank by ~60%

Kept, because it is the part worth evaluating:

- `defineOperation` with `paramsSchema` / `dataSchema` / `authorizer` / `operation`
- zod validation before the operation body, with `zfd.formData` so a form POST and a typed
  server-side call go through one schema
- `AsyncLocalStorage` context, so a nested operation inherits prisma (and thus a transaction),
  the session and `bypassAuth` from its caller — **this works identically under SvelteKit**
- the `opensTransaction` flag and its type-level consequence for the prisma client
- `internalCall`

Dropped as orthogonal to the question: `defineSubOperation` / `.implement()` /
`implementationParams`, `ownershipCheck`, `beforeRun`, and the authorizer's `prismaWhereFilter`.

### There is no `actions.ts`, and that is the real finding

projectNext has exactly one transport — the React Server Action — so `makeAction()` is one
function, `actions.ts` is one file per domain, and the eight overloads exist to thread
params/data/implementationParams presence through a single call signature.

SvelteKit has two transports, and they are genuinely different things:

- **`makeFormAction`** → a `+page.server.ts` form action. Progressive enhancement for free, works
  with JS off, result arrives as the page's `form` prop.
- **`makeEndpoint`** → a `+server.ts` handler. For client-initiated calls that are not form
  submissions — here, paging in more rows.
- **`callOperation`** → for `load` functions, paired with `unwrapActionReturn`.

All three funnel into the same `safeServerCall`, so the `ActionReturn` contract is byte-identical
and a component branches on `success` the same way. But the transport now lives in the **route
file**, not in the service folder — the route already knows which of params/data it has, so it
passes them explicitly and the overloads evaporate. Compare `src/lib/server/action.ts` (~110 lines,
no overloads) against `src/services/serverAction.ts` (~135 lines, 8 overloads).

Consequence for a real migration: the service folder convention loses `actions.ts` and gains
nothing. That is a simplification, not a loss.

### Sessions get resolved once per request, not once per call

projectNext calls `ServerSession.fromNextAuth()` inside `makeAction`, so every action call in a
request resolves the session again. SvelteKit's `hooks.server.ts` resolves it once and hands it
down via `event.locals`. Strictly better, and it is where `@auth/sveltekit` would plug in.

### Auth seams are stubbed, not removed

`src/lib/server/session.ts` and `src/lib/server/authorizer.ts` keep the
`staticFields → dynamicFields → auth(session)` shape with only `RequireNothing` and a
`RequirePermission` that is ready but unreachable (nothing populates `session.user` yet).
`omegaquotes/auth.ts` still exists and is still referenced by the operations. Adding login means
editing those files and nothing else.

## Verified working

- SSR of page 0 (20 of 25 seeded quotes)
- create via form action — both no-JS POST and `use:enhance` (prepends without reload)
- zod validation failures surfacing through `fail(400)` with the Norwegian messages from the
  ported schema (`"Sitatet kan ikke være tomt"`)
- cursor paging through `/api/quotes` to exhaustion
- `svelte-check`: 0 errors, 0 warnings
- light/dark via `prefers-color-scheme`, both palettes resolving from the same tokens
- sidebar: 64px collapsed / 220px expanded, labels fading 0 -> 1, `aria-expanded` and
  `aria-current` tracking state, toggle staying on screen on a long page, and the content column
  as the only scroller
- **Docker path**: `docker compose up --build` from clean, `npm ci` against the committed lockfile
- **Nix path**: `nix develop` → `npm ci` → `prisma db push` → seed → `npm run dev` (vite ready in
  634ms natively vs 850ms in the container), plus `nix build` producing a server that SSRs 20
  quotes against the containerised Postgres

## Snags hit during the port

Worth knowing before doing this for real:

1. **Prisma 7 requires a driver adapter.** `new PrismaClient()` throws; it needs
   `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`. Same as projectNext does.
2. **`prisma db push --skip-generate` is gone in Prisma 7.** The flag no longer exists.
3. **`sveltekit` comes from `@sveltejs/kit/vite`**, not from `@sveltejs/vite-plugin-svelte`.
4. **`svelte-kit sync` must run before `vite dev`** on a fresh checkout, or `tsconfig.json`'s
   extends target does not exist.
5. **`app.html`'s default wrapper is `display: contents`** — a `body > div` max-width rule silently
   does nothing. Put the page container in `+layout.svelte`.
6. **Dates cross the two transports differently.** `load` serialises with devalue and `Date`
   survives; the JSON endpoint gives an ISO string. `formatTimestamp` accepts both.

## What this does not tell you

No RSC equivalent was exercised, because omegaquotes does not need one. projectNext has 192
`'use client'` files and 111 routes; anywhere it streams a server-rendered component tree into a
client boundary, `+page.server.ts` load functions are a rethink rather than a translation. That is
the next thing to prototype if this experiment goes further — pick a domain that actually leans on
RSC, not one that does not.
