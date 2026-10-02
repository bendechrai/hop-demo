-- Null means the link never expires. Stored as ISO 8601 UTC, like created_at.
ALTER TABLE links ADD COLUMN expires_at TEXT;
