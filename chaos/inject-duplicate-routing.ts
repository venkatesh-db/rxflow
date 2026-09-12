import { getDb } from "@rxflow/shared-db";

// Simulates an at-least-once queue redelivering a "routing" message after a
// worker crash mid-ack — the exact trigger for SEED-005 (lab-router has no
// idempotency check before routing).
const orderId = process.argv[2];
if (!orderId) {
  console.error("usage: tsx inject-duplicate-routing.ts <orderId>");
  process.exit(1);
}

getDb()
  .prepare(`INSERT INTO queue_messages (queue, order_id, payload) VALUES ('routing', ?, ?)`)
  .run(orderId, JSON.stringify({ event: "order_created", redelivered: true }));

console.log(`injected duplicate routing message for order ${orderId}`);
