-- Completed session history synced from client localStorage. Append-only:
-- records are immutable once created, so there is no deleted_at/tombstone
-- column here unlike presets.
create table if not exists public.session_history (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  timestamp timestamptz not null,
  config jsonb not null,
  summary jsonb not null
);

create index if not exists session_history_user_id_idx on public.session_history (user_id);

alter table public.session_history enable row level security;

create policy "Users can view their own session history"
  on public.session_history for select
  using (auth.uid() = user_id);

create policy "Users can insert their own session history"
  on public.session_history for insert
  with check (auth.uid() = user_id);
