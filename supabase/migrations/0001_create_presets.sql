-- User-created presets synced from client localStorage. Built-in (read-only)
-- presets are defined in code and never stored here.
create table if not exists public.presets (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  config jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists presets_user_id_idx on public.presets (user_id);

alter table public.presets enable row level security;

create policy "Users can view their own presets"
  on public.presets for select
  using (auth.uid() = user_id);

create policy "Users can insert their own presets"
  on public.presets for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own presets"
  on public.presets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own presets"
  on public.presets for delete
  using (auth.uid() = user_id);
