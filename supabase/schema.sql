-- ============================================================================
-- Bloom Studies — Supabase schema
-- ----------------------------------------------------------------------------
-- Run this in the Supabase SQL editor (or via the CLI) after creating a
-- project. It sets up the user profile table plus the core tables Bloom uses
-- to persist study data, all protected by Row Level Security so each user can
-- only ever read/write their own rows.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, auto-created on sign up
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  school text,
  education_system text,            -- 'junior-cycle' | 'leaving-cert'
  level text,                       -- 'higher' | 'ordinary'
  subjects text[] default '{}',
  plan text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
  on public.profiles for select using (auth.uid() = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
  on public.profiles for update using (auth.uid() = id);

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Generic owner-scoped helper for the feature tables below.
-- Each table stores `user_id` and a JSON `data` payload so the app can evolve
-- its shapes without constant migrations during early development.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

do $$
declare t text;
begin
  foreach t in array array[
    'conversations',  -- AI Tutor chats
    'messages',       -- AI Tutor messages
    'flashcard_decks',
    'flashcards',
    'notes',
    'grader_results', -- Exam Grader submissions + results
    'planner_items',
    'progress_events'
  ]
  loop
    execute format($f$
      create table if not exists public.%1$I (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null references auth.users(id) on delete cascade,
        data jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
      alter table public.%1$I enable row level security;

      drop policy if exists "owner_select" on public.%1$I;
      create policy "owner_select" on public.%1$I for select using (auth.uid() = user_id);
      drop policy if exists "owner_insert" on public.%1$I;
      create policy "owner_insert" on public.%1$I for insert with check (auth.uid() = user_id);
      drop policy if exists "owner_update" on public.%1$I;
      create policy "owner_update" on public.%1$I for update using (auth.uid() = user_id);
      drop policy if exists "owner_delete" on public.%1$I;
      create policy "owner_delete" on public.%1$I for delete using (auth.uid() = user_id);

      create index if not exists %1$s_user_id_idx on public.%1$I (user_id);

      drop trigger if exists %1$s_set_updated_at on public.%1$I;
      create trigger %1$s_set_updated_at before update on public.%1$I
        for each row execute function public.set_updated_at();
    $f$, t);
  end loop;
end $$;
