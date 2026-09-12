import { getDb } from "@rxflow/shared-db";

const orderId = process.argv[2];
if (!orderId) {
  console.error("usage: tsx check-duplicate-routing.ts <orderId>");
  process.exit(1);
}

const events = getDb()
  .prepare(`SELECT COUNT(*) as n FROM analytics_events WHERE event_type = 'order_routed' AND order_id = ?`)
  .get(orderId) as { n: number };

console.log(JSON.stringify({ orderId, order_routed_events: events.n, duplicateConfirmed: events.n > 1 }));
process.exit(events.n > 1 ? 0 : 1);
