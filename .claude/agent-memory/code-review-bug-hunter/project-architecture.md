---
name: project-architecture
description: Key architectural facts about the campaign-manager project discovered during first full review
metadata:
  type: project
---

First full code review completed (2026-06-25). Baseline architecture confirmed:

- DB uses UUID PKs internally; `code` field (BRD001, CMP001, M001) is the business key used in URLs and FK joins
- `brands.spent`, `campaigns.progress`, `spentRate`, `budgetRate` are computed — never stored columns
- `campaign_status` PostgreSQL enum: 계획중 | 준비중 | 진행중 | 완료 | 취소
- `src/lib/queries.ts` is the sole DB access layer; all reads/writes go through it
- Edit actions use `.bind(null, id)` pattern — no hidden form fields for IDs
- `params` in App Router pages is a `Promise<{id: string}>` — must be awaited

**Why:** Understanding the UUID-vs-code distinction is critical — wrong field in a `where` clause causes silent misses or wrong data.

**How to apply:** Every WHERE clause review must verify it uses `brands.code` / `campaigns.code` (not `.id`) when filtering by the business key that comes from URL params.

See [[uuid-vs-code-bug-pattern]] for the known fragile pattern.
