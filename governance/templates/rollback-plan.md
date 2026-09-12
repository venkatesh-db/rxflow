# Rollback plan — worked example: the riskiest write path in scope

Riskiest write in this repo: `services/ops-mcp-server` → `refund_order`, because it has real downstream effect (money, simulated here but real in production) and — per SEED-002 — can currently be triggered against the wrong store's order.

## What "undo" actually means here

A refund is not cleanly reversible once simulated/processed — you cannot "un-refund" a patient without a second transaction, which itself needs the same authorization checks as the original (otherwise the rollback path becomes a second exploitable surface). This repo does not implement a reversal tool. State this explicitly rather than assuming `refund_order` is safely undoable.

## Rollback plan for a wrongly-authorized refund (exploiting SEED-002 before it's fixed)

1. **Detect**: query `audit_log` for `tool = 'refund_order'` rows where the `actor`'s known store doesn't match the refunded order's `store_id` (requires joining against `orders` — not automated in this repo).
2. **Contain**: apply the SEED-002 fix (ownership scoping) immediately — this stops new incidents, it does not undo past ones.
3. **Reverse**: for each identified bad refund, a human (not automation) must decide the reversal action — issuing a corrected charge is a business decision with real customer impact, not a code rollback.
4. **Record**: write a new `audit_log` entry for the reversal itself, with `reason` explicitly citing the original bad transaction's row id — so the audit trail shows the correction, not just the original mistake.

## For the order-routing path (SEED-005)

Rollback here is more mechanical: a duplicate-routed order (two `order_routed` analytics events, as `chaos/incident-1.sh` demonstrates) can be corrected by re-running `routeOrder`'s lab assignment deterministically once the idempotency fix is in place, and manually deleting the duplicate `analytics_events` row — but only after confirming which of the two lab assignments the physical lab actually received, since the database and physical reality may already have diverged. State this divergence risk explicitly; it's the actual hard part of this rollback, not the SQL.
