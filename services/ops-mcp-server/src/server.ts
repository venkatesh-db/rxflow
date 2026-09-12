import readline from "node:readline";
import { callTool } from "./tools.js";
import type { ToolCall } from "./hooks/permission-gate.js";

/**
 * Simplified stand-in for a real MCP stdio server: reads one JSON ToolCall
 * per line from stdin, writes one JSON result per line to stdout. Mirrors
 * the real shape (tool call in, gated result out, audit written on every
 * call) without requiring the full MCP SDK for the course to run.
 */
const rl = readline.createInterface({ input: process.stdin });
console.error("ops-mcp-server ready — send one JSON ToolCall per line");

rl.on("line", (line) => {
  if (!line.trim()) return;
  try {
    const call = JSON.parse(line) as ToolCall;
    const response = callTool(call);
    process.stdout.write(JSON.stringify(response) + "\n");
  } catch (err) {
    process.stdout.write(JSON.stringify({ error: (err as Error).message }) + "\n");
  }
});
