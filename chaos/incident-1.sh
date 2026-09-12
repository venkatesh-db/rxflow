#!/usr/bin/env bash
# Day 4, Lab 8 — the announced incident.
#
# Story for participants: "A worker crashed mid-ack on lab-router. The
# routing message was redelivered. Analytics dashboards show a spike in
# order_routed events. Order-service reports look fine. What happened?"
#
# Root cause (do not reveal to participants until after the lab): SEED-005 —
# lab-router has no idempotency check, so the redelivered message causes the
# order to be routed a second time, producing a duplicate analytics event.
# This is the SEED-008 scenario from seed-manifest.md.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== Incident-1: starting from a clean DB ==="
npm run reset > /dev/null

echo "=== Starting order-service and lab-router in the background ==="
npm run dev:order-service > /tmp/rxflow-order.log 2>&1 &
ORDER_PID=$!
npm run dev:lab-router > /tmp/rxflow-router.log 2>&1 &
ROUTER_PID=$!
trap 'kill '"$ORDER_PID"' '"$ROUTER_PID"' 2>/dev/null || true' EXIT
sleep 2

echo "=== Creating one order (normal flow) ==="
ORDER_JSON=$(curl -s -X POST localhost:4001/orders -H 'content-type: application/json' \
  -d '{"patientName":"Incident Test Patient","lensType":"single-vision","storeId":"store-1"}')
ORDER_ID=$(echo "$ORDER_JSON" | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")
echo "order: $ORDER_ID"
sleep 1.5

echo "=== Triggering the fault: injecting a redelivered routing message (SEED-005) ==="
npx tsx chaos/inject-duplicate-routing.ts "$ORDER_ID"
sleep 1.5

echo "=== Symptom check: analytics event count for this order ==="
npx tsx chaos/check-duplicate-routing.ts "$ORDER_ID" && \
  echo "INCIDENT CONFIRMED: order was routed more than once (SEED-005 exploited)." || \
  echo "Incident did not reproduce — investigate before running with a cohort."

echo ""
echo "Participants: build a timeline from analytics_events, queue_messages, and audit_log."
echo "  sqlite3 rxflow.db \"SELECT * FROM analytics_events WHERE order_id='$ORDER_ID';\""
echo "  sqlite3 rxflow.db \"SELECT * FROM queue_messages WHERE order_id='$ORDER_ID';\""
