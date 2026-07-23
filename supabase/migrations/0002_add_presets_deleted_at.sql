-- Tombstone column for per-record preset sync: deletions are recorded as a
-- deleted_at timestamp rather than a hard delete, so other devices can tell
-- a preset was removed instead of never having seen it.
alter table public.presets add column if not exists deleted_at timestamptz;
