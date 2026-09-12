#!/usr/bin/env bash
# Restores clean state between cohort runs. Kills any leftover RxFlow
# processes from a previous chaos script, wipes the DB, re-migrates and re-seeds.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== Killing any leftover RxFlow service processes ==="
pkill -f "tsx src/server.ts" 2>/dev/null || true
pkill -f "tsx src/worker.ts" 2>/dev/null || true
pkill -f "tsx src/report.ts" 2>/dev/null || true
sleep 1

echo "=== Resetting database ==="
npm run reset

echo "=== Clean. Ready for the next cohort run. ==="
