# Audit design — worked example: `refund_order`

Filled in against the real, running path in `services/ops-mcp-server`. Participants extend this pattern to their own Lab 10 scope in Day 5.

## What a compliance reviewer needs to reconstruct an incident

Not "we log things" — specifically, given one `audit_log` row, can a reviewer answer:

| Question | Answered by |
|---|---|
| Who attempted this? | `actor` |
| What exactly did they try to do? | `tool` + `args_json` |
| Was it allowed or denied? | `decision` |
| Why? | `reason` |
| Which enforcement point decided? | `path` |
| When? | `created_at` |

## Known gap in the current implementation (do not paper over this in the participant deliverable)

SEED-006 (see `seed-manifest.md`): a malformed call can throw inside the gate *before* `writeAudit()` runs, leaving **zero** trace of the attempt. A compliance reviewer reading only `audit_log` would never know the attempt happened. The fix (validate `args` before invoking the gate, write a `denied` row for malformed requests) is a **governance requirement**, not just a code-quality nit — state it that way in your own audit design.

## What "good" looks like for a new control point

1. Every gate write happens on both branches (allowed and denied) — no early return that skips `writeAudit`.
2. `args_json` is validated, not just serialized — a malformed call still produces a row.
3. The `reason` field is specific enough that a reviewer doesn't need to read the code to understand the decision (`"refund exceeds $500 structural cap"`, not `"denied"`).
4. Retention: state explicitly how long `audit_log` rows are kept and where — this repo doesn't implement retention/archival; a real governance package must say so rather than staying silent on it.
