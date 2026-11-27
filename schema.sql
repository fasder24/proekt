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

 
-- Cloud Sync: one server-side snapshot per account and privacy-controlled leaderboard.
CREATE TABLE IF NOT EXISTS user_exam_state (
  user_login TEXT PRIMARY KEY REFERENCES users(login) ON DELETE CASCADE,
  state_json TEXT NOT NULL,
  answers_total INTEGER NOT NULL DEFAULT 0,
  correct_total INTEGER NOT NULL DEFAULT 0,
  variants_total INTEGER NOT NULL DEFAULT 0,
  best_points INTEGER NOT NULL DEFAULT 0,
  leaderboard_public INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_user_exam_state_leaderboard
  ON user_exam_state(leaderboard_public,best_points DESC,correct_total DESC);
