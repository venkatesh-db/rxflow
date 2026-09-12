# RxFlow

Prescription-to-Lens Order and Lab Routing Platform — the reference system for the **FDE Intermediate-to-Advanced** course. All five course days run against this repo.

**Instructors: start with [`docs/facilitator-runbook.md`](docs/facilitator-runbook.md)** — day-by-day timing, what to reveal when, and what NOT to show participants (`seed-manifest.md`, `calibration-notes.md`, and `golden-tasks/tasks/*.yaml`'s reference outcomes).

## Architecture

- **`services/order-service`** — API. Order intake (`POST /orders`) and the **lock-critical, fail-closed** confirm path (`POST /orders/:id/confirm`).
- **`services/lab-router`** — worker. Polls the `routing` queue, assigns a lab. Contains the seeded idempotency gap (SEED-005).
- **`services/analytics-pipeline`** — batch job. Polls the `analytics` queue, **fail-open** by design.
- **`services/ops-mcp-server`** — internal ops tool surface (order lookup, requeue, refund, relabel, cancel), read one-JSON-per-line over stdin as a simplified MCP stand-in. Structural hooks on 3 of 5 tools; see `services/ops-mcp-server/docs/mcp-tool-policy.md`.
- **`packages/shared-db`** — SQLite schema + client shared by all services (stands in for Postgres/a real broker so the course runs with zero external infra).

## Setup

```bash
npm install
npm run reset   # migrates schema + applies seed/apply-seeds.ts (labs + baseline data)
```

## Running services (each in its own terminal)

```bash
npm run dev:order-service     # :4001
npm run dev:lab-router
npm run dev:analytics
```

`ops-mcp-server` is invoked directly, not long-running as a dev server:

```bash
echo '{"actor":"store-1","tool":"lookup_order","args":{"orderId":"..."}}' | npx ts-node --esm -w services/ops-mcp-server src/server.ts
```

## Seeded material

`seed-manifest.md` (instructor-facing, not for participants) lists the 10 planted decisions/defects/scenarios and which day/lab each serves. Do not "fix" any of them outside the manifest's process — they are the course content.

## Chaos scripts (Day 4)

`chaos/` holds the incident-injection scripts and `chaos/reset.sh` to restore clean state between cohort runs. See `docs/architecture.md` for the incident design.

## Status: v1.0 — Phases 0-6 complete

- **Phase 0-1**: architecture + seed manifest (`seed-manifest.md`), all 10 items implemented and individually verified.
- **Phase 2**: Day 1-2 lab templates (`docs/templates/`), SEED-006 reproduced and corrected against actual runtime behavior.
- **Phase 3**: CI review-gate workflow (`.github/workflows/pr-review.yml`) with participant-facing placeholder for Lab 7; 3 of 4 sub-agent configs pre-authored (`.claude/agents/`).
- **Phase 4**: chaos scripts (`chaos/incident-1.sh`, `chaos/incident-2.sh`, `chaos/reset.sh`) — both incidents verified to reproduce reliably.
- **Phase 5**: 5 golden tasks (`golden-tasks/tasks/`), a working eval harness (`golden-tasks/run-eval.sh`), and governance templates filled in against real paths (`governance/templates/`).
- **Phase 6**: technical dry run complete, 2 real bugs found and fixed, findings in `calibration-notes.md`. **Full timed human run-through with a partner is still owed** before the first real cohort — see calibration-notes.md's "Not yet done."
