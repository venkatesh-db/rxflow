import { getDb } from "@rxflow/shared-db";

interface Lab {
  id: string;
  name: string;
  capacity: number;
  accepts_lens_types: string;
}

/**
 * SEED-004 (see seed-manifest.md): this handler does not check whether the
 * order has already been routed before processing a "routing" message. On
 * an at-least-once queue, a redelivered message (e.g. after a worker crash
 * mid-ack, as chaos/incident-1.sh triggers) causes the SAME order to be
 * routed to a lab twice. Left in deliberately — this is a Day 4 finding,
 * not a bug to "fix" before the course runs.
 */
function routeOrder(orderId: string): void {
  const db = getDb();
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as
    | { id: string; lens_type: string }
    | undefined;
  if (!order) return;

  const labs = db.prepare("SELECT * FROM labs").all() as Lab[];
  const eligible = labs.filter((l) => JSON.parse(l.accepts_lens_types).includes(order.lens_type));
  if (eligible.length === 0) {
    db.prepare("UPDATE orders SET status = 'blocked' WHERE id = ?").run(orderId);
    return;
  }

  const chosen = eligible[Math.floor(Math.random() * eligible.length)];
  db.prepare("UPDATE orders SET lab_id = ?, status = 'routed' WHERE id = ?").run(chosen.id, orderId);
  db.prepare(`INSERT INTO analytics_events (event_type, order_id, payload) VALUES ('order_routed', ?, ?)`).run(
    orderId,
    JSON.stringify({ labId: chosen.id })
  );
}

function pollOnce(): void {
  const db = getDb();
  const messages = db
    .prepare("SELECT * FROM queue_messages WHERE queue = 'routing' AND status = 'pending' LIMIT 10")
    .all() as { id: number; order_id: string }[];

  for (const msg of messages) {
    db.prepare("UPDATE queue_messages SET status = 'processing', attempt_count = attempt_count + 1 WHERE id = ?").run(
      msg.id
    );
    try {
      routeOrder(msg.order_id);
      db.prepare("UPDATE queue_messages SET status = 'done', processed_at = datetime('now') WHERE id = ?").run(
        msg.id
      );
    } catch (err) {
      console.error(`failed to route order ${msg.order_id}`, err);
      db.prepare("UPDATE queue_messages SET status = 'failed' WHERE id = ?").run(msg.id);
    }
  }
}

const intervalMs = Number(process.env.LAB_ROUTER_POLL_MS ?? 500);
console.log(`lab-router polling every ${intervalMs}ms`);
setInterval(pollOnce, intervalMs);
