import { getDb } from "@rxflow/shared-db";

/**
 * READ-ONLY, DOWNSTREAM PATH — fail-open by design (Module 2, Lab 2).
 *
 * This is the deliberate counterpart to confirm-order.ts's fail-closed
 * behaviour. A dropped or malformed analytics message means a dashboard is
 * a few minutes stale — nobody's lenses are affected. Blocking the order
 * pipeline on analytics availability would trade a real failure (blocked
 * patients) for a cosmetic one (a stale chart). Errors here are logged and
 * skipped, never re-thrown.
 */
function processMessage(msg: { id: number; order_id: string; payload: string }): void {
  try {
    const payload = JSON.parse(msg.payload);
    getDb()
      .prepare(`INSERT INTO analytics_events (event_type, order_id, payload) VALUES (?, ?, ?)`)
      .run(payload.event ?? "unknown", msg.order_id, msg.payload);
  } catch (err) {
    // FAIL OPEN: log and move on. Never blocks the queue or the order path.
    console.warn(`analytics: dropping malformed message ${msg.id}`, err);
  }
}

function pollOnce(): void {
  const db = getDb();
  const messages = db
    .prepare("SELECT * FROM queue_messages WHERE queue = 'analytics' AND status = 'pending' LIMIT 20")
    .all() as { id: number; order_id: string; payload: string }[];

  for (const msg of messages) {
    processMessage(msg);
    db.prepare("UPDATE queue_messages SET status = 'done', processed_at = datetime('now') WHERE id = ?").run(msg.id);
  }
}

const intervalMs = Number(process.env.ANALYTICS_POLL_MS ?? 1000);
console.log(`analytics-pipeline polling every ${intervalMs}ms`);
setInterval(pollOnce, intervalMs);
