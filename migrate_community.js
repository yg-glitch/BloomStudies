const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/community/page.tsx', 'utf8');

// Imports
code = code.replace(
  "import { useState, useRef, useCallback } from 'react'",
  "import { useState, useRef, useCallback, useEffect } from 'react'\nimport { createClient } from '@/lib/supabase/client'"
);

// State replacement
code = code.replace(
    const [user] = useState<CommunityUser>(generateMockUser)
  const [posts, setPosts] = useLocalStorage<CommunityPost[]>('bloom-community-posts', generateMockPosts())
  const [comments, setComments] = useLocalStorage<Record<string, PostComment[]>>('bloom-community-comments', {}),
    const supabase = createClient()
  const [user, setUser] = useState<CommunityUser>(generateMockUser()) // Default, replaced after fetch
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [comments, setComments] = useState<Record<string, PostComment[]>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        setIsLoading(false)
        return
      }
      
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single()
      if (profile) {
        setUser({
          id: authUser.id,
          name: profile.full_name || 'Student',
          avatar: profile.avatar_url || '🧑‍🎓',
          bio: '', year: profile.year || '6th Year',
          subjects: profile.subjects || [],
          bloomScore: profile.bloom_score || 0,
          xp: profile.xp || 0,
          level: profile.level as UserLevel || 'Seedling',
          streak: profile.streak || 0,
          followers: 0, following: 0, badges: [],
          joinedAt: profile.created_at,
          postsCount: 0, savedPosts: [], joinedCommunities: []
        })
      }

      const dbPosts = await import('@/lib/database/community').then(m => m.getCommunityPosts({ userId: authUser.id }))
      setPosts(dbPosts.map((p: any) => ({
        id: p.id,
        authorId: p.author_id,
        author: {
          id: p.author_id,
          name: p.profiles?.full_name || 'Unknown',
          avatar: p.profiles?.avatar_url || '🧑‍🎓',
          level: p.profiles?.level as UserLevel || 'Seedling',
          badges: [],
          bloomScore: p.profiles?.bloom_score || 0
        },
        community: p.community,
        type: p.type as any,
        title: p.title,
        content: p.content,
        imageUrl: p.image_url || undefined,
        pdfUrl: p.pdf_url || undefined,
        linkUrl: p.link_url || undefined,
        linkPreview: p.link_preview || undefined,
        poll: p.poll_data as any || undefined,
        tags: p.tags,
        reactions: { like: p.reaction_like, helpful: p.reaction_helpful, fire: p.reaction_fire, mindblown: p.reaction_mindblown },
        userReaction: p.user_reaction as any || undefined,
        commentsCount: p.comments_count,
        bookmarked: p.bookmarked || false,
        pinned: p.pinned,
        createdAt: p.created_at,
        aiSummary: p.ai_summary || undefined
      })))
      setIsLoading(false)
    }
    loadData()
  }, [])
);

// Handle post
code = code.replace(
      const newPost: CommunityPost = {
      id: Date.now().toString(), authorId: user.id,
      author: { id: user.id, name: user.name, avatar: user.avatar, level: user.level, badges: user.badges, bloomScore: user.bloomScore },
      community: composeCommunity,
      type: composeTab === 'poll' ? 'poll' : composeTab === 'link' ? 'link' : composeTab === 'image' ? 'image' : 'text',
      title: composeTitle, content: composeContent,
      ...(composeTab === 'link' && { linkUrl: composeLinkUrl }),
      ...(composeTab === 'image' && { imageUrl: composeImageUrl }),
      ...(composeTab === 'poll' && { poll: { question: composeTitle, options: pollOptions.filter(o => o.trim()).map(o => ({ text: o, votes: 0 })), totalVotes: 0 } }),
      tags: [], reactions: { like: 0, helpful: 0, fire: 0, mindblown: 0 },
      commentsCount: 0, bookmarked: false, pinned: false, createdAt: new Date().toISOString(),
    }
    setPosts(prev => [newPost, ...prev])
    setShowCompose(false); setComposeTitle(''); setComposeContent(''); setComposeCommunity('')
    setComposeLinkUrl(''); setComposeImageUrl(''); setPollOptions(['', '']); setIsPosting(false)
    toastSuccess('Post published!', 'Your post is now live in the community')
    toastXP(15, 'Posted to community'),
      import('@/lib/database/community').then(m => m.createCommunityPost(user.id, {
      community: composeCommunity,
      type: composeTab === 'poll' ? 'poll' : composeTab === 'link' ? 'link' : composeTab === 'image' ? 'image' : 'text',
      title: composeTitle,
      content: composeContent,
      link_url: composeLinkUrl || undefined,
      image_url: composeImageUrl || undefined,
      poll_data: composeTab === 'poll' ? { question: composeTitle, options: pollOptions.filter(o => o.trim()).map(o => ({ text: o, votes: 0 })), totalVotes: 0 } : undefined,
      tags: []
    })).then(dbPost => {
      if (dbPost) {
        const newPost: CommunityPost = {
          id: dbPost.id, authorId: user.id,
          author: { id: user.id, name: user.name, avatar: user.avatar, level: user.level, badges: user.badges, bloomScore: user.bloomScore },
          community: dbPost.community,
          type: dbPost.type as any,
          title: dbPost.title, content: dbPost.content,
          linkUrl: dbPost.link_url || undefined,
          imageUrl: dbPost.image_url || undefined,
          poll: dbPost.poll_data as any || undefined,
          tags: [], reactions: { like: 0, helpful: 0, fire: 0, mindblown: 0 },
          commentsCount: 0, bookmarked: false, pinned: false, createdAt: dbPost.created_at,
        }
        setPosts(prev => [newPost, ...prev])
        setShowCompose(false); setComposeTitle(''); setComposeContent(''); setComposeCommunity('')
        setComposeLinkUrl(''); setComposeImageUrl(''); setPollOptions(['', ''])
        toastSuccess('Post published!', 'Your post is now live in the community')
        toastXP(15, 'Posted to community')
      }
      setIsPosting(false)
    })
);

// handleReact
code = code.replace(
    const handleReact = (postId: string, reaction: Reaction) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      const prev_reaction = p.userReaction
      const wasSame = prev_reaction === reaction
      return {
        ...p,
        userReaction: wasSame ? undefined : reaction,
        reactions: {
          ...p.reactions,
          [reaction]: p.reactions[reaction] + (wasSame ? -1 : 1),
          ...(prev_reaction && !wasSame ? { [prev_reaction]: Math.max(0, p.reactions[prev_reaction] - 1) } : {}),
        },
      }
    }))
  },
    const handleReact = (postId: string, reaction: Reaction) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      const prev_reaction = p.userReaction
      const wasSame = prev_reaction === reaction
      
      // Fire and forget
      import('@/lib/database/community').then(m => m.reactToPost(user.id, postId, wasSame ? null : reaction)).catch(() => {})
      
      return {
        ...p,
        userReaction: wasSame ? undefined : reaction,
        reactions: {
          ...p.reactions,
          [reaction]: p.reactions[reaction] + (wasSame ? -1 : 1),
          ...(prev_reaction && !wasSame ? { [prev_reaction]: Math.max(0, p.reactions[prev_reaction] - 1) } : {}),
        },
      }
    }))
  }
);

// Loading state wrapper
code = code.replace(
    return (
    <div className="flex h-screen overflow-hidden animate-fade-in bg-slate-50 dark:bg-slate-950">,
    if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading community...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden animate-fade-in bg-slate-50 dark:bg-slate-950">
);

fs.writeFileSync('src/app/dashboard/community/page.tsx', code);
