-- Run this file in Supabase SQL Editor before enabling cloud sync in Saldopilot.
create table if not exists public.user_app_states (
  user_id uuid not null references auth.users(id) on delete cascade,
  state_key text not null default 'default',
  state jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, state_key)
);

alter table public.user_app_states enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_app_states'
      and policyname = 'Users can read their own Saldopilot state'
  ) then
    create policy "Users can read their own Saldopilot state"
      on public.user_app_states
      for select
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_app_states'
      and policyname = 'Users can insert their own Saldopilot state'
  ) then
    create policy "Users can insert their own Saldopilot state"
      on public.user_app_states
      for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_app_states'
      and policyname = 'Users can update their own Saldopilot state'
  ) then
    create policy "Users can update their own Saldopilot state"
      on public.user_app_states
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;
