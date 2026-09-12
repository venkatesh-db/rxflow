import { getDb, writeAudit } from "@rxflow/shared-db";

export interface ToolCall {
  actor: string;
  tool: "lookup_order" | "requeue_order" | "refund_order" | "relabel_order" | "cancel_order";
  args: Record<string, unknown>;
}

export type Gate = (call: ToolCall) => { allowed: boolean; reason: string };

/**
 * ENFORCEMENT BUDGET (Module 1, Lab 1): only three tools get a structural,
 * hook-enforced gate below. Everything else in this server is advisory only
 * — stated in docs/mcp-tool-policy.md, not enforced in code. That is a
 * deliberate choice for the lab, not an oversight: relabel_order and
 * lookup_order are left advisory.
 *
 * Structurally enforced: requeue_order (rate limit), cancel_order (reason
 * required), refund_order (amount cap + ownership scoping).
 */
const gates: Partial<Record<ToolCall["tool"], Gate>> = {
  requeue_order: (call) => {
    const db = getDb();
    const recent = db
      .prepare(
        `SELECT COUNT(*) as n FROM audit_log WHERE tool = 'requeue_order' AND actor = ? AND decision = 'allowed' AND created_at > datetime('now', '-1 minutes')`
      )
      .get(call.actor) as { n: number };
    if (recent.n >= 5) {
      return { allowed: false, reason: "rate limit: more than 5 requeues in the last minute" };
    }
    return { allowed: true, reason: "within rate limit" };
  },

  cancel_order: (call) => {
    if (!call.args.reason || String(call.args.reason).trim().length === 0) {
      return { allowed: false, reason: "cancel_order requires a non-empty reason" };
    }
    return { allowed: true, reason: "reason provided" };
  },

  /**
   * SEED-002 (see seed-manifest.md): this gate checks the amount cap but
   * never verifies that `call.actor` actually owns/services the order being
   * refunded — any authenticated actor can refund ANY order, not just ones
   * in their own store. That is the planted gap for Day 2's red-team lab.
   * Do not "fix" this before the course runs.
   */
  refund_order: (call) => {
    const amount = Number(call.args.amount ?? 0);
    if (amount > 500) {
      return { allowed: false, reason: "refund exceeds $500 structural cap" };
    }
    return { allowed: true, reason: "within refund cap" };
  },
};

/** Runs the gate for `call.tool` if one is registered, and writes the audit entry on both branches. */
export function enforce(call: ToolCall, path: string): { allowed: boolean; reason: string } {
  const gate = gates[call.tool];
  const result = gate ? gate(call) : { allowed: true, reason: "advisory only — no structural gate" };

  writeAudit({
    actor: call.actor,
    tool: call.tool,
    args: call.args,
    decision: result.allowed ? "allowed" : "denied",
    reason: result.reason,
    path,
  });

  return result;
}
