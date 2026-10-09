CREATE TABLE google_identities (subject TEXT PRIMARY KEY, user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE);
CREATE TABLE google_challenges (token_hash TEXT PRIMARY KEY, nonce TEXT NOT NULL, user_id TEXT REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL);
