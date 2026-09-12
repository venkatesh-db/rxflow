# Fail-closed comparison memo (Day 1, Module 2, Lab 2)

Participant deliverable. Compares `services/order-service/src/paths/confirm-order.ts` against `services/analytics-pipeline/src/report.ts`.

## Path A: order confirmation (`confirm-order.ts`)

**One-sentence fail-closed statement** (if you can't write this in one sentence, the control isn't finished):

> If ______________________ fails, the order is _____________ (not confirmed), because _____________.

**What fail-closed costs this path, concretely** (not "less available" in the abstract — name the actual scenario):

## Path B: analytics reporting (`report.ts`)

**Why fail-open is right here:**

**Where the line would move** — name one concrete requirement change that would flip this path to fail-closed (e.g., if this feed became billing-relevant):

## The general rule you're deriving

State the actual decision rule you'd give a client engineer for "when is fail-closed correct," derived from these two paths — not a restatement of "it depends."

## Self-check

- [ ] Both one-sentence fail-closed/fail-open statements are actually one sentence.
- [ ] The availability cost for Path A is a concrete scenario, not "some downtime."
- [ ] The "where the line moves" answer for Path B names a specific trigger, not "if it got more important."
