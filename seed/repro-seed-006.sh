#!/usr/bin/env bash
# Reproduces SEED-006 (audit-trail-quality gap): a tool call with a missing/malformed
# `args` object is not validated before reaching the gate, so it either crashes the
# process before an audit row is written (worse than the manifest's original
# "serializes as undefined" description) or writes an audit row that can't
# reconstruct what was attempted.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "--- call with args missing entirely ---"
echo '{"actor":"store-1-operator","tool":"refund_order"}' | npx tsx services/ops-mcp-server/src/server.ts || true
