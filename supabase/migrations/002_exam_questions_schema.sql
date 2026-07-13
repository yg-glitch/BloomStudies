-- ============================================================
-- Bloom Studies - Exam Questions and Topics Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- SUBJECTS (Standardised subject list)
-- ============================================================
create table if not exists public.subjects (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  display_name text not null,
  code text unique, -- e.g., "BIOL", "MATH"
  education_system text check (education_system in ('junior-cycle', 'leaving-cert')) not null,
  levels text[] check (array_position(levels, 'higher') is not null or array_position(levels, 'ordinary') is not null),
  description text,
  icon_color text,
  created_at timestamptz default now()
);

alter table public.subjects enable row level security;
create policy "Anyone can view subjects" on public.subjects for select using (true);

-- ============================================================
-- TOPICS (Subject-specific topics)
-- ============================================================
create table if not exists public.topics (
  id uuid default uuid_generate_v4() primary key,
  subject_id uuid references public.subjects(id) on delete cascade not null,
  name text not null,
  description text,
  parent_topic_id uuid references public.topics(id) on delete cascade,
  order_index integer default 0,
  created_at timestamptz default now(),
  unique(subject_id, name)
);

alter table public.topics enable row level security;
create policy "Anyone can view topics" on public.topics for select using (true);

-- ============================================================
-- EXAM QUESTIONS (Individual exam questions)
-- ============================================================
create table if not exists public.exam_questions (
  id uuid default uuid_generate_v4() primary key,
  subject_id uuid references public.subjects(id) on delete cascade not null,
  past_paper_id uuid references public.past_papers(id) on delete set null,
  question_number integer not null,
  part_number text, -- e.g., "a", "b", "c" for sub-questions
  year integer not null,
  level text check (level in ('Higher', 'Ordinary', 'Common')) not null,
  paper_number integer,
  language text check (language in ('English', 'Irish', 'Both')) default 'English',
  question_text text not null,
  marks_available integer,
  difficulty text check (difficulty in ('easy', 'medium', 'hard')) default 'medium',
  question_type text check (question_type in ('short-answer', 'long-answer', 'essay', 'multiple-choice', 'calculation', 'practical')),
  topics uuid[] default '{}', -- Array of topic IDs
  tags text[] default '{}',
  examiner_notes text,
  common_mistakes text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.exam_questions enable row level security;
create policy "Anyone can view exam questions" on public.exam_questions for select using (true);

-- ============================================================
-- MARKING SCHEMES (Detailed marking schemes per question)
-- ============================================================
create table if not exists public.marking_schemes (
  id uuid default uuid_generate_v4() primary key,
  question_id uuid references public.exam_questions(id) on delete cascade not null,
  marking_points jsonb not null, -- Array of marking points with marks
  total_marks integer not null,
  sample_answer text,
  examiner_feedback text,
  key_points text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.marking_schemes enable row level security;
create policy "Anyone can view marking schemes" on public.marking_schemes for select using (true);

-- ============================================================
-- QUESTION STATISTICS (Usage and performance stats)
-- ============================================================
create table if not exists public.question_statistics (
  id uuid default uuid_generate_v4() primary key,
  question_id uuid references public.exam_questions(id) on delete cascade not null,
  view_count integer default 0,
  attempt_count user_id integer default 0,
  average_score numeric,
  bookmark_count integer default 0,
  last_attempted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.question_statistics enable row level security;
create policy "Anyone can view question statistics" on public.question_statistics for select using (true);

-- ============================================================
-- USER QUESTION PROGRESS (Track user progress per question)
-- ============================================================
create table if not exists public.user_question_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  question_id uuid references public.exam_questions(id) on delete cascade not null,
  status text check (status in ('not-started', 'in-progress', 'completed', 'mastered')) default 'not-started',
  attempts integer default 0,
  best_score integer,
  last_attempted_at timestamptz,
  last_score integer,
  time_spent_seconds integer default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, question_id)
);

alter table public.user_question_progress enable row level security;
create policy "Users can view own question progress" on public.user_question_progress for select using (auth.uid() = user_id);
create policy "Users can create own question progress" on public.user_question_progress for insert with check (auth.uid() = user_id);
create policy "Users can update own question progress" on public.user_question_progress for update using (auth.uid() = user_id);

-- ============================================================
-- QUESTION BOOKMARKS (User bookmarks for questions)
-- ============================================================
create table if not exists public.question_bookmarks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  question_id uuid references public.exam_questions(id) on delete cascade not null,
  notes text,
  created_at timestamptz default now(),
  unique(user_id, question_id)
);

alter table public.question_bookmarks enable row level security;
create policy "Users can view own question bookmarks" on public.question_bookmarks for select using (auth.uid() = user_id);
create policy "Users can create own question bookmarks" on public.question_bookmarks for insert with check (auth.uid() = user_id);
create policy "Users can delete own question bookmarks" on public.question_bookmarks for delete using (auth.uid() = user_id);

-- ============================================================
-- UPDATE PAST PAPERS TABLE (Add missing fields)
-- ============================================================
alter table public.past_papers
  add column if not exists language text check (language in ('English', 'Irish', 'Both')) default 'English',
  add column if not exists audio_url text,
  add column if not exists examiner_report_url text,
  add column if not exists education_system text check (education_system in ('junior-cycle', 'leaving-cert')) default 'leaving-cert';

