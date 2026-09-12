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

  // SEED-001 (see seed-manifest.md): uniform random among eligible labs,
  // ignoring `capacity` entirely. This is a genuine, if debatable, choice —
  // NOT an oversight: with multiple lab-router instances running
  // concurrently (this worker is designed to be horizontally scaled), any
  // capacity-aware scheme needs either a shared, consistently-updated load
  // counter (a new source of races and staleness) or centralized
  // coordination (a new bottleneck and single point of failure). Uniform
  // random needs neither and is trivially safe under concurrent workers.
  // The real cost: a chronically overloaded or slow lab gets exactly the
  // same share of orders as an idle one — `capacity` sitting unused on the
  // Lab type is the visible evidence of that cost, not a bug to silently fix.
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
