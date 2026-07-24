# History sync: append-only merge by id

When logged in, completed session history syncs to and from a Supabase `session_history` table (one row per record, `auth.uid() = user_id` RLS), wrapping the existing `historyStorage.ts` localStorage module the same way [ADR-0005](0005-preset-sync.md) wraps preset storage — local reads/writes behave exactly as before, and a sync layer (`historySync.ts`) pushes and pulls on top.

Each `SessionHistoryRecord` now carries a client-generated `id` (`crypto.randomUUID()`), created the moment a session finishes, alongside the existing `timestamp`/`config`/`summary` fields. Records persisted before this change lack an id; `historyStorage.loadHistory` backfills one onto any such record and persists the backfill, so pre-existing local history can still sync.

Conflict resolution is deliberately simpler than presets: history is append-only and a record is immutable once created, so there is never a competing edit to resolve, only presence-or-absence. On login (and whenever a pull runs), `mergeHistory` fetches the full remote record set and de-dupes against local state purely by `id` — a record either exists on both sides already, or it's added to the merged list from whichever side has it. There is no `updated_at`/tombstone column and no delete path; the table has only `select`/`insert` RLS policies. Any local record the remote doesn't have — including a device's entire pre-existing history on first login against an empty cloud account — is pushed back up individually via `pushHistoryRecord`, which is how the one-time seed-upload requirement falls out of the same merge used for every other pull.

New records push immediately: `useSessionHistory.recordSession` appends locally (unchanged behavior) and, while authenticated, upserts the single new record remotely.

This further qualifies [ADR-0002](0002-localstorage-only-persistence.md): session history is no longer local-only when a user is logged in, mirroring the presets qualification. Logged-out behavior, and behavior when Supabase isn't configured for the build, are unchanged — sync is skipped entirely and everything stays local as before.
