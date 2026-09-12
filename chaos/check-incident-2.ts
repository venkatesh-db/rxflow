import { getDb } from "@rxflow/shared-db";

const db = getDb();

const rateLimitDenials = db
  .prepare(`SELECT COUNT(*) as n FROM audit_log WHERE tool = 'requeue_order' AND decision = 'denied'`)
  .get() as { n: number };

const totalOrders = db.prepare(`SELECT COUNT(*) as n FROM orders`).get() as { n: number };

const result = {
  rateLimitDenials: rateLimitDenials.n,
  totalOrdersCreated: totalOrders.n,
  correctDiagnosis:
    rateLimitDenials.n > 0 && totalOrders.n === 0
      ? "the real incident is that ZERO orders exist — intake is fail-closed and rejected every attempt while the queue was down. The 5 requeue rate-limit denials are a separate, working-as-designed control on an unrelated retry client — don't mistake that noise for the root cause."
      : "incident did not reproduce as expected",
};

console.log(JSON.stringify(result, null, 2));
