import { getDb } from "@rxflow/shared-db";
import { enqueue } from "../queue.js";

/**
 * LOCK-CRITICAL WRITE PATH — fail-closed by design (Module 2, Lab 2).
 *
 * If the routing message cannot be enqueued, the order confirmation is
 * rolled back and the order is marked `blocked`, not `confirmed`. An order
 * silently confirmed with no routing message means a patient is told their
 * lenses are on the way when no lab has been notified — that failure mode
 * is worse than an order stuck in `pending` a little longer.
 */
export function confirmOrder(orderId: string): { status: string } {
  const db = getDb();
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as
    | { id: string; status: string }
    | undefined;

  if (!order) {
    throw new Error(`order ${orderId} not found`);
  }
  if (order.status !== "routed") {
    throw new Error(`order ${orderId} must be routed before it can be confirmed (was ${order.status})`);
  }

  const tx = db.transaction(() => {
    try {
      enqueue("analytics", orderId, { event: "order_confirmed" });
    } catch (err) {
      // FAIL CLOSED: propagate. The transaction rolls back and the order
      // stays in its prior state rather than being marked confirmed.
      db.prepare("UPDATE orders SET status = 'blocked' WHERE id = ?").run(orderId);
      throw err;
    }
    db.prepare("UPDATE orders SET status = 'confirmed', confirmed_at = datetime('now') WHERE id = ?").run(
      orderId
    );
  });

  tx();
  return { status: "confirmed" };
}
