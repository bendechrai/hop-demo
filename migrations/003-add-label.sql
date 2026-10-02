-- Null means the link has no label. The length and character rules are
-- enforced in the validate-label action, not here.
ALTER TABLE links ADD COLUMN label TEXT;
