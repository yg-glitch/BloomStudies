import { createClient } from '@/lib/supabase/client'

export type CommunityPostRow = {
  id: string
  author_id: string
  community: string
  type: 'text' | 'image' | 'pdf' | 'poll' | 'link' | 'flashcard' | 'quiz' | 'achievement'
  title: string
  content: string
  image_url: string | null
  pdf_url: string | null
  link_url: string | null
  link_preview: string | null
  poll_data: { question: string; options: { text: string; votes: number }[]; totalVotes: number; endsAt?: string } | null
  tags: string[]
  reaction_like: number
  reaction_helpful: number
  reaction_fire: number
  reaction_mindblown: number
  comments_count: number
  pinned: boolean
  ai_summary: string | null
  created_at: string
  updated_at: string
  profiles?: { full_name: string | null; avatar_url: string | null; level: string | null; xp: number | null; bloom_score: number | null }
  user_reaction?: string | null
  bookmarked?: boolean
}

export type CommunityCommentRow = {
  id: string
  post_id: string
  author_id: string
  parent_id: string | null
  content: string
  reaction_like: number
  reaction_helpful: number
  reaction_fire: number
  reaction_mindblown: number
  pinned: boolean
  created_at: string
  profiles?: { full_name: string | null; avatar_url: string | null; level: string | null }
  user_reaction?: string | null
}

export async function getCommunityPosts(options?: {
  community?: string; userId?: string; limit?: number
}): Promise<CommunityPostRow[]> {
  const supabase = createClient()
  let query = supabase
    .from('community_posts')
    .select('*, profiles:author_id (full_name, avatar_url, level, xp, bloom_score)')
    .order('created_at', { ascending: false })
    .limit(options?.limit ?? 50)

  if (options?.community) query = query.eq('community', options.community)
  const { data, error } = await query
  if (error || !data) return []

  if (options?.userId) {
    const postIds = data.map((p: any) => p.id)
    const [reactionsResult, bookmarksResult] = await Promise.all([
      supabase.from('community_reactions').select('target_id, reaction').eq('user_id', options.userId).eq('target_type', 'post').in('target_id', postIds),
      supabase.from('community_bookmarks').select('post_id').eq('user_id', options.userId).in('post_id', postIds),
    ])
    const reactionMap = new Map((reactionsResult.data || []).map((r: any) => [r.target_id, r.reaction]))
    const bookmarkSet = new Set((bookmarksResult.data || []).map((b: any) => b.post_id))
    return data.map((post: any) => ({
      ...post,
      user_reaction: reactionMap.get(post.id) ?? null,
      bookmarked: bookmarkSet.has(post.id),
      reactions: {
        like: post.reaction_like || 0,
        helpful: post.reaction_helpful || 0,
        fire: post.reaction_fire || 0,
        mindblown: post.reaction_mindblown || 0
      },
      poll: post.poll_data
    }))
  }
  return data.map((post: any) => ({
    ...post,
    user_reaction: null,
    bookmarked: false,
    reactions: {
      like: post.reaction_like || 0,
      helpful: post.reaction_helpful || 0,
      fire: post.reaction_fire || 0,
      mindblown: post.reaction_mindblown || 0
    },
    poll: post.poll_data
  }))
}

export async function createCommunityPost(
  authorId: string,
  post: { community: string; type: CommunityPostRow['type']; title: string; content: string; image_url?: string; link_url?: string; poll_data?: CommunityPostRow['poll_data']; tags?: string[] }
): Promise<CommunityPostRow | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('community_posts')
    .insert({ author_id: authorId, ...post })
    .select('*, profiles:author_id (full_name, avatar_url, level, xp, bloom_score)')
    .single()
  if (error) return null
  return {
    ...data,
    user_reaction: null,
    bookmarked: false,
    reactions: {
      like: data.reaction_like || 0,
      helpful: data.reaction_helpful || 0,
      fire: data.reaction_fire || 0,
      mindblown: data.reaction_mindblown || 0
    },
    poll: data.poll_data
  }
}

export async function deleteCommunityPost(postId: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.from('community_posts').delete().eq('id', postId)
  return !error
}

