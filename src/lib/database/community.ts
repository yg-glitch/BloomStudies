import { createUniversalClient as createClient } from '@/lib/supabase/universal'

export type CommunityPost = {
  id: string
  user_id: string
  community: string
  type: 'text' | 'poll' | 'link' | 'image'
  title: string
  content: string | null
  link_url: string | null
  image_url: string | null
  poll: any
  tags: string[]
  reactions: { like: number; helpful: number; fire: number; mindblown: number }
  user_reaction: string | null
  comments_count: number
  bookmarked: boolean
  pinned: boolean
  created_at: string
}

export type CommunityComment = {
  id: string
  post_id: string
  user_id: string
  parent_id: string | null
  content: string
  reactions: { like: number; helpful: number; fire: number; mindblown: number }
  pinned: boolean
  created_at: string
}

export async function getCommunityPosts(userId?: string, community?: string): Promise<CommunityPost[]> {
  const supabase = await createClient()
  let query = supabase
    .from('community_posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (community) query = query.eq('community', community)

  const { data, error } = await query

  if (error) return []
  return data || []
}

export async function getCommunityPost(postId: string): Promise<CommunityPost | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('community_posts')
    .select('*')
    .eq('id', postId)
    .single()

  if (error) return null
  return data
}

export async function createCommunityPost(
  userId: string,
  community: string,
  type: 'text' | 'poll' | 'link' | 'image',
  title: string,
  content?: string,
  linkUrl?: string,
  imageUrl?: string,
  poll?: any,
  tags?: string[]
): Promise<CommunityPost | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('community_posts')
    .insert({
      user_id: userId,
      community,
      type,
      title,
      content,
      link_url: linkUrl,
      image_url: imageUrl,
      poll,
      tags,
    })
    .select()
    .single()

  if (error) return null
  return data
}

export async function updateCommunityPostReaction(
  postId: string,
  userId: string,
  reaction: 'like' | 'helpful' | 'fire' | 'mindblown' | null
): Promise<boolean> {
  const supabase = await createClient()
  
  // First, get current post
  const { data: post } = await supabase
    .from('community_posts')
    .select('*')
    .eq('id', postId)
    .single()

  if (!post) return false

  // Update reactions count
  const reactions = post.reactions as any
  const oldReaction = post.user_reaction

  if (oldReaction && oldReaction !== reaction) {
    reactions[oldReaction] = Math.max(0, reactions[oldReaction] - 1)
  }
  if (reaction && reaction !== oldReaction) {
    reactions[reaction] = (reactions[reaction] || 0) + 1
  }

  const { error } = await supabase
    .from('community_posts')
    .update({ reactions, user_reaction: reaction })
    .eq('id', postId)

  return !error
}

export async function getCommunityComments(postId: string): Promise<CommunityComment[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('community_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) return []
  return data || []
}

export async function createCommunityComment(
  postId: string,
  userId: string,
  content: string,
  parentId?: string
): Promise<CommunityComment | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('community_comments')
    .insert({
      post_id: postId,
      user_id: userId,
      content,
      parent_id: parentId,
    })
    .select()
    .single()

  if (error) return null

  // Increment comment count on post
  await supabase.rpc('increment', { table_name: 'community_posts', row_id: postId, column_name: 'comments_count' })

  return data
}

export async function getJoinedCommunities(userId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('community_joined')
    .select('community')
    .eq('user_id', userId)

  if (error) return []
  return data?.map(d => d.community) || []
}

export async function joinCommunity(userId: string, community: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } =	await supabase
    .from('community_joined')
    .insert({ user_id: userId, community })

  return !error
}

export async function leaveCommunity(userId: string, community: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('community_joined')
    .delete()
    .eq('user_id', userId)
    .eq('community', community)

  return !error
}

export async function getBookmarkedPosts(userId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('community_bookmarks')
    .select('post_id')
    .eq('user_id', userId)

  if (error) return []
  return data?.map(d => d.post_id) || []
}

export async function bookmarkPost(userId: string, postId: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('community_bookmarks')
    .insert({ user_id: userId, post_id: postId })

  return !error
}

export async function unbookmarkPost(userId: string, postId: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('community_bookmarks')
    .delete()
    .eq('user_id', userId)
    .eq('post_id', postId)

  return !error
}

export async function reportPost(userId: string, postId: string, reason?: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('community_reports')
    .insert({ user_id: userId, post_id: postId, reason })

  return !error
}
