-- Migration: Add Community Tables
-- Run this in your Supabase SQL editor after the initial schema

-- Community Posts
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  community TEXT NOT NULL,
  type TEXT CHECK (type IN ('text', 'image', 'pdf', 'poll', 'link', 'flashcard', 'quiz', 'achievement')) NOT NULL DEFAULT 'text',
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  pdf_url TEXT,
  link_url TEXT,
  link_preview TEXT,
  poll_data JSONB,
  tags TEXT[] DEFAULT '{}',
  reaction_like INTEGER DEFAULT 0,
  reaction_helpful INTEGER DEFAULT 0,
  reaction_fire INTEGER DEFAULT 0,
  reaction_mindblown INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  pinned BOOLEAN DEFAULT FALSE,
  ai_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Community Comments
CREATE TABLE IF NOT EXISTS public.community_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.community_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  reaction_like INTEGER DEFAULT 0,
  reaction_helpful INTEGER DEFAULT 0,
  reaction_fire INTEGER DEFAULT 0,
  reaction_mindblown INTEGER DEFAULT 0,
  pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Community Reactions (per-user tracking)
CREATE TABLE IF NOT EXISTS public.community_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  target_type TEXT CHECK (target_type IN ('post', 'comment')) NOT NULL,
  target_id UUID NOT NULL,
  reaction TEXT CHECK (reaction IN ('like', 'helpful', 'fire', 'mindblown')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, target_type, target_id)
);

-- Community Bookmarks
CREATE TABLE IF NOT EXISTS public.community_bookmarks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, post_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_author ON public.community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_community ON public.community_posts(community);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_comments_post ON public.community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_author ON public.community_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_community_reactions_user ON public.community_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_community_reactions_target ON public.community_reactions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_community_bookmarks_user ON public.community_bookmarks(user_id);

-- Enable RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS: Community Posts
CREATE POLICY "Anyone can view community posts" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own posts" ON public.community_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete own posts" ON public.community_posts FOR DELETE USING (auth.uid() = author_id);

-- RLS: Community Comments
CREATE POLICY "Anyone can view community comments" ON public.community_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON public.community_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own comments" ON public.community_comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete own comments" ON public.community_comments FOR DELETE USING (auth.uid() = author_id);

-- RLS: Community Reactions
CREATE POLICY "Anyone can view reactions" ON public.community_reactions FOR SELECT USING (true);
CREATE POLICY "Users can manage own reactions" ON public.community_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reactions" ON public.community_reactions FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update own reactions" ON public.community_reactions FOR UPDATE USING (auth.uid() = user_id);

-- RLS: Community Bookmarks
CREATE POLICY "Users can view own bookmarks" ON public.community_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create bookmarks" ON public.community_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own bookmarks" ON public.community_bookmarks FOR DELETE USING (auth.uid() = user_id);

-- updated_at trigger
CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update comment counts
CREATE OR REPLACE FUNCTION public.handle_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_community_comment_change
  AFTER INSERT OR DELETE ON public.community_comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_comment_count();
