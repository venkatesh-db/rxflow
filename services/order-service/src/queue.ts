import { getDb } from "@rxflow/shared-db";

/** Chaos hook: when true, every enqueue() call throws — used by chaos/incident scripts and Lab 2. */
export function isQueueDown(): boolean {
  return process.env.RXFLOW_QUEUE_DOWN === "1";
}

export function enqueue(queue: "routing" | "analytics", orderId: string, payload: Record<string, unknown>): void {
  if (isQueueDown()) {
    throw new Error(`queue "${queue}" is unavailable`);
  }
  getDb()
    .prepare(`INSERT INTO queue_messages (queue, order_id, payload) VALUES (?, ?, ?)`)
    .run(queue, orderId, JSON.stringify(payload));
}