-- ============================================================
-- INDEXES for performance
-- ============================================================
create index if not exists idx_subjects_education_system on public.subjects(education_system);
create index if not exists idx_topics_subject_id on public.topics(subject_id);
create index if not exists idx_topics_parent_topic_id on public.topics(parent_topic_id);
create index if not exists idx_exam_questions_subject_id on public.exam_questions(subject_id);
create index if not exists idx_exam_questions_past_paper_id on public.exam_questions(past_paper_id);
create index if not exists idx_exam_questions_year on public.exam_questions(year);
create index if not exists idx_exam_questions_level on public.exam_questions(level);
create index if not exists idx_exam_questions_topics on public.exam_questions using gin(topics);
create index if not exists idx_marking_schemes_question_id on public.marking_schemes(question_id);
create index if not exists idx_question_statistics_question_id on public.question_statistics(question_id);
create index if not exists idx_user_question_progress_user_id on public.user_question_progress(user_id);
create index if not exists idx_user_question_progress_question_id on public.user_question_progress(question_id);
create index if not exists idx_user_question_progress_status on public.user_question_progress(status);
create index if not exists idx_question_bookmarks_user_id on public.question_bookmarks(user_id);
create index if not exists idx_question_bookmarks_question_id on public.question_bookmarks(question_id);

-- ============================================================
-- FUNCTION TO UPDATE UPDATED_at TIMESTAMP
-- ============================================================
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_exam_questions_updated_at before update on public.exam_questions
  for each row execute function public.update_updated_at_column();

create trigger update_marking_schemes_updated_at before update on public.marking_schemes
  for each row execute function public.update_updated_at_column();

create trigger update_question_statistics_updated_at before update on public.question_statistics
  for each row execute function public.update_updated_at_column();

create trigger update_user_question_progress_updated_at before update on public.user_question_progress
  for each row execute function public.update_updated_at_column();

-- ============================================================
-- FUNCTION TO INCREMENT VIEW COUNT
-- ============================================================
create or replace function public.increment_question_view_count(question_id uuid)
returns void language plpgsql as $$
begin
  insert into public.question_statistics (question_id, view_count)
  values (question_id, 1)
  on conflict (question_id) do update set
    view_count = question_statistics.view_count + 1,
    updated_at = now();
end;
$$;

-- ============================================================
-- FUNCTION TO INCREMENT BOOKMARK COUNT
-- ============================================================
create or replace function public.increment_question_bookmark_count(question_id uuid, increment boolean)
returns void language plpgsql as $$
begin
  insert into public.question_statistics (question_id, bookmark_count)
  values (question_id, 1)
  on conflict (question_id) do update set
    bookmark_count = question_statistics.bookmark_count + case when increment then 1 else -1 end,
    updated_at = now();
end;
$$;

-- ============================================================
-- SEED DATA (Initial subjects for Irish curriculum)
-- ============================================================
insert into public.subjects (name, display_name, code, education_system, levels, description, icon_color) values
  ('mathematics', 'Mathematics', 'MATH', 'leaving-cert', array['higher', 'ordinary'], 'Mathematical concepts and problem-solving', 'from-violet-500 to-purple-600'),
  ('english', 'English', 'ENG', 'leaving-cert', array['higher', 'ordinary'], 'English language and literature', 'from-blue-500 to-indigo-600'),
  ('irish', 'Irish', 'GAE', 'leaving-cert', array['higher', 'ordinary'], 'Irish language and literature', 'from-emerald-500 to-teal-600'),
  ('physics', 'Physics', 'PHY', 'leaving-cert', array['higher', 'ordinary'], 'Physical science and mechanics', 'from-cyan-500 to-blue-600'),
  ('chemistry', 'Chemistry', 'CHE', 'leaving-cert', array['higher', 'ordinary'], 'Chemical science and reactions', 'from-orange-500 to-red-500'),
  ('biology', 'Biology', 'BIO', 'leaving-cert', array['higher', 'ordinary'], 'Living organisms and ecosystems', 'from-green-500 to-emerald-600'),
  ('history', 'History', 'HIS', 'leaving-cert', array['higher', 'ordinary'], 'Historical events and analysis', 'from-amber-500 to-orange-500'),
  ('geography', 'Geography', 'GEO', 'leaving-cert', array['higher', 'ordinary'], 'Physical and human geography', 'from-teal-500 to-cyan-600'),
  ('business', 'Business', 'BUS', 'leaving-cert', array['higher', 'ordinary'], 'Business studies and management', 'from-fuchsia-500 to-pink-600'),
  ('economics', 'Economics', 'ECO', 'leaving-cert', array['higher', 'ordinary'], 'Economic theory and application', 'from-rose-500 to-pink-600'),
  ('accounting', 'Accounting', 'ACC', 'leaving-cert', array['higher', 'ordinary'], 'Financial accounting and reporting', 'from-slate-500 to-gray-600'),
  ('french', 'French', 'FRE', 'leaving-cert', array['higher', 'ordinary'], 'French language and culture', 'from-indigo-500 to-purple-600'),
  ('german', 'German', 'GER', 'leaving-cert', array['higher', 'ordinary'], 'German language and culture', 'from-yellow-500 to-amber-600'),
  ('spanish', 'Spanish', 'SPA', 'leaving-cert', array['higher', 'ordinary'], 'Spanish language and culture', 'from-red-500 to-orange-600'),
  ('computer-science', 'Computer Science', 'CS', 'leaving-cert', array['higher', 'ordinary'], 'Computer science and programming', 'from-blue-600 to-indigo-700'),
  ('agricultural-science', 'Agricultural Science', 'AGS', 'leaving-cert', array['higher', 'ordinary'], 'Agricultural science and farming', 'from-green-600 to-emerald-700')
on conflict (name) do nothing;
