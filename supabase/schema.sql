<<<<<<< HEAD
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

-- Community Posts
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  community TEXT NOT NULL,
  type TEXT CHECK (type IN ('text', 'poll', 'link', 'image')) DEFAULT 'text',
  title TEXT NOT NULL,
  content TEXT,
  link_url TEXT,
  image_url TEXT,
  poll JSONB,
  tags TEXT[],
  reactions JSONB DEFAULT '{"like": 0, "helpful": 0, "fire": 0, "mindblown": 0}'::jsonb,
  user_reaction TEXT,
  comments_count INTEGER DEFAULT 0,
  bookmarked BOOLEAN DEFAULT FALSE,
  pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Community Comments
CREATE TABLE IF NOT EXISTS public.community_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.community_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  reactions JSONB DEFAULT '{"like": 0, "helpful": 0, "fire": 0, "mindblown": 0}'::jsonb,
  pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Community Reactions (separate table for tracking user reactions)
CREATE TABLE IF NOT EXISTS public.community_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.community_comments(id) ON DELETE CASCADE,
  reaction_type TEXT CHECK (reaction_type IN ('like', 'helpful', 'fire', 'mindblown')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, comment_id)
);

-- Community Bookmarks
CREATE TABLE IF NOT EXISTS public.community_bookmarks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, post_id)
);

-- Community Joined Communities
CREATE TABLE IF NOT EXISTS public.community_joined (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  community TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, community)
);

