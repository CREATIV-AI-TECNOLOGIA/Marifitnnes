CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, password_hash TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL);
CREATE INDEX sessions_expiry ON sessions(expires_at);
CREATE TABLE snapshots (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, data TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1, updated_at INTEGER NOT NULL);
CREATE TABLE imports (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, sha256 TEXT NOT NULL, filename TEXT NOT NULL, page_count INTEGER NOT NULL, draft TEXT, status TEXT NOT NULL CHECK(status IN ('processing','review','confirmed','failed')), created_at INTEGER NOT NULL, UNIQUE(user_id,sha256));
CREATE TABLE limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL DEFAULT 0, expires_at INTEGER NOT NULL);
