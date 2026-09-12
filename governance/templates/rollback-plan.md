# Rollback plan — worked example: the riskiest write path in scope

Riskiest write in this repo: `services/ops-mcp-server` → `refund_order`, because it has real downstream effect (money, simulated here but real in production) and — per SEED-002 — can currently be triggered against the wrong store's order.

## What "undo" actually means here

A refund is not cleanly reversible once simulated/processed — and in this repo the reason is stronger than "no reversal tool exists": `refund_order` in `services/ops-mcp-server/src/tools.ts` doesn't persist any monetary state at all (no ledger/orders row is written; only `audit_log` records the attempt via `enforce()`). There is nothing in the database to "undo" — the entire reversal has to happen externally (a real payment system, a human-issued correction), which needs the same authorization checks as the original action. State this precisely: it's not that reversal is hard, it's that this system has no persisted state for reversal to act on.

## Rollback plan for a wrongly-authorized refund (exploiting SEED-002 before it's fixed)

1. **Detect**: query `audit_log` for `tool = 'refund_order'` rows where the `actor`'s known store doesn't match the refunded order's `store_id` (requires joining against `orders` — not automated in this repo).
2. **Contain**: apply the SEED-002 fix (ownership scoping) immediately — this stops new incidents, it does not undo past ones.
3. **Reverse**: for each identified bad refund, a human (not automation) must decide the reversal action — issuing a corrected charge is a business decision with real customer impact, not a code rollback.
4. **Record**: write a new `audit_log` entry for the reversal itself, with `reason` explicitly citing the original bad transaction's row id — so the audit trail shows the correction, not just the original mistake.

## For the order-routing path (SEED-005)

Rollback here is more mechanical, and the repo actually gives you ground truth to start from: `routeOrder` in `services/lab-router/src/worker.ts` writes an `analytics_events` row on every call, so the two `order_routed` events' `created_at` ordering (as `chaos/incident-1.sh` produces) tells you exactly which routing decision happened first and second — reconstruct the timeline from that before touching anything.

**What this repo does NOT let you verify, and shouldn't be assumed as fact from the code alone**: whether the physical lab has already diverged from the database (e.g., one lab began manufacturing before the duplicate was caught). Nothing in this codebase models a physical lab system, a notification, or a webhook — `routeOrder` only ever talks to this repo's own database. Treat "the database and physical reality may have diverged" as a **domain risk you're importing from real-world operations knowledge**, not something you can confirm or deny from `analytics_events` alone — and say so explicitly in your own rollback plan, rather than presenting it as evidenced by the system when it isn't.
