-- RxFlow schema. SQLite stands in for Postgres so the course runs with zero external infra.

CREATE TABLE IF NOT EXISTS labs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  sla_hours INTEGER NOT NULL,
  accepts_lens_types TEXT NOT NULL -- JSON array
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  patient_name TEXT NOT NULL,
  lens_type TEXT NOT NULL,
  store_id TEXT NOT NULL,
  lab_id TEXT REFERENCES labs(id),
  status TEXT NOT NULL DEFAULT 'pending', -- pending -> routed -> confirmed -> fulfilled | blocked | cancelled
  idempotency_key TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  confirmed_at TEXT
);

-- Stands in for a real broker (SQS/Redis). lab-router and analytics-pipeline poll this.
CREATE TABLE IF NOT EXISTS queue_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  queue TEXT NOT NULL,           -- 'routing' | 'analytics'
  order_id TEXT NOT NULL,
  payload TEXT NOT NULL,         -- JSON
  status TEXT NOT NULL DEFAULT 'pending', -- pending -> processing -> done | failed
  attempt_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  processed_at TEXT
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  order_id TEXT,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Written on BOTH the allowed and the blocked path for every gated MCP tool call (Module 4 requirement).
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor TEXT NOT NULL,
  tool TEXT NOT NULL,
  args_json TEXT NOT NULL,
  decision TEXT NOT NULL,   -- 'allowed' | 'denied'
  reason TEXT NOT NULL,
  path TEXT NOT NULL,       -- which enforcement point produced this decision
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
