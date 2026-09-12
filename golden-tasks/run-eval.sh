#!/usr/bin/env bash
# Day 5, Lab 9 — runs every golden task against a given review configuration
# (a Claude CLI invocation, agent config, or command you pass in) and saves
# raw output for manual scoring against each task's referenceOutcome.
#
# Usage:
#   ./golden-tasks/run-eval.sh "claude -p" run-single-agent
#   ./golden-tasks/run-eval.sh "claude -p --agents .claude/agents" run-fanout
#
# Output lands in golden-tasks/results/<config-label>/<task-id>.txt
set -euo pipefail
cd "$(dirname "$0")/.."

CONFIG_CMD="${1:-}"
CONFIG_LABEL="${2:-default}"

if [ -z "$CONFIG_CMD" ]; then
  echo "usage: $0 \"<command to invoke the model, reads prompt on stdin>\" <config-label>"
  exit 1
fi

if ! command -v claude >/dev/null 2>&1; then
  echo "WARNING: 'claude' CLI not found on PATH. This harness shells out to it directly."
  echo "Install/configure the Claude CLI, or point CONFIG_CMD at whatever wraps it, then re-run."
fi

OUT_DIR="golden-tasks/results/$CONFIG_LABEL"
mkdir -p "$OUT_DIR"

for task_file in golden-tasks/tasks/*.yaml; do
  task_id=$(basename "$task_file" .yaml)
  prompt=$(python3 -c "
import sys
lines = open('$task_file').read().split('prompt: >')[1].split('referenceOutcome:')[0]
print(lines.strip())
")
  echo "=== Running $task_id against config '$CONFIG_LABEL' ==="
  echo "$prompt" | eval "$CONFIG_CMD" > "$OUT_DIR/$task_id.txt" 2>&1 || true
  echo "  -> saved to $OUT_DIR/$task_id.txt"
done

echo ""
echo "Done. Score each $OUT_DIR/<task>.txt against the matching golden-tasks/tasks/<task>.yaml's referenceOutcome, by hand or with a scoring pass, then write the comparison to golden-tasks/comparison-report.md."
