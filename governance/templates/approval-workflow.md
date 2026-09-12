# Approval-workflow specification — worked example

Different profiles for different risk, using RxFlow's actual surfaces as the worked example. Participants build their own for whatever the Day 3-4 automation they wire up in Lab 10.

| Profile | Example in this repo | Approval requirement |
|---|---|---|
| **Interactive task** | A developer runs `refund_order` by hand via `ops-mcp-server` during a support call | Structural gate only (amount cap) — no separate human approval beyond the operator's own action, since it's a live, attributable, single action already captured in `audit_log` |
| **Reviewed batch** | The Day 3 CI review gate (`.github/workflows/pr-review.yml`) posting findings on a PR | Findings are advisory-only by design (see the workflow's own comments) — a human must read the PR comment and approve the merge; the job itself has no merge/write permission (`permissions: contents: read, pull-requests: write` only) |
| **Fully unattended job** | Hypothetical: an overnight batch that auto-requeues all `failed` orders | NOT currently implemented in this repo, and should not be built without: (1) a stop condition, (2) independent verification of each requeue's correctness, (3) a rollback trigger, (4) a human-approval gate for anything beyond a pre-approved blast radius — see Day 2, Module 5's loop-design discipline before building this |

## The actual gap in this repo (name it, don't hide it)

`requeue_order` and `refund_order` currently have **no distinction** between an interactive call and a batch/unattended call — the same structural gate (rate limit, amount cap) applies regardless of who or what is calling. A real governance package for this system would need to add a `callerType: 'interactive' | 'batch' | 'unattended'` dimension to `ToolCall` and require stricter approval for non-interactive callers. This is unbuilt — flag it as a known limitation in your Lab 10 deliverable, don't silently assume it's handled.
