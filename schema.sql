PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  login TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  google_sub TEXT UNIQUE,
  password_salt TEXT,
  password_hash TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_login TEXT NOT NULL REFERENCES users(login) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_login);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS favorites (
  user_login TEXT NOT NULL REFERENCES users(login) ON DELETE CASCADE,
  lab_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_login, lab_id)
);

CREATE TABLE IF NOT EXISTS progress (
  user_login TEXT NOT NULL REFERENCES users(login) ON DELETE CASCADE,
  lab_id TEXT NOT NULL,
  completed_at INTEGER NOT NULL,
  PRIMARY KEY (user_login, lab_id)
);

CREATE TABLE IF NOT EXISTS rate_limits (
  id TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL
);