-- Community Reported Posts
CREATE TABLE IF NOT EXISTS public.community_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  reason TEXT,
  status TEXT CHECK (status IN ('pending', 'reviewed', 'dismissed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Graded Answers (updated to match new structure)
CREATE TABLE IF NOT EXISTS public.graded_answers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT,
  question TEXT,
  student_answer TEXT NOT NULL,
  result JSONB,
  education_system TEXT,
  level TEXT,
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
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_community ON public.community_posts(community);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON public.community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_user_id ON public.community_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_community_reactions_user_id ON public.community_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_community_reactions_post_id ON public.community_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_community_bookmarks_user_id ON public.community_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_community_joined_user_id ON public.community_joined(user_id);
CREATE INDEX IF NOT EXISTS idx_community_reports_user_id ON public.community_reports(user_id);

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
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_joined ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;

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

-- RLS Policies for Community Posts
CREATE POLICY "Users can view community posts" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "Users can create own community posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own community posts" ON public.community_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own community posts" ON public.community_posts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Community Comments
CREATE POLICY "Users can view community comments" ON public.community_comments FOR SELECT USING (true);
CREATE POLICY "Users can create own community comments" ON public.community_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own community comments" ON public.community_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own community comments" ON public.community_comments FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Community Reactions
CREATE POLICY "Users can view community reactions" ON public.community_reactions FOR SELECT USING (true);
CREATE POLICY "Users can create own community reactions" ON public.community_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own community reactions" ON public.community_reactions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Community Bookmarks
CREATE POLICY "Users can view own community bookmarks" ON public.community_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own community bookmarks" ON public.community_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own community bookmarks" ON public.community_bookmarks FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Community Joined
CREATE POLICY "Users can view own community joined" ON public.community_joined FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own community joined" ON public.community_joined FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own community joined" ON public.community_joined FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Community Reports
CREATE POLICY "Users can view own community reports" ON public.community_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own community reports" ON public.community_reports FOR INSERT WITH CHECK (auth.uid() = user_id);

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
=======
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
- -   M i g r a t i o n :   A d d   C o m m u n i t y   T a b l e s  
 - -   R u n   t h i s   i n   y o u r   S u p a b a s e   S Q L   e d i t o r   a f t e r   t h e   i n i t i a l   s c h e m a  
  
 - -   C o m m u n i t y   P o s t s  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . c o m m u n i t y _ p o s t s   (  
     i d   U U I D   D E F A U L T   u u i d _ g e n e r a t e _ v 4 ( )   P R I M A R Y   K E Y ,  
     a u t h o r _ i d   U U I D   R E F E R E N C E S   p u b l i c . p r o f i l e s ( i d )   O N   D E L E T E   C A S C A D E   N O T   N U L L ,  
     c o m m u n i t y   T E X T   N O T   N U L L ,  
     t y p e   T E X T   C H E C K   ( t y p e   I N   ( ' t e x t ' ,   ' i m a g e ' ,   ' p d f ' ,   ' p o l l ' ,   ' l i n k ' ,   ' f l a s h c a r d ' ,   ' q u i z ' ,   ' a c h i e v e m e n t ' ) )   N O T   N U L L   D E F A U L T   ' t e x t ' ,  
     t i t l e   T E X T   N O T   N U L L ,  
     c o n t e n t   T E X T   N O T   N U L L   D E F A U L T   ' ' ,  
     i m a g e _ u r l   T E X T ,  
     p d f _ u r l   T E X T ,  
     l i n k _ u r l   T E X T ,  
     l i n k _ p r e v i e w   T E X T ,  
     p o l l _ d a t a   J S O N B ,  
     t a g s   T E X T [ ]   D E F A U L T   ' { } ' ,  
     r e a c t i o n _ l i k e   I N T E G E R   D E F A U L T   0 ,  
     r e a c t i o n _ h e l p f u l   I N T E G E R   D E F A U L T   0 ,  
     r e a c t i o n _ f i r e   I N T E G E R   D E F A U L T   0 ,  
     r e a c t i o n _ m i n d b l o w n   I N T E G E R   D E F A U L T   0 ,  
     c o m m e n t s _ c o u n t   I N T E G E R   D E F A U L T   0 ,  
     p i n n e d   B O O L E A N   D E F A U L T   F A L S E ,  
     a i _ s u m m a r y   T E X T ,  
     c r e a t e d _ a t   T I M E S T A M P   W I T H   T I M E   Z O N E   D E F A U L T   t i m e z o n e ( ' u t c ' : : t e x t ,   n o w ( ) )   N O T   N U L L ,  
     u p d a t e d _ a t   T I M E S T A M P   W I T H   T I M E   Z O N E   D E F A U L T   t i m e z o n e ( ' u t c ' : : t e x t ,   n o w ( ) )   N O T   N U L L  
 ) ;  
  
 - -   C o m m u n i t y   C o m m e n t s  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . c o m m u n i t y _ c o m m e n t s   (  
     i d   U U I D   D E F A U L T   u u i d _ g e n e r a t e _ v 4 ( )   P R I M A R Y   K E Y ,  
     p o s t _ i d   U U I D   R E F E R E N C E S   p u b l i c . c o m m u n i t y _ p o s t s ( i d )   O N   D E L E T E   C A S C A D E   N O T   N U L L ,  
     a u t h o r _ i d   U U I D   R E F E R E N C E S   p u b l i c . p r o f i l e s ( i d )   O N   D E L E T E   C A S C A D E   N O T   N U L L ,  
     p a r e n t _ i d   U U I D   R E F E R E N C E S   p u b l i c . c o m m u n i t y _ c o m m e n t s ( i d )   O N   D E L E T E   C A S C A D E ,  
     c o n t e n t   T E X T   N O T   N U L L ,  
     r e a c t i o n _ l i k e   I N T E G E R   D E F A U L T   0 ,  
     r e a c t i o n _ h e l p f u l   I N T E G E R   D E F A U L T   0 ,  
     r e a c t i o n _ f i r e   I N T E G E R   D E F A U L T   0 ,  
     r e a c t i o n _ m i n d b l o w n   I N T E G E R   D E F A U L T   0 ,  
     p i n n e d   B O O L E A N   D E F A U L T   F A L S E ,  
     c r e a t e d _ a t   T I M E S T A M P   W I T H   T I M E   Z O N E   D E F A U L T   t i m e z o n e ( ' u t c ' : : t e x t ,   n o w ( ) )   N O T   N U L L  
 ) ;  
  
 - -   C o m m u n i t y   R e a c t i o n s   ( p e r - u s e r   t r a c k i n g )  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . c o m m u n i t y _ r e a c t i o n s   (  
     i d   U U I D   D E F A U L T   u u i d _ g e n e r a t e _ v 4 ( )   P R I M A R Y   K E Y ,  
     u s e r _ i d   U U I D   R E F E R E N C E S   p u b l i c . p r o f i l e s ( i d )   O N   D E L E T E   C A S C A D E   N O T   N U L L ,  
     t a r g e t _ t y p e   T E X T   C H E C K   ( t a r g e t _ t y p e   I N   ( ' p o s t ' ,   ' c o m m e n t ' ) )   N O T   N U L L ,  
     t a r g e t _ i d   U U I D   N O T   N U L L ,  
     r e a c t i o n   T E X T   C H E C K   ( r e a c t i o n   I N   ( ' l i k e ' ,   ' h e l p f u l ' ,   ' f i r e ' ,   ' m i n d b l o w n ' ) )   N O T   N U L L ,  
     c r e a t e d _ a t   T I M E S T A M P   W I T H   T I M E   Z O N E   D E F A U L T   t i m e z o n e ( ' u t c ' : : t e x t ,   n o w ( ) )   N O T   N U L L ,  
     U N I Q U E ( u s e r _ i d ,   t a r g e t _ t y p e ,   t a r g e t _ i d )  
 ) ;  
  
 - -   C o m m u n i t y   B o o k m a r k s  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . c o m m u n i t y _ b o o k m a r k s   (  
     i d   U U I D   D E F A U L T   u u i d _ g e n e r a t e _ v 4 ( )   P R I M A R Y   K E Y ,  
     u s e r _ i d   U U I D   R E F E R E N C E S   p u b l i c . p r o f i l e s ( i d )   O N   D E L E T E   C A S C A D E   N O T   N U L L ,  
     p o s t _ i d   U U I D   R E F E R E N C E S   p u b l i c . c o m m u n i t y _ p o s t s ( i d )   O N   D E L E T E   C A S C A D E   N O T   N U L L ,  
     c r e a t e d _ a t   T I M E S T A M P   W I T H   T I M E   Z O N E   D E F A U L T   t i m e z o n e ( ' u t c ' : : t e x t ,   n o w ( ) )   N O T   N U L L ,  
     U N I Q U E ( u s e r _ i d ,   p o s t _ i d )  
 ) ;  
  
 - -   I n d e x e s  
 C R E A T E   I N D E X   I F   N O T   E X I S T S   i d x _ c o m m u n i t y _ p o s t s _ a u t h o r   O N   p u b l i c . c o m m u n i t y _ p o s t s ( a u t h o r _ i d ) ;  
 C R E A T E   I N D E X   I F   N O T   E X I S T S   i d x _ c o m m u n i t y _ p o s t s _ c o m m u n i t y   O N   p u b l i c . c o m m u n i t y _ p o s t s ( c o m m u n i t y ) ;  
 C R E A T E   I N D E X   I F   N O T   E X I S T S   i d x _ c o m m u n i t y _ p o s t s _ c r e a t e d   O N   p u b l i c . c o m m u n i t y _ p o s t s ( c r e a t e d _ a t   D E S C ) ;  
 C R E A T E   I N D E X   I F   N O T   E X I S T S   i d x _ c o m m u n i t y _ c o m m e n t s _ p o s t   O N   p u b l i c . c o m m u n i t y _ c o m m e n t s ( p o s t _ i d ) ;  
 C R E A T E   I N D E X   I F   N O T   E X I S T S   i d x _ c o m m u n i t y _ c o m m e n t s _ a u t h o r   O N   p u b l i c . c o m m u n i t y _ c o m m e n t s ( a u t h o r _ i d ) ;  
 C R E A T E   I N D E X   I F   N O T   E X I S T S   i d x _ c o m m u n i t y _ r e a c t i o n s _ u s e r   O N   p u b l i c . c o m m u n i t y _ r e a c t i o n s ( u s e r _ i d ) ;  
 C R E A T E   I N D E X   I F   N O T   E X I S T S   i d x _ c o m m u n i t y _ r e a c t i o n s _ t a r g e t   O N   p u b l i c . c o m m u n i t y _ r e a c t i o n s ( t a r g e t _ t y p e ,   t a r g e t _ i d ) ;  
 C R E A T E   I N D E X   I F   N O T   E X I S T S   i d x _ c o m m u n i t y _ b o o k m a r k s _ u s e r   O N   p u b l i c . c o m m u n i t y _ b o o k m a r k s ( u s e r _ i d ) ;  
  
 - -   E n a b l e   R L S  
 A L T E R   T A B L E   p u b l i c . c o m m u n i t y _ p o s t s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 A L T E R   T A B L E   p u b l i c . c o m m u n i t y _ c o m m e n t s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 A L T E R   T A B L E   p u b l i c . c o m m u n i t y _ r e a c t i o n s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 A L T E R   T A B L E   p u b l i c . c o m m u n i t y _ b o o k m a r k s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
  
 - -   R L S :   C o m m u n i t y   P o s t s  
 C R E A T E   P O L I C Y   " A n y o n e   c a n   v i e w   c o m m u n i t y   p o s t s "   O N   p u b l i c . c o m m u n i t y _ p o s t s   F O R   S E L E C T   U S I N G   ( t r u e ) ;  
 C R E A T E   P O L I C Y   " A u t h e n t i c a t e d   u s e r s   c a n   c r e a t e   p o s t s "   O N   p u b l i c . c o m m u n i t y _ p o s t s   F O R   I N S E R T   W I T H   C H E C K   ( a u t h . u i d ( )   =   a u t h o r _ i d ) ;  
 C R E A T E   P O L I C Y   " A u t h o r s   c a n   u p d a t e   o w n   p o s t s "   O N   p u b l i c . c o m m u n i t y _ p o s t s   F O R   U P D A T E   U S I N G   ( a u t h . u i d ( )   =   a u t h o r _ i d ) ;  
 C R E A T E   P O L I C Y   " A u t h o r s   c a n   d e l e t e   o w n   p o s t s "   O N   p u b l i c . c o m m u n i t y _ p o s t s   F O R   D E L E T E   U S I N G   ( a u t h . u i d ( )   =   a u t h o r _ i d ) ;  
  
 - -   R L S :   C o m m u n i t y   C o m m e n t s  
 C R E A T E   P O L I C Y   " A n y o n e   c a n   v i e w   c o m m u n i t y   c o m m e n t s "   O N   p u b l i c . c o m m u n i t y _ c o m m e n t s   F O R   S E L E C T   U S I N G   ( t r u e ) ;  
 C R E A T E   P O L I C Y   " A u t h e n t i c a t e d   u s e r s   c a n   c r e a t e   c o m m e n t s "   O N   p u b l i c . c o m m u n i t y _ c o m m e n t s   F O R   I N S E R T   W I T H   C H E C K   ( a u t h . u i d ( )   =   a u t h o r _ i d ) ;  
 C R E A T E   P O L I C Y   " A u t h o r s   c a n   u p d a t e   o w n   c o m m e n t s "   O N   p u b l i c . c o m m u n i t y _ c o m m e n t s   F O R   U P D A T E   U S I N G   ( a u t h . u i d ( )   =   a u t h o r _ i d ) ;  
 C R E A T E   P O L I C Y   " A u t h o r s   c a n   d e l e t e   o w n   c o m m e n t s "   O N   p u b l i c . c o m m u n i t y _ c o m m e n t s   F O R   D E L E T E   U S I N G   ( a u t h . u i d ( )   =   a u t h o r _ i d ) ;  
  
 - -   R L S :   C o m m u n i t y   R e a c t i o n s  
 C R E A T E   P O L I C Y   " A n y o n e   c a n   v i e w   r e a c t i o n s "   O N   p u b l i c . c o m m u n i t y _ r e a c t i o n s   F O R   S E L E C T   U S I N G   ( t r u e ) ;  
 C R E A T E   P O L I C Y   " U s e r s   c a n   m a n a g e   o w n   r e a c t i o n s "   O N   p u b l i c . c o m m u n i t y _ r e a c t i o n s   F O R   I N S E R T   W I T H   C H E C K   ( a u t h . u i d ( )   =   u s e r _ i d ) ;  
 C R E A T E   P O L I C Y   " U s e r s   c a n   d e l e t e   o w n   r e a c t i o n s "   O N   p u b l i c . c o m m u n i t y _ r e a c t i o n s   F O R   D E L E T E   U S I N G   ( a u t h . u i d ( )   =   u s e r _ i d ) ;  
 C R E A T E   P O L I C Y   " U s e r s   c a n   u p d a t e   o w n   r e a c t i o n s "   O N   p u b l i c . c o m m u n i t y _ r e a c t i o n s   F O R   U P D A T E   U S I N G   ( a u t h . u i d ( )   =   u s e r _ i d ) ;  
  
 - -   R L S :   C o m m u n i t y   B o o k m a r k s  
 C R E A T E   P O L I C Y   " U s e r s   c a n   v i e w   o w n   b o o k m a r k s "   O N   p u b l i c . c o m m u n i t y _ b o o k m a r k s   F O R   S E L E C T   U S I N G   ( a u t h . u i d ( )   =   u s e r _ i d ) ;  
 C R E A T E   P O L I C Y   " U s e r s   c a n   c r e a t e   b o o k m a r k s "   O N   p u b l i c . c o m m u n i t y _ b o o k m a r k s   F O R   I N S E R T   W I T H   C H E C K   ( a u t h . u i d ( )   =   u s e r _ i d ) ;  
 C R E A T E   P O L I C Y   " U s e r s   c a n   d e l e t e   o w n   b o o k m a r k s "   O N   p u b l i c . c o m m u n i t y _ b o o k m a r k s   F O R   D E L E T E   U S I N G   ( a u t h . u i d ( )   =   u s e r _ i d ) ;  
  
 - -   u p d a t e d _ a t   t r i g g e r  
 C R E A T E   T R I G G E R   u p d a t e _ c o m m u n i t y _ p o s t s _ u p d a t e d _ a t   B E F O R E   U P D A T E   O N   p u b l i c . c o m m u n i t y _ p o s t s  
     F O R   E A C H   R O W   E X E C U T E   F U N C T I O N   p u b l i c . u p d a t e _ u p d a t e d _ a t _ c o l u m n ( ) ;  
  
 - -   F u n c t i o n   t o   u p d a t e   c o m m e n t   c o u n t s  
 C R E A T E   O R   R E P L A C E   F U N C T I O N   p u b l i c . h a n d l e _ c o m m e n t _ c o u n t ( )  
 R E T U R N S   T R I G G E R   A S   $ $  
 B E G I N  
     I F   T G _ O P   =   ' I N S E R T '   T H E N  
         U P D A T E   p u b l i c . c o m m u n i t y _ p o s t s   S E T   c o m m e n t s _ c o u n t   =   c o m m e n t s _ c o u n t   +   1   W H E R E   i d   =   N E W . p o s t _ i d ;  
     E L S I F   T G _ O P   =   ' D E L E T E '   T H E N  
         U P D A T E   p u b l i c . c o m m u n i t y _ p o s t s   S E T   c o m m e n t s _ c o u n t   =   G R E A T E S T ( c o m m e n t s _ c o u n t   -   1 ,   0 )   W H E R E   i d   =   O L D . p o s t _ i d ;  
     E N D   I F ;  
     R E T U R N   C O A L E S C E ( N E W ,   O L D ) ;  
 E N D ;  
 $ $   L A N G U A G E   p l p g s q l   S E C U R I T Y   D E F I N E R ;  
  
 C R E A T E   T R I G G E R   o n _ c o m m u n i t y _ c o m m e n t _ c h a n g e  
     A F T E R   I N S E R T   O R   D E L E T E   O N   p u b l i c . c o m m u n i t y _ c o m m e n t s  
     F O R   E A C H   R O W   E X E C U T E   F U N C T I O N   p u b l i c . h a n d l e _ c o m m e n t _ c o u n t ( ) ;  
 
>>>>>>> origin/main
