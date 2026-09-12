import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.RXFLOW_DB_PATH ?? path.resolve(__dirname, "../../../rxflow.db");

let db: Database.Database | undefined;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }
  return db;
}

export function runMigrations(): void {
  const schemaPath = path.resolve(__dirname, "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");
  getDb().exec(schema);
}

export interface AuditEntry {
  actor: string;
  tool: string;
  args: Record<string, unknown>;
  decision: "allowed" | "denied";
  reason: string;
  path: string;
}

/** Writes to audit_log on BOTH the allowed and denied branches — never call this only on failure. */
export function writeAudit(entry: AuditEntry): void {
  getDb()
    .prepare(
      `INSERT INTO audit_log (actor, tool, args_json, decision, reason, path) VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(entry.actor, entry.tool, JSON.stringify(entry.args), entry.decision, entry.reason, entry.path);
}
