# Facilitator runbook — RxFlow / FDE Intermediate-to-Advanced

For the instructor running this course, not participants. Assumes you've read `seed-manifest.md` and `calibration-notes.md` before Day 1 — this runbook tells you *when* to use what's in them, not what's in them.

## Before the cohort arrives (once, not per-day)

1. `git clone` a fresh copy per cohort — never reuse a repo a previous cohort touched (participants may have committed fixes to seeded bugs).
2. `npm install && npm run reset` — confirm it completes with no errors. If it doesn't, fix it *before* Day 1; don't debug infra live in front of a cohort.
3. Confirm participant machines have Node 20+, and `git`/`gh` access if you're running Day 3 against a real GitHub repo (recommended — see Day 3 below) rather than a simulated one.
4. Recruit and brief your Day 1 pairing partner (a "genuinely uncertain client engineer," per Module 3) and whoever plays skeptical-stakeholder/skeptical-architect for the capstone — these are named prerequisites in the syllabus, not optional.
5. Do **not** hand participants `seed-manifest.md`, `calibration-notes.md`, or anything in `golden-tasks/tasks/*.yaml`'s `referenceOutcome` blocks. Those are your answer key.

## Day 1 — Designing and Proving Structural Controls

| Time | Activity | Your move |
|---|---|---|
| Start | Module 1 lecture | — |
| Lab 1 | Participants fill in `docs/templates/enforcement-design-note.md` against `services/ops-mcp-server` | Don't reveal SEED-007's "intended" framing (relabel vs. requeue) — let them arrive at a budget independently. It's fine if theirs differs from the shipped one; SEED-007 is a genuine toss-up (independently confirmed — see `calibration-notes.md`), so a different answer isn't wrong. |
| — | Module 2 lecture | — |
| Lab 2 | `docs/templates/fail-closed-comparison-memo.md` against `confirm-order.ts` / `report.ts` | If a participant argues confirm-order.ts *should* be fail-open, don't just correct them — ask what patient-facing consequence they're accepting. That's the actual skill (Module 2), not memorizing the "right" answer. |
| — | Module 3 lecture + Lab 3 (pairing) | Your briefed partner plays uncertain-but-not-hostile. Watch specifically for the participant narrating judgment vs. silently taking the keyboard — that's the pairing-note's actual content. |
| End | Day 1 assessment: peer trade of enforcement-design notes | You don't grade this directly — the value is in what each pair finds in the other's note. Spot-check afterward that real gaps were found, not rubber-stamped. |

## Day 2 — Red-Teaming and the Verification Loop

| Time | Activity | Your move |
|---|---|---|
| Lab 4 | Red-team their own Day 1 control design | If someone can't find a gap, don't hint at SEED-002 directly — ask "did you check `refund_order` specifically, and who's allowed to call it against whose order?" Let them find it. |
| — | Run `seed/repro-seed-006.sh` live if the audit-trail-quality angle hasn't come up naturally by mid-lab | This reliably surfaces the "zero rows written on a malformed call" finding — don't skip straight to explaining it. |
| Lab 5 | Design the 40-file migration loop, on paper, before any code | This lab doesn't touch RxFlow's code at all — it's a design exercise. Resist the urge to let participants start implementing; the point is the paper design surviving a peer's unconsidered scenario. |
| End | Day 2 assessment: design review against an unconsidered scenario | Prep 2-3 curveball scenarios per group in advance (e.g., "what if the migration script itself has a bug in file 23 of 40?") — don't improvise these cold. |

## Day 3 — Sub-Agents, Parallel Review, Headless CI

| Time | Activity | Your move |
|---|---|---|
| Lab 6 | Parallel review using `.claude/agents/repository-analyst.md`, `control-reviewer.md`, `security-reviewer.md` | Participants write `evidence-auditor.md` themselves (deliberately not shipped — see `.claude/agents/README.md`). The parent-agent consolidation is the graded skill — watch for someone just concatenating all four outputs instead of actually adjudicating conflicts. |
| Lab 7 | Fill in `.github/workflows/pr-review.yml`'s placeholder step with a real headless review | **Push each participant's fork to a real GitHub repo before this lab** — this was verified live (see `calibration-notes.md`): the workflow scaffolding (trigger, permissions, comment-posting) works correctly against a genuine PR. Don't run this against a simulated/local-only setup; "pasted output required" in the lab spec means real GitHub Actions output, not a description of expected behavior. |
| End | Day 3 assessment: live CI run against a real PR, checked against a planted issue | Plant a *fresh* issue for this assessment, not one of the 10 in `seed-manifest.md` — those are now public knowledge to this cohort after Days 1-2. |

## Day 4 — Multi-Agent Incident Response

| Time | Activity | Your move |
|---|---|---|
| Setup | `./chaos/reset.sh` before Lab 8 | Confirms clean state — do this in front of the room or just before, not hours ahead (a stale DB from testing invalidates the lab). |
| Lab 8 | Run `./chaos/incident-1.sh` | This is the **announced** incident — tell participants an incident is coming, but not what it is. Time from script-launch to their consolidated timeline; this is your Lab 8 baseline for the Day 4 assessment's ≥25% reduction target. |
| End | Day 4 assessment: `./chaos/incident-2.sh`, unannounced | Do not preview this script's comments or `check-incident-2.ts`'s scoring logic to participants beforehand — the whole point is it's a different-shaped symptom (rate-limit noise masking a real fail-closed outage) from Lab 8's. Time it against the Lab 8 baseline. |

## Day 5 — Golden Tasks, Governance, Capstone

| Time | Activity | Your move |
|---|---|---|
| Lab 9 | Build and run a 5-task golden set | `golden-tasks/tasks/*.yaml` are a *reference* set drawn from this cohort's own Days 1-4 findings — encourage participants to write their own tasks 6-10 from things they personally found, not just reuse the shipped 5 verbatim. Use `golden-tasks/run-eval.sh` to run two configs (e.g. single-agent vs. Lab 6's fan-out) and compare. |
| Lab 10 | Governance package | `governance/templates/*.md` are **worked examples against `refund_order`**, not blank templates — each one names a real, currently-unbuilt gap (e.g., approval-workflow.md's missing `callerType` distinction). Participants should extend this pattern to their own Day 3-4 automation, not just copy the refund example verbatim. |
| Full day | Capstone (Module 11) | Needs your stakeholder-role person and skeptical-architect-role person, briefed per the syllabus's mid-session scope-change requirement. Both reviewers score go/conditional-go/not-yet-go independently — don't let them confer before recording their verdicts. |

## After the cohort — what to do with the repo

- **Do not reuse this exact repo state for the next cohort.** Any fixes participants committed to seeded bugs are now baked in; `git checkout` back to the `v1.0` tag (or whatever tag you're running) and reclone fresh.
- If a cohort found a genuine calibration problem (a seed that didn't reproduce, a lab that ran drastically over/under time), add it to `calibration-notes.md` **before** the next cohort, the same way SEED-001's miscalibration was caught and fixed here — don't just remember it informally.
- Golden tasks 6-10 that a cohort wrote themselves in Lab 9 are worth reviewing and folding into the shipped set if they're good — that's explicitly the "living artefact" idea from Module 9.
