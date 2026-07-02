-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  school TEXT,
  year TEXT CHECK (year IN ('Junior Cycle 1', 'Junior Cycle 2', 'Junior Cycle 3', '5th Year', '6th Year', 'Other')),
  subjects TEXT[],
  bloom_score INTEGER DEFAULT 0,
  xp INTEGER DEFAULT 0,
  level TEXT DEFAULT 'Seedling' CHECK (level IN ('Seedling', 'Sprout', 'Learner', 'Scholar', 'Expert', 'Master', 'Legend')),
  streak INTEGER DEFAULT 0,
  last_streak_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- AI Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Conversation Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Flashcard Decks
CREATE TABLE IF NOT EXISTS public.flashcard_decks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Flashcards
CREATE TABLE IF NOT EXISTS public.flashcards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  deck_id UUID REFERENCES public.flashcard_decks(id) ON DELETE CASCADE,
  subject TEXT,
  folder TEXT,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  next_review_date TIMESTAMP WITH TIME ZONE,
  review_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  mastery INTEGER DEFAULT 0,
  ease_factor REAL DEFAULT 2.5,
  interval INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Notes
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  subject TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Learning Resources (Academy)
CREATE TABLE IF NOT EXISTS public.learning_resources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('video', 'article', 'notes', 'guide', 'podcast', 'flashcards', 'quiz', 'sample-answer', 'marking-scheme')) NOT NULL,
  subject TEXT NOT NULL,
  level TEXT CHECK (level IN ('higher', 'ordinary', 'all')) DEFAULT 'all',
  category TEXT CHECK (category IN ('leaving-cert', 'junior-cycle', 'study-skills', 'exam-technique', 'cao', 'wellbeing', 'ai-tips')) NOT NULL,
  content TEXT,
  thumbnail_color TEXT,
  duration INTEGER, -- in minutes
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  rating NUMERIC(2,1) DEFAULT 0,
  creator_name TEXT,
  creator_avatar TEXT,
  creator_verified BOOLEAN DEFAULT false,
  creator_type TEXT,
  creator_followers INTEGER DEFAULT 0,
  topics TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Audio Lessons
CREATE TABLE IF NOT EXISTS public.audio_lessons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  duration INTEGER NOT NULL, -- in seconds
  script TEXT NOT NULL,
  transcript TEXT NOT NULL,
  voice TEXT DEFAULT 'teacher-irl',
  bookmarks INTEGER[] DEFAULT '{}',
  progress NUMERIC(3,2) DEFAULT 0, -- 0-1
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- AI Memory (Cross-feature context)
CREATE TABLE IF NOT EXISTS public.ai_memory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  feature TEXT NOT NULL, -- 'tutor', 'grader', 'flashcards', 'audio', etc.
  context_key TEXT NOT NULL, -- e.g., subject, topic, question_id
  context_value JSONB NOT NULL, -- The actual context data
  importance INTEGER DEFAULT 1, -- 1-5, higher = more important
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  access_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Study Planner Sessions
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT,
  date DATE NOT NULL,
  duration_minutes INTEGER,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Exams
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  exam_date DATE NOT NULL,
  exam_level TEXT CHECK (exam_level IN ('Junior Cycle', 'Leaving Cert')),
  target_grade TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Exam Grades
