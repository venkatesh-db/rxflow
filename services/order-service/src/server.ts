import express from "express";
import { randomUUID } from "node:crypto";
import { getDb } from "@rxflow/shared-db";
import { confirmOrder } from "./paths/confirm-order.js";
import { enqueue } from "./queue.js";

const app = express();
app.use(express.json());

app.post("/orders", (req, res) => {
  try {
    const { patientName, lensType, storeId, idempotencyKey } = req.body ?? {};
    if (!patientName || !lensType || !storeId) {
      return res.status(400).json({ error: "patientName, lensType, storeId are required" });
    }

    const db = getDb();
    if (idempotencyKey) {
      const existing = db.prepare("SELECT * FROM orders WHERE idempotency_key = ?").get(idempotencyKey);
      if (existing) return res.status(200).json(existing);
    }

    const id = randomUUID();
    db.prepare(
      `INSERT INTO orders (id, patient_name, lens_type, store_id, idempotency_key) VALUES (?, ?, ?, ?, ?)`
    ).run(id, patientName, lensType, storeId, idempotencyKey ?? null);

    // Intake itself is fail-closed too: if the routing message can't be
    // enqueued, the order row is rolled back rather than left orphaned
    // with no routing message ever sent (chaos/incident-2.sh exercises this).
    try {
      enqueue("routing", id, { event: "order_created" });
    } catch (err) {
      db.prepare("DELETE FROM orders WHERE id = ?").run(id);
      throw err;
    }

    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
    res.status(201).json(order);
  } catch (err) {
    console.error("POST /orders failed", err);
    res.status(503).json({ error: "order intake temporarily unavailable", message: (err as Error).message });
  }
});

app.get("/orders/:id", (req, res) => {
  try {
    const order = getDb().prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id);
    if (!order) return res.status(404).json({ error: "not found" });
    res.json(order);
  } catch (err) {
    console.error("GET /orders/:id failed", err);
    res.status(500).json({ error: "internal error", message: (err as Error).message });
  }
});

app.post("/orders/:id/confirm", (req, res) => {
  try {
    const result = confirmOrder(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(409).json({ error: (err as Error).message });
  }
});

const port = Number(process.env.ORDER_SERVICE_PORT ?? 4001);
app.listen(port, () => console.log(`order-service listening on :${port}`));
