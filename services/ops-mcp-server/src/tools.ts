import { getDb } from "@rxflow/shared-db";
import { enforce, type ToolCall } from "./hooks/permission-gate.js";

export function callTool(call: ToolCall): { result: unknown } | { error: string } {
  const decision = enforce(call, "ops-mcp-server/tools.callTool");
  if (!decision.allowed) {
    return { error: decision.reason };
  }

  const db = getDb();
  switch (call.tool) {
    case "lookup_order":
      return { result: db.prepare("SELECT * FROM orders WHERE id = ?").get(call.args.orderId) };

    case "requeue_order":
      db.prepare("UPDATE queue_messages SET status = 'pending' WHERE order_id = ? AND status = 'failed'").run(
        call.args.orderId
      );
      return { result: { requeued: true } };

    case "refund_order":
      // Simulated refund — no real payment integration in this training system.
      return { result: { refunded: call.args.amount, orderId: call.args.orderId } };

    case "relabel_order":
      db.prepare("UPDATE orders SET lens_type = ? WHERE id = ?").run(call.args.lensType, call.args.orderId);
      return { result: { relabeled: true } };

    case "cancel_order":
      db.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?").run(call.args.orderId);
      return { result: { cancelled: true } };

    default:
      return { error: `unknown tool: ${(call as ToolCall).tool}` };
  }
}
