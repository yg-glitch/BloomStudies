-- ============================================================
-- Bloom Studies - Initial Database Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  school text,
  county text,
  year text,
  subjects text[] default '{}',
  education_system text default 'leaving-cert',
  bloom_score integer default 0,
  xp integer default 0,
  level text default 'Seedling',
  streak integer default 0,
  last_streak_date date,
  plan text default 'free',
  stripe_customer_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- CONVERSATIONS (AI Tutor)
-- ============================================================
create table if not exists public.conversations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text,
  subject text,
  education_system text default 'leaving-cert',
  level text default 'higher',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.conversations enable row level security;

create policy "Users can manage own conversations"
  on public.conversations for all using (auth.uid() = user_id);

-- ============================================================
-- MESSAGES
-- ============================================================
create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

create policy "Users can manage own messages"
  on public.messages for all using (auth.uid() = user_id);

-- ============================================================
-- GRADED ANSWERS
-- ============================================================
create table if not exists public.graded_answers (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  subject text not null,
  education_system text not null,
  level text not null,
  question text not null,
  student_answer text not null,
  max_marks integer default 100,
  estimated_grade text,
  estimated_marks integer,
  percentage_score integer,
  bloom_score integer,
  examiner_feedback text,
  strengths text[],
  weaknesses text[],
  areas_to_improve text[],
  suggested_answer text,
  missing_key_points text[],
  scores jsonb,
  created_at timestamptz default now()
);

alter table public.graded_answers enable row level security;

create policy "Users can manage own graded answers"
  on public.graded_answers for all using (auth.uid() = user_id);

-- ============================================================
-- FLASHCARD DECKS
-- ============================================================
create table if not exists public.flashcard_decks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  subject text,
  flashcards jsonb default '[]',
  multiple_choice jsonb default '[]',
  true_false jsonb default '[]',
  fill_in_blanks jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.flashcard_decks enable row level security;

create policy "Users can manage own flashcard decks"
  on public.flashcard_decks for all using (auth.uid() = user_id);

-- ============================================================
-- NOTES
-- ============================================================
create table if not exists public.notes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  subject text,
  content text not null,
  ai_results jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.notes enable row level security;

create policy "Users can manage own notes"
  on public.notes for all using (auth.uid() = user_id);

-- ============================================================
-- PROGRESS
-- ============================================================
create table if not exists public.progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  subject text not null,
  hours_studied numeric default 0,
  lessons_completed integer default 0,
  flashcards_mastered integer default 0,
  average_grade integer,
  last_updated timestamptz default now(),
  unique(user_id, subject)
);

alter table public.progress enable row level security;

create policy "Users can manage own progress"
  on public.progress for all using (auth.uid() = user_id);

-- ============================================================
-- STUDY SESSIONS (Planner)
-- ============================================================
create table if not exists public.study_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  subject text not null,
  topic text,
  session_type text default 'study',
  date date not null,
  start_time time,
  end_time time,
  priority text default 'medium',
  completed boolean default false,
  missed boolean default false,
  duration_minutes integer,
  notes text,
  created_at timestamptz default now()
);

alter table public.study_sessions enable row level security;

create policy "Users can manage own study sessions"
  on public.study_sessions for all using (auth.uid() = user_id);

-- ============================================================
-- AUDIO LESSONS
-- ============================================================
create table if not exists public.audio_lessons (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  subject text,
  script text not null,
  transcript text,
  chapters jsonb default '[]',
  duration integer default 0,
  voice text default 'teacher-irl',
  progress numeric default 0,
  bookmarks integer[] default '{}',
  created_at timestamptz default now()
);

alter table public.audio_lessons enable row level security;

create policy "Users can manage own audio lessons"
  on public.audio_lessons for all using (auth.uid() = user_id);

-- ============================================================
-- INDEXES for performance
-- ============================================================
create index if not exists idx_conversations_user_id on public.conversations(user_id);
create index if not exists idx_messages_conversation_id on public.messages(conversation_id);
create index if not exists idx_graded_answers_user_id on public.graded_answers(user_id);
create index if not exists idx_flashcard_decks_user_id on public.flashcard_decks(user_id);
create index if not exists idx_notes_user_id on public.notes(user_id);
create index if not exists idx_progress_user_id on public.progress(user_id);
create index if not exists idx_study_sessions_user_id on public.study_sessions(user_id);
create index if not exists idx_study_sessions_date on public.study_sessions(date);

-- ============================================================
-- EXAMS (for study planner exam dates)
-- ============================================================
create table if not exists public.exams (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  subject text not null,
  exam_date date not null,
  exam_level text,
  target_grade text,
  created_at timestamptz default now()
);

alter table public.exams enable row level security;
create policy "Users can manage own exams" on public.exams for all using (auth.uid() = user_id);
create index if not exists idx_exams_user_id on public.exams(user_id);

-- ============================================================
-- EXAM GRADES
-- ============================================================
create table if not exists public.exam_grades (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  subject text not null,
  exam_type text,
  grade text,
  percentage integer,
  date date not null,
  created_at timestamptz default now()
);

alter table public.exam_grades enable row level security;
create policy "Users can manage own exam grades" on public.exam_grades for all using (auth.uid() = user_id);

-- ============================================================
-- FLASHCARDS (individual cards, separate from decks)
-- ============================================================
create table if not exists public.flashcards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  deck_id uuid references public.flashcard_decks(id) on delete cascade,
  subject text,
  front text not null,
  back text not null,
  difficulty text default 'medium',
  next_review_date timestamptz,
  review_count integer default 0,
  correct_count integer default 0,
  mastery integer default 0,
  ease_factor numeric default 2.5,
  interval integer default 1,
  folder text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.flashcards enable row level security;
