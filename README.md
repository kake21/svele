# svele

**sv**elte × v**ev** — a mini projectNext.

A one-domain SvelteKit port of projectNext, built to answer one question: **does the
ServiceOperation pattern survive outside Next.js?** It ports `omegaquotes` end to end — service
layer, validation, error contract, cursor paging, create form — with no auth.

## Running it

There is no Node on the host, so everything goes through Docker, like projectNext.

```bash
cp .env.default .env      # already done
docker compose up --build
```

Then open <http://localhost:5173>. The database is on host port **5433** so it does not collide
with projectNext's on 5432. First boot runs `prisma db push`, seeds 25 quotes, and starts Vite.

```bash
docker compose exec svele npx svelte-check --tsconfig ./tsconfig.json   # typecheck
docker compose exec db psql -U svele -d svele                           # poke the db
docker compose down -v                                                  # reset everything
```

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
- light/dark via `prefers-color-scheme`

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
