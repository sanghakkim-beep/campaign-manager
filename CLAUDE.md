# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

No test suite is configured yet.

## Architecture

**Next.js 16 App Router** with Google Sheets as the sole data store. There is no database — all persistent data lives in the spreadsheet.

### Data flow

**Reads** use the public CSV export endpoint (no auth required — sheet is link-shared):
```
https://docs.google.com/spreadsheets/d/{ID}/export?format=csv&gid={GID}
```

**Writes** use the Sheets REST API v4 with a service account JWT signed via `node:crypto` (`createSign('RSA-SHA256')`). The `googleapis` npm package is installed but **not used** — it had OpenSSL incompatibility with Node.js v24. Auth is handled manually in `src/lib/sheets.ts`.

### Spreadsheet structure

The spreadsheet has four tabs. Each tab's row 0 is a title, row 1 is headers, data starts at row 2. Filter rows by ID prefix to avoid header rows.

| Tab | GID | ID prefix | Key columns |
|---|---|---|---|
| 대시보드 | 1395724162 | BRD / CMP / M | summary/dashboard only |
| 브랜드 | 1415870910 | BRD | 브랜드코드, 브랜드명, 담당자, 연간예산, 기집행예산, 예산소진율, 브랜드 소개 |
| 캠페인 | 1538415676 | CMP | 캠페인코드, 브랜드코드, 캠페인명, 시작일, 종료일, 계획예산, 실집행예산, 예산집행률, 상태, 진행률 |
| 마일스톤 | 1220187465 | M | 마일스톤ID, 캠페인코드, 마일스톤명, 마감일, 담당자, 완료여부(Y/N), 캠페인명(참조), 비고 |

### Key files

- `src/lib/sheets.ts` — all Sheets I/O. Read functions: `getBrands()`, `getBrand(id)`, `getCampaigns(brandId?)`, `getMilestones(campaignIds[])`. Write functions: `addBrand()` (POST append), `updateBrand()` (PUT to specific row). Auth: `getAccessToken()` via manual JWT.
- `src/types/index.ts` — `Brand`, `Campaign` (+ `CampaignStatus` union), `Milestone` interfaces. Always update here first when adding columns.
- `src/app/brands/[id]/actions.ts` — `editBrand(id, formData)` — edit actions take the entity ID as first arg, bound via `Function.prototype.bind` before passing to `useActionState`.

### Write API patterns

**Create** (append new row):
```
POST /v4/spreadsheets/{ID}/values/{SheetName}!A:G:append?valueInputOption=USER_ENTERED
```

**Update** (overwrite existing row — must find row number first):
```
PUT /v4/spreadsheets/{ID}/values/{SheetName}!A{row}:G{row}?valueInputOption=USER_ENTERED
```
Row number = `physicalIndex + 3` where `physicalIndex` is the 0-based index into `rows.slice(2)` (skipping title and header rows). Sheets API is 1-indexed, so data row 0 → sheet row 3.

### Patterns in use

- Pages are **async Server Components** that call `lib/sheets.ts` directly.
- Mutations go through **Server Actions** (`'use server'`) in `src/app/[route]/actions.ts`, followed by `revalidatePath()` + `redirect()`.
- Forms use `useActionState` (React 19) + `useFormStatus` for pending state in Client Components. Edit forms pre-populate via `defaultValue` props passed from a Server Component wrapper.
- Server Actions that need extra args (e.g., entity ID) use `.bind(null, id)` before passing to `useActionState` — not hidden form fields.
- Each new entity type follows: add interface to `types/index.ts` → add read/write fns to `sheets.ts` → create route folder with `page.tsx`, `actions.ts`, `loading.tsx`. Detail/edit pages go under `[id]/`.

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
GOOGLE_SPREADSHEET_ID=   # spreadsheet ID from the URL
GOOGLE_CLIENT_EMAIL=     # service account email
GOOGLE_PRIVATE_KEY=      # PEM key with literal \n sequences, wrapped in double quotes
```

The service account must have **Editor** access on the spreadsheet for writes. Reads work without credentials via CSV export.
