#!/usr/bin/env bash
# Day 4 assessment — the UNANNOUNCED variant. Do not show this script or its
# comments to participants before they run it "cold."
#
# Same root-cause CLASS as incident-1 (a symptom masking the real failure)
# but a different shape: a retrying client hammers requeue_order fast enough
# to trip the rate-limit gate (SEED-002's neighbor control, not itself
# buggy) repeatedly, producing a noisy stream of "denied" audit rows right
# as a genuine, unrelated downstream failure (the queue going down) blocks
# real orders. The correct diagnosis separates the rate-limit noise
# (expected, working-as-designed) from the actual incident (queue down,
# real orders stuck in `blocked`) — SEED-009 in seed-manifest.md.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== Incident-2: starting from a clean DB ==="
npm run reset > /dev/null

echo "=== Starting order-service with the queue forced down (the real incident) ==="
RXFLOW_QUEUE_DOWN=1 npm run dev:order-service > /tmp/rxflow-order2.log 2>&1 &
ORDER_PID=$!
trap 'kill '"$ORDER_PID"' 2>/dev/null || true' EXIT
sleep 2

echo "=== A patient's order attempt fails at intake because the queue is down ==="
curl -s -X POST localhost:4001/orders -H 'content-type: application/json' \
  -d '{"patientName":"Retry Storm Patient","lensType":"single-vision","storeId":"store-3"}' || true
echo ""

echo "=== Meanwhile: a misbehaving client retries requeue_order 10x in a burst ==="
for i in $(seq 1 10); do
  echo '{"actor":"retry-client","tool":"requeue_order","args":{"orderId":"nonexistent-order"}}' \
    | npx tsx services/ops-mcp-server/src/server.ts > /dev/null 2>&1
done

echo "=== Symptom check ==="
npx tsx chaos/check-incident-2.ts