export async function reactToPost(userId: string, postId: string, reaction: 'like' | 'helpful' | 'fire' | 'mindblown' | null): Promise<void> {
  const supabase = createClient()
  if (reaction === null) {
    await supabase.from('community_reactions').delete().eq('user_id', userId).eq('target_type', 'post').eq('target_id', postId)
    return
  }
  await supabase.from('community_reactions').upsert({ user_id: userId, target_type: 'post', target_id: postId, reaction }, { onConflict: 'user_id,target_type,target_id' })
}

export async function toggleBookmark(userId: string, postId: string, isCurrentlyBookmarked: boolean): Promise<boolean> {
  const supabase = createClient()
  if (isCurrentlyBookmarked) {
    const { error } = await supabase.from('community_bookmarks').delete().eq('user_id', userId).eq('post_id', postId)
    return !error
  }
  const { error } = await supabase.from('community_bookmarks').insert({ user_id: userId, post_id: postId })
  return !error
}

export async function getPostComments(postId: string, userId?: string): Promise<CommunityCommentRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('community_comments')
    .select('*, profiles:author_id (full_name, avatar_url, level)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  if (error || !data) return []
  if (userId) {
    const commentIds = data.map((c: any) => c.id)
    const { data: reactions } = await supabase.from('community_reactions').select('target_id, reaction').eq('user_id', userId).eq('target_type', 'comment').in('target_id', commentIds)
    const reactionMap = new Map((reactions || []).map((r: any) => [r.target_id, r.reaction]))
    return data.map((c: any) => ({ ...c, user_reaction: reactionMap.get(c.id) ?? null }))
  }
  return data.map((c: any) => ({ ...c, user_reaction: null }))
}

export async function createComment(authorId: string, postId: string, content: string, parentId?: string): Promise<CommunityCommentRow | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('community_comments')
    .insert({ author_id: authorId, post_id: postId, content, parent_id: parentId ?? null })
    .select('*, profiles:author_id (full_name, avatar_url, level)')
    .single()
  if (error) return null
  return { ...data, user_reaction: null }
}

export async function reactToComment(userId: string, commentId: string, reaction: 'like' | 'helpful' | 'fire' | 'mindblown' | null): Promise<void> {
  const supabase = createClient()
  if (reaction === null) {
    await supabase.from('community_reactions').delete().eq('user_id', userId).eq('target_type', 'comment').eq('target_id', commentId)
    return
  }
  await supabase.from('community_reactions').upsert({ user_id: userId, target_type: 'comment', target_id: commentId, reaction }, { onConflict: 'user_id,target_type,target_id' })
}

// Legacy exports for compatibility
export type CommunityPost = CommunityPostRow & {
  reactions?: { like: number; helpful: number; fire: number; mindblown: number }
  poll?: { question: string; options: { text: string; votes: number }[]; totalVotes: number; endsAt?: string; userVoted?: number }
}
export type CommunityComment = CommunityCommentRow

export async function getCommunityComments(postId: string): Promise<CommunityCommentRow[]> {
  return getPostComments(postId)
}

export async function createCommunityComment(postId: string, userId: string, content: string, parentId?: string): Promise<CommunityCommentRow | null> {
  return createComment(userId, postId, content, parentId)
}

export async function updateCommunityPostReaction(postId: string, userId: string, reaction: 'like' | 'helpful' | 'fire' | 'mindblown' | null): Promise<boolean> {
  await reactToPost(userId, postId, reaction)
  return true
}

export async function getJoinedCommunities(userId: string): Promise<string[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('community_joined')
    .select('community')
    .eq('user_id', userId)

  if (error) return []
  return data?.map((d: any) => d.community) || []
}

export async function joinCommunity(userId: string, community: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('community_joined')
    .insert({ user_id: userId, community })

  return !error
}

export async function leaveCommunity(userId: string, community: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('community_joined')
    .delete()
    .eq('user_id', userId)
    .eq('community', community)

  return !error
}

export async function getBookmarkedPosts(userId: string): Promise<string[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('community_bookmarks')
    .select('post_id')
    .eq('user_id', userId)

  if (error) return []
  return data?.map((d: any) => d.post_id) || []
}

export async function bookmarkPost(userId: string, postId: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('community_bookmarks')
    .insert({ user_id: userId, post_id: postId })

  return !error
}

export async function unbookmarkPost(userId: string, postId: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('community_bookmarks')
    .delete()
    .eq('user_id', userId)
    .eq('post_id', postId)

  return !error
}

export async function reportPost(userId: string, postId: string, reason?: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('community_reports')
    .insert({ user_id: userId, post_id: postId, reason })

  return !error
}
