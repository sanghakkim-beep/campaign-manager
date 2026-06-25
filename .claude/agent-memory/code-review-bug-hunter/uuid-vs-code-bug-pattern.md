---
name: uuid-vs-code-bug-pattern
description: Recurring risk — confusing UUID internal PK with the code business key in WHERE clauses and FK joins
metadata:
  type: feedback
---

The project has two identifier types per entity:
- UUID (`brands.id`, `campaigns.id`, `milestones.id`) — internal DB primary key, never exposed in URLs
- `code` (`brands.code`, `campaigns.code`, `milestones.code`) — business key used in URLs and as the app-layer FK reference

**Why:** Several queries in this codebase do cross-table joins where it's easy to accidentally filter by `.id` (UUID) when the incoming URL param is a `code` string. This is a silent bug — the query returns zero rows instead of erroring.

**How to apply:** In every WHERE clause review, confirm that when the filter value originates from a URL param (e.g., `params.id`), it is matched against `.code`, not `.id`. Also confirm JOIN conditions use the UUID FK correctly (e.g., `eq(campaigns.brandId, brands.id)` is correct for the JOIN, but `eq(brands.code, urlParam)` is correct for the filter).

Known fragile files: `src/lib/queries.ts` (all query functions).
