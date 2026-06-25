# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # ESLint
npx drizzle-kit push    # Apply schema changes to Supabase
npx drizzle-kit generate  # Generate migration SQL
node scripts/seed.mjs   # Seed database from hardcoded data
```

No test suite is configured yet.

## Architecture

**Next.js 16 App Router** with **Supabase (PostgreSQL)** as the data store, accessed via **Drizzle ORM**.

### Data flow

All reads and writes go through `src/lib/queries.ts` using Drizzle ORM. The database client is in `src/lib/db.ts` (postgres-js with `prepare: false` for Supabase transaction pool mode).

### Database schema

Defined in `drizzle/schema.ts`. Three tables:

| Table | PK | Business key | Key columns |
|---|---|---|---|
| `brands` | uuid | `code` (BRD001…) | name, manager, annual_budget, description |
| `campaigns` | uuid | `code` (CMP001…) | brand_id (FK), name, start/end_date, planned/actual_budget, status (enum), |
| `milestones` | uuid | `code` (M001…) | campaign_id (FK), name, due_date, manager, completed, notes |

**Computed — not stored:**
- `brands.spent` → `SUM(campaigns.actual_budget)` via LEFT JOIN
- `campaigns.progress` → `COUNT(*) FILTER (WHERE completed) / COUNT(*)` via LEFT JOIN on milestones
- `spentRate`, `budgetRate` → computed in app layer from raw numbers

`campaign_status` is a PostgreSQL enum: `계획중 | 준비중 | 진행중 | 완료 | 취소`

The app layer uses `code` as the entity identifier (URL params, FK references between types). UUID is internal to the DB only.

### Key files

- `drizzle/schema.ts` — table definitions. Always update here first when adding columns.
- `src/lib/queries.ts` — all DB I/O. Read: `getBrands()`, `getBrand(id)`, `getCampaigns(brandId?)`, `getMilestones(campaignIds[])`. Write: `addBrand()`, `updateBrand()`.
- `src/lib/db.ts` — Drizzle client (singleton postgres-js connection).
- `src/types/index.ts` — `Brand`, `Campaign` (+ `CampaignStatus` union), `Milestone` interfaces.
- `src/app/brands/[id]/actions.ts` — `editBrand(id, formData)` — edit actions take the entity ID as first arg, bound via `Function.prototype.bind` before passing to `useActionState`.

### Write patterns

**Create** (insert new row):
```ts
await db.insert(brands).values({ code, name, manager, annualBudget, description })
```

**Update** (update by business code):
```ts
await db.update(brands).set({ name, manager, annualBudget, description }).where(eq(brands.code, id))
```

### Patterns in use

- Pages are **async Server Components** that call `lib/queries.ts` directly.
- Mutations go through **Server Actions** (`'use server'`) in `src/app/[route]/actions.ts`, followed by `revalidatePath()` + `redirect()`.
- Forms use `useActionState` (React 19) + `useFormStatus` for pending state in Client Components. Edit forms pre-populate via `defaultValue` props passed from a Server Component wrapper.
- Server Actions that need extra args (e.g., entity ID) use `.bind(null, id)` before passing to `useActionState` — not hidden form fields.
- Each new entity type follows: add interface to `types/index.ts` → add table to `drizzle/schema.ts` → add read/write fns to `queries.ts` → create route folder with `page.tsx`, `actions.ts`, `loading.tsx`. Detail/edit pages go under `[id]/`.

### Route structure (brands as the reference implementation)

```
/brands              → list page (BrandCard grid)
/brands/new          → create form
/brands/[id]         → detail: brand info + campaigns + milestones
/brands/[id]/edit    → edit form (Server Component wrapper → Client Component form)
```

## Environment variables

Required in `.env.local` (never committed):

```
DATABASE_URL=   # Supabase postgres connection string (transaction pool, port 6543)
```
