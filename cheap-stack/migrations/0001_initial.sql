CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY,
  client_key TEXT NOT NULL,
  business_name TEXT NOT NULL DEFAULT '',
  business_description TEXT NOT NULL DEFAULT '',
  people TEXT NOT NULL DEFAULT '',
  years TEXT NOT NULL DEFAULT '',
  goal TEXT NOT NULL DEFAULT '',
  concern TEXT NOT NULL DEFAULT '',
  state_json TEXT NOT NULL DEFAULT '{}',
  messages_json TEXT NOT NULL DEFAULT '[]',
  feedback_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cases_client_key ON cases(client_key);