CREATE TABLE IF NOT EXISTS public.exam_grades (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  exam_type TEXT,
  grade TEXT,
  percentage INTEGER,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Past Papers
CREATE TABLE IF NOT EXISTS public.past_papers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subject TEXT NOT NULL,
  year INTEGER NOT NULL,
  level TEXT CHECK (level IN ('Higher', 'Ordinary')),
  paper_number INTEGER,
  pdf_url TEXT,
  marking_scheme_url TEXT,
  duration INTEGER, -- in minutes
  question_count INTEGER,
  topics TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Graded Answers
CREATE TABLE IF NOT EXISTS public.graded_answers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT,
  question TEXT,
  answer TEXT NOT NULL,
  grade TEXT,
  feedback TEXT,
  marking_scheme_points TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Progress Tracking
CREATE TABLE IF NOT EXISTS public.progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  hours_studied INTEGER DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,
  flashcards_mastered INTEGER DEFAULT 0,
  average_grade INTEGER,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, subject)
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan TEXT CHECK (plan IN ('free', 'premium')) DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_user_id ON public.flashcard_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON public.flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_deck_id ON public.flashcards(deck_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON public.flashcards(next_review_date);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON public.study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_exams_user_id ON public.exams(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_grades_user_id ON public.exam_grades(user_id);
CREATE INDEX IF NOT EXISTS idx_graded_answers_user_id ON public.graded_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_id ON public.progress(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_resources_subject ON public.learning_resources(subject);
CREATE INDEX IF NOT EXISTS idx_learning_resources_category ON public.learning_resources(category);
CREATE INDEX IF NOT EXISTS idx_learning_resources_type ON public.learning_resources(type);
CREATE INDEX IF NOT EXISTS idx_audio_lessons_user_id ON public.audio_lessons(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_user_id ON public.ai_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_feature ON public.ai_memory(feature);
CREATE INDEX IF NOT EXISTS idx_ai_memory_context_key ON public.ai_memory(context_key);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.past_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graded_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_memory ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for Conversations
CREATE POLICY "Users can view own conversations" ON public.conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON public.conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations" ON public.conversations FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Messages
CREATE POLICY "Users can view messages in own conversations" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversations WHERE conversations.id = messages.conversation_id AND conversations.user_id = auth.uid())
);
CREATE POLICY "Users can create messages in own conversations" ON public.messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.conversations WHERE conversations.id = messages.conversation_id AND conversations.user_id = auth.uid())
);

-- RLS Policies for Flashcard Decks
CREATE POLICY "Users can view own flashcard decks" ON public.flashcard_decks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own flashcard decks" ON public.flashcard_decks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own flashcard decks" ON public.flashcard_decks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own flashcard decks" ON public.flashcard_decks FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Flashcards
CREATE POLICY "Users can view own flashcards" ON public.flashcards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own flashcards" ON public.flashcards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own flashcards" ON public.flashcards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own flashcards" ON public.flashcards FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Notes
CREATE POLICY "Users can view own notes" ON public.notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own notes" ON public.notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON public.notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON public.notes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Study Sessions
CREATE POLICY "Users can view own study sessions" ON public.study_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own study sessions" ON public.study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own study sessions" ON public.study_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own study sessions" ON public.study_sessions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Exams
CREATE POLICY "Users can view own exams" ON public.exams FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own exams" ON public.exams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exams" ON public.exams FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own exams" ON public.exams FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Exam Grades
CREATE POLICY "Users can view own exam grades" ON public.exam_grades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own exam grades" ON public.exam_grades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exam grades" ON public.exam_grades FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for Past Papers (public read, admin write)
CREATE POLICY "Anyone can view past papers" ON public.past_papers FOR SELECT USING (true);

-- RLS Policies for Graded Answers
CREATE POLICY "Users can view own graded answers" ON public.graded_answers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own graded answers" ON public.graded_answers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for Progress
CREATE POLICY "Users can view own progress" ON public.progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own progress" ON public.progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.progress FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for Subscriptions
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own subscription" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscription" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for Learning Resources (public read, admin write)
CREATE POLICY "Anyone can view learning resources" ON public.learning_resources FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create learning resources" ON public.learning_resources FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update learning resources" ON public.learning_resources FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete learning resources" ON public.learning_resources FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for Audio Lessons
CREATE POLICY "Users can view own audio lessons" ON public.audio_lessons FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own audio lessons" ON public.audio_lessons FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own audio lessons" ON public.audio_lessons FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own audio lessons" ON public.audio_lessons FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for AI Memory
CREATE POLICY "Users can view own ai memory" ON public.ai_memory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own ai memory" ON public.ai_memory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ai memory" ON public.ai_memory FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ai memory" ON public.ai_memory FOR DELETE USING (auth.uid() = user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flashcards_updated_at BEFORE UPDATE ON public.flashcards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
