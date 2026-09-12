---
name: calibration-notes
description: Findings from the Phase 6 technical dry run of RxFlow, before the first real cohort.
metadata:
  type: project
---

# Phase 6 dry run — findings

This was a **technical** dry run (verifying the built substrate actually works, end to end, under the conditions each lab needs) rather than a full timed five-day human run-through with a partner. That full human dry run (solo + one peer for the pairing/adversarial labs, timed per the plan) is still owed before the first real cohort — see "Not yet done" below.

## What was run and verified

- Full order lifecycle: create → route → confirm (fail-closed) → analytics event. ✅
- SEED-002 (refund ownership gap): reproduced live — an unrelated store's operator refunded another store's order. ✅
- SEED-006 (audit-trail gap): reproduced live — confirmed zero new `audit_log` rows after a malformed call, corrected the manifest's original (wrong) hypothesis that it would produce a garbled row instead. ✅
- `chaos/incident-1.sh` (SEED-005 exploit): reproduced reliably — 2 `order_routed` analytics events for one order. ✅
- `chaos/incident-2.sh` (unannounced variant): reproduced reliably after a real bug fix (see below). ✅
- `chaos/reset.sh`: confirmed idempotent, kills leftover processes and restores clean DB. ✅
- `golden-tasks/run-eval.sh`: confirmed prompt extraction and per-task output capture work against an arbitrary command. ✅
- Governance templates: written against real, currently-true file states (not aspirational) — each one names an actual unbuilt gap rather than implying completeness.

## Bugs found and fixed during the dry run (not seeded — genuine gaps)

1. **`order-service`'s `POST /orders` had no top-level try/catch.** Running `chaos/incident-2.sh` (queue forced down) crashed the route and returned Express's default HTML error page instead of structured JSON — undermining the "realistic incident" framing for Day 4. Fixed: wrapped in try/catch, added rollback of the order row on enqueue failure (making intake fail-closed, consistent with confirm-order.ts), returns structured JSON on failure. Re-verified both incident scripts still pass after the fix.
2. **`chaos/incident-2.sh`'s original symptom check was wrong before the fix above existed** — it checked for `status = 'blocked'` orders, but the corrected fail-closed behavior means the order row never gets created at all. Updated the check script and `seed-manifest.md`'s SEED-009 description to match verified reality rather than the original assumption.

**Lesson for future phases**: writing the "expected" behavior into a manifest before the code exists, then not re-verifying after implementation changes, produces exactly this kind of drift. Every seed/incident description in this repo has now been checked against actual runtime output, not just the design intent — reconfirm this on any future edit to the seeded files.

## Not yet done (owed before first real cohort)

- **Full timed five-day human run-through.** Days 1, 2, and 4's labs need a second person (pairing partner, peer for red-teaming, peer for the Day 4 assessment's live coordination) — this dry run only exercised the technical substrate solo.
- ~~Day 3's CI scaffolding, run live~~ **Done.** Pushed to a real GitHub repo (`venkatesh-db/rxflow`, PR #1, closed after verification), confirmed `pr-review.yml` triggers on `pull_request`, runs the placeholder review step, and posts a real comment (`🤖 AI Review (advisory only — does not block merge)`) via `actions/github-script`. Confirmed the job's permissions (`contents: read`, `pull-requests: write`) give it no path to merge or write code — advisory-only is enforced structurally, not just documented. The "AI review" step itself is still the intentional participant-facing placeholder (Lab 7's job to fill in) — only the scaffolding around it was being verified here.
- **Timing calibration for each lab** against the plan's implied budgets — no lab has been run against a clock yet.
- ~~SEED-001 and SEED-007~~ **Done.** A fresh agent with no prior context on this project reviewed both cold. SEED-007 (enforcement-budget: relabel_order vs. requeue_order for a structural slot) matched intent — genuinely close, independently arrived at the same framing. **SEED-001 (lab-routing randomness) was miscalibrated**: as originally written, pure `Math.random()` with an unused `capacity` field read as an oversight, not a considered trade-off — there was no real argument for the "simplicity" side. Fixed by giving that side a genuine, real-world justification (statelessness under concurrent lab-router instances avoids a shared-load-counter's races/staleness or a coordinator's bottleneck/SPOF) — documented directly in `services/lab-router/src/worker.ts` and in the manifest. Re-verify with a second independent read before the first cohort if time allows; one review is not the same as peer-testing with an actual human.

## Versioning

This repo is tagged `v1.0` as of this dry run. Fix issues found in a real cohort run as new seed-manifest entries or explicit corrections between cohorts — do not hand-tune it live during a running cohort.