create policy "Users can manage own flashcards" on public.flashcards for all using (auth.uid() = user_id);
create index if not exists idx_flashcards_user_id on public.flashcards(user_id);
create index if not exists idx_flashcards_deck_id on public.flashcards(deck_id);

-- ============================================================
-- AI MEMORY (for personalised tutor responses)
-- ============================================================
create table if not exists public.ai_memory (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  feature text not null,
  context_key text not null,
  context_value jsonb not null,
  importance integer default 5,
  last_accessed timestamptz default now(),
  access_count integer default 0,
  created_at timestamptz default now()
);

alter table public.ai_memory enable row level security;
create policy "Users can manage own AI memory" on public.ai_memory for all using (auth.uid() = user_id);
create index if not exists idx_ai_memory_user_id on public.ai_memory(user_id);
create index if not exists idx_ai_memory_feature on public.ai_memory(user_id, feature);

-- Helper function for incrementing AI memory access count
create or replace function increment_ai_memory_access(memory_id uuid)
returns void language plpgsql as $$
begin
  update public.ai_memory
  set access_count = access_count + 1, last_accessed = now()
  where id = memory_id;
end;
$$;

-- ============================================================
-- SUBSCRIPTIONS (track Stripe subscription status)
-- ============================================================
create table if not exists public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan text default 'free',
  status text default 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subscriptions enable row level security;
create policy "Users can view own subscription" on public.subscriptions for select using (auth.uid() = user_id);
-- Only service role can update subscriptions (via webhook)
create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_subscriptions_stripe_customer on public.subscriptions(stripe_customer_id);

-- ============================================================
-- LEARNING RESOURCES (for Academy page)
-- ============================================================
create table if not exists public.learning_resources (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  type text not null,
  subject text,
  level text,
  category text,
  content text,
  thumbnail_color text,
  duration integer,
  views integer default 0,
  likes integer default 0,
  rating numeric default 0,
  rating_count integer default 0,
  creator_name text,
  creator_avatar text,
  creator_verified boolean default false,
  creator_type text,
  is_free boolean default true,
  is_published boolean default true,
  published_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.learning_resources enable row level security;
-- Anyone can view published resources
create policy "Anyone can view published resources"
  on public.learning_resources for select using (is_published = true);
-- Only creators can manage their resources
create policy "Creators can manage own resources"
  on public.learning_resources for all using (auth.uid() = creator_id);
create index if not exists idx_learning_resources_type on public.learning_resources(type);
create index if not exists idx_learning_resources_category on public.learning_resources(category);
create index if not exists idx_learning_resources_subject on public.learning_resources(subject);

-- ============================================================
-- COMMUNITY POSTS
-- ============================================================
create table if not exists public.community_posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  community text not null,
  type text not null default 'text' check (type in ('text', 'poll', 'link', 'image')),
  title text not null,
  content text,
  link_url text,
  image_url text,
  poll jsonb,
  tags text[] default '{}',
  reactions jsonb default '{"like":0,"helpful":0,"fire":0,"mindblown":0}',
  comments_count integer default 0,
  pinned boolean default false,
  reported boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.community_posts enable row level security;
create policy "Anyone can view posts" on public.community_posts for select using (true);
create policy "Users can create own posts" on public.community_posts for insert with check (auth.uid() = user_id);
create policy "Users can update own posts" on public.community_posts for update using (auth.uid() = user_id);
create policy "Users can delete own posts" on public.community_posts for delete using (auth.uid() = user_id);
create index if not exists idx_community_posts_community on public.community_posts(community);
create index if not exists idx_community_posts_user_id on public.community_posts(user_id);
create index if not exists idx_community_posts_created_at on public.community_posts(created_at desc);

-- ============================================================
-- COMMUNITY COMMENTS
-- ============================================================
create table if not exists public.community_comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.community_posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  parent_id uuid references public.community_comments(id) on delete cascade,
  content text not null,
  reactions jsonb default '{"like":0,"helpful":0,"fire":0,"mindblown":0}',
  pinned boolean default false,
  created_at timestamptz default now()
);

alter table public.community_comments enable row level security;
create policy "Anyone can view comments" on public.community_comments for select using (true);
create policy "Users can create own comments" on public.community_comments for insert with check (auth.uid() = user_id);
create policy "Users can delete own comments" on public.community_comments for delete using (auth.uid() = user_id);
create index if not exists idx_community_comments_post_id on public.community_comments(post_id);

-- ============================================================
-- COMMUNITY REACTIONS (user-specific reactions on posts)
-- ============================================================
create table if not exists public.community_reactions (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.community_posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  reaction text not null check (reaction in ('like','helpful','fire','mindblown')),
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

alter table public.community_reactions enable row level security;
create policy "Users can manage own reactions" on public.community_reactions for all using (auth.uid() = user_id);
create index if not exists idx_community_reactions_post_id on public.community_reactions(post_id);

-- ============================================================
-- COMMUNITY MEMBERSHIPS (joined communities)
-- ============================================================
create table if not exists public.community_memberships (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  community text not null,
  created_at timestamptz default now(),
  unique(user_id, community)
);

alter table public.community_memberships enable row level security;
create policy "Users can manage own memberships" on public.community_memberships for all using (auth.uid() = user_id);

-- ============================================================
-- COMMUNITY BOOKMARKS
-- ============================================================
create table if not exists public.community_bookmarks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.community_posts(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, post_id)
);

alter table public.community_bookmarks enable row level security;
create policy "Users can manage own bookmarks" on public.community_bookmarks for all using (auth.uid() = user_id);

-- Helper: increment/decrement comment count on post
create or replace function increment_comment_count(p_id uuid)
returns void language plpgsql as $$
begin
  update public.community_posts set comments_count = comments_count + 1 where id = p_id;
end;
$$;
