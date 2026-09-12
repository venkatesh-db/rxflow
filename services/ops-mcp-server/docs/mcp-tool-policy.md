# ops-mcp-server tool policy

Five tools are exposed. Only three are structurally enforced (hook-gated in `src/hooks/permission-gate.ts`) — the rest are advisory only, stated here and nowhere else. This split is the deliberate output of Day 1, Module 1's enforcement-budget exercise: you cannot structurally enforce everything, so pick the points where a violation is expensive and irreversible.

| Tool | Structural (hook-enforced) | Advisory only |
|------|----|----|
| `lookup_order` | — | Read-only; no gate. Anyone with server access can look up any order. |
| `requeue_order` | Rate limit: 5/minute per actor | — |
| `refund_order` | $500 amount cap | — (ownership scoping is *intended* to be structural — see SEED-002 in `seed-manifest.md`) |
| `relabel_order` | — | Docs say: don't relabel a `confirmed` order. Nothing in code stops it. |
| `cancel_order` | Requires non-empty `reason` | — |

Every call — allowed or denied, structural or advisory — is written to `audit_log` via `writeAudit()`. Advisory-only tools still get an audit row (`decision: 'allowed'`, `reason: 'advisory only — no structural gate'`); that's what lets you reconstruct, months later, that a rule existed but wasn't enforced in code.
