'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Users, Plus, Search, Bookmark, MessageCircle, Share2,
  Sparkles, X, Send, Trophy, Crown, Shield, Check, Filter,
  TrendingUp, Clock, Pin, Flag, BarChart2, Link as LinkIcon,
  Image as ImageIcon, FileText, ChevronDown, ChevronUp,
  ThumbsUp, Heart, Zap, Star, Eye, Reply, MoreHorizontal,
  AlertTriangle, BookOpen, Hash, Bell, Settings as SettingsIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import MarkdownRenderer from '@/components/ui/MarkdownRenderer'
import { useToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'
import { getProfile } from '@/lib/database/profiles'
import {
  getCommunityPosts, createCommunityPost, getCommunityComments, createCommunityComment,
  updateCommunityPostReaction, getJoinedCommunities, joinCommunity, leaveCommunity,
  getBookmarkedPosts, bookmarkPost, unbookmarkPost, reportPost,
  CommunityPost, CommunityComment
} from '@/lib/database/community'
import {
  ALL_COMMUNITIES, JC_COMMUNITIES, LC_COMMUNITIES,
  BADGE_INFO, LEVEL_COLORS, XP_PER_LEVEL,
  BadgeType, Reaction, UserLevel
} from '@/lib/community'

export const dynamic = 'force-dynamic'

const REACTION_INFO: Record<Reaction, { emoji: string; label: string }> = {
  like: { emoji: '👍', label: 'Like' },
  helpful: { emoji: '💡', label: 'Helpful' },
  fire: { emoji: '🔥', label: 'Fire' },
  mindblown: { emoji: '🤯', label: 'Mind-blown' },
}

const SORT_OPTIONS = ['Hot', 'New', 'Top', 'Rising'] as const
type SortOption = typeof SORT_OPTIONS[number]
type View = 'feed' | 'leaderboard' | 'profile' | 'guidelines'
type ComposeTab = 'text' | 'poll' | 'link' | 'image'

const COUNTIES = ['Antrim','Armagh','Carlow','Cavan','Clare','Cork','Derry','Donegal','Down','Dublin','Fermanagh','Galway','Kerry','Kildare','Kilkenny','Laois','Leitrim','Limerick','Longford','Louth','Mayo','Meath','Monaghan','Offaly','Roscommon','Sligo','Tipperary','Tyrone','Waterford','Westmeath','Wexford','Wicklow']
const YEARS = ['Junior Cycle 1','Junior Cycle 2','Junior Cycle 3','5th Year','6th Year','Other'] as const

export default function CommunityPage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [comments, setComments] = useState<Record<string, CommunityComment[]>>({})
  const [activeCommunity, setActiveCommunity] = useState<string | null>(null)
  const [sort, setSort] = useState<SortOption>('Hot')
  const [view, setView] = useState<View>('feed')
  const [showCompose, setShowCompose] = useState(false)
  const [composeTab, setComposeTab] = useState<ComposeTab>('text')
  const [expandedPost, setExpandedPost] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [joinedCommunities, setJoinedCommunities] = useState<string[]>([])
  const [bookmarkedPosts, setBookmarkedPosts] = useState<string[]>([])
  const [reportedPosts, setReportedPosts] = useState<string[]>([])
  const [aiPanel, setAiPanel] = useState<{ postId: string; result: string; loading: boolean; action: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadUserData = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const profile = await getProfile(authUser.id)
        setUser({ ...authUser, ...profile })
        
        const [joined, bookmarked] = await Promise.all([
          getJoinedCommunities(authUser.id),
          getBookmarkedPosts(authUser.id),
        ])
        setJoinedCommunities(joined)
        setBookmarkedPosts(bookmarked)
      }
    } catch (error) {
      // Error loading user data - handled silently
    }
  }, [supabase])

  const loadPosts = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      const loadedPosts = await getCommunityPosts(authUser?.id, activeCommunity || undefined)
      setPosts(loadedPosts)
      
      // Load comments for all posts
      const commentsData: Record<string, CommunityComment[]> = {}
      for (const post of loadedPosts) {
        const postComments = await getCommunityComments(post.id)
        commentsData[post.id] = postComments
      }
      setComments(commentsData)
    } catch (error) {
      // Error loading posts - handled silently
    } finally {
      setLoading(false)
    }
  }, [supabase, activeCommunity])

  useEffect(() => {
    loadUserData()
    loadPosts()
  }, [loadUserData, loadPosts])

  // Compose state
  const [composeTitle, setComposeTitle] = useState('')
  const [composeContent, setComposeContent] = useState('')
  const [composeCommunity, setComposeCommunity] = useState('')
  const [composeLinkUrl, setComposeLinkUrl] = useState('')
  const [composeImageUrl, setComposeImageUrl] = useState('')
  const [pollOptions, setPollOptions] = useState(['', ''])
  const [isPosting, setIsPosting] = useState(false)

  const filteredPosts = posts.filter(p => {
    if (activeCommunity && p.community !== activeCommunity) return false
    if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase()) && !(p.content || '').toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  }).sort((a, b) => {
    if (sort === 'New') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    if (sort === 'Top') return totalScore(b) - totalScore(a)
    const ageA = (Date.now() - new Date(a.created_at).getTime()) / 3600000
    const ageB = (Date.now() - new Date(b.created_at).getTime()) / 3600000
    return (totalScore(b) / (ageB + 2)) - (totalScore(a) / (ageA + 2))
  })

  function totalScore(p: CommunityPost) { return Object.values(p.reactions).reduce((s, v) => s + v, 0) }

  const handleReact = async (postId: string, reaction: Reaction) => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return
    
    const currentReaction = posts.find(p => p.id === postId)?.user_reaction
    const newReaction = currentReaction === reaction ? null : reaction
    
    await updateCommunityPostReaction(postId, authUser.id, newReaction)
    
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      const reactions = { ...p.reactions }
      if (currentReaction && currentReaction !== reaction) {
        reactions[currentReaction as keyof typeof reactions] = Math.max(0, reactions[currentReaction as keyof typeof reactions] - 1)
      }
      if (reaction && reaction !== currentReaction) {
        reactions[reaction as keyof typeof reactions] = (reactions[reaction as keyof typeof reactions] || 0) + 1
      }
      return { ...p, user_reaction: newReaction, reactions }
    }))
  }

  const handleVotePoll = (postId: string, idx: number) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId || !p.poll || p.poll.userVoted !== undefined) return p
      const newOptions = p.poll.options.map((o: any, i: number) => i === idx ? { ...o, votes: o.votes + 1 } : o)
      return { ...p, poll: { ...p.poll, options: newOptions, totalVotes: p.poll.totalVotes + 1, userVoted: idx } }
    }))
  }

  const handleReport = async (postId: string) => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return
    
    await reportPost(authUser.id, postId)
    setReportedPosts(prev => prev.includes(postId) ? prev : [...prev, postId])
    toastSuccess('Post reported', 'Our AI moderation team will review it shortly')
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setComposeImageUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  const { xp: toastXP, success: toastSuccess } = useToast()

  const handlePost = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser || !composeTitle.trim() || !composeCommunity) return
    
    setIsPosting(true)
    try {
      const newPost = await createCommunityPost(
        authUser.id,
        composeCommunity,
        composeTab,
        composeTitle,
        composeContent,
        composeLinkUrl,
        composeImageUrl,
        composeTab === 'poll' ? { question: composeTitle, options: pollOptions.filter((o: string) => o.trim()).map((o: string) => ({ text: o, votes: 0 })), totalVotes: 0 } : undefined
      )
      
      if (newPost) {
        setPosts(prev => [newPost, ...prev])
        setShowCompose(false)
        setComposeTitle('')
        setComposeContent('')
        setComposeCommunity('')
        setComposeLinkUrl('')
        setComposeImageUrl('')
        setPollOptions(['', ''])
        toastSuccess('Post published!', 'Your post is now live in the community')
        toastXP(15, 'Posted to community')
      }
    } catch (error) {
      // Error creating post - handled silently
    } finally {
      setIsPosting(false)
    }
  }

  const handleAIAction = async (post: CommunityPost, action: string) => {
    setAiPanel({ postId: post.id, result: '', loading: true, action })
    const promptMap: Record<string, string> = {
      summarise: `Summarise this student post in 3 bullet points:\n\nTitle: ${post.title}\n\n${post.content}`,
      flashcards: `Generate 6 flashcard Q&A pairs from this post:\n\nTitle: ${post.title}\n\n${post.content}`,
      quiz: `Create 4 exam-style questions from this post:\n\nTitle: ${post.title}\n\n${post.content}`,
      techniques: `Suggest 4 study techniques relevant to this topic:\n\nTitle: ${post.title}\n\n${post.content}`,
      resources: `Recommend 4 study resources and revision tips for this topic:\n\n${post.title}`,
    }
    try {
      const res = await fetch('/api/ai/tutor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: promptMap[action] }], subject: '', level: 'higher', educationSystem: 'leaving-cert' }) })
      if (!res.ok) throw new Error()
      const reader = res.body?.getReader(); const decoder = new TextDecoder(); let text = ''
      if (reader) { while (true) { const { done, value } = await reader.read(); if (done) break; for (const line of decoder.decode(value).split('\n')) { if (line.startsWith('data: ') && line.slice(6) !== '[DONE]') { try { text += JSON.parse(line.slice(6)).content || '' } catch {} } } setAiPanel(p => p ? { ...p, result: text, loading: false } : null) } }
    } catch { setAiPanel(p => p ? { ...p, loading: false, result: 'Failed to load AI response.' } : null) }
  }

  const handleJoinCommunity = async (community: string) => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return
    
    if (joinedCommunities.includes(community)) {
      await leaveCommunity(authUser.id, community)
      setJoinedCommunities(prev => prev.filter(c => c !== community))
    } else {
      await joinCommunity(authUser.id, community)
      setJoinedCommunities(prev => [...prev, community])
    }
  }

  const handleBookmark = async (postId: string) => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return
    
    if (bookmarkedPosts.includes(postId)) {
      await unbookmarkPost(authUser.id, postId)
      setBookmarkedPosts(prev => prev.filter(id => id !== postId))
    } else {
      await bookmarkPost(authUser.id, postId)
      setBookmarkedPosts(prev => [...prev, postId])
    }
  }

  const handleAddComment = async (postId: string, text: string, parentId?: string) => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser || !text.trim()) return
    
    try {
      const newComment = await createCommunityComment(postId, authUser.id, text, parentId)
      if (newComment) {
        setComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), newComment] }))
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p))
      }
    } catch (error) {
      // Error adding comment - handled silently
    }
  }

  const formatTime = (iso: string) => { 
    const d = (Date.now() - new Date(iso).getTime()) / 1000
    if (d < 60) return 'just now'
    if (d < 3600) return `${Math.floor(d / 60)}m`
    if (d < 86400) return `${Math.floor(d / 3600)}h`
    return `${Math.floor(d / 86400)}d`
  }
  
  const getCommunity = (key: string) => ALL_COMMUNITIES.find(c => c.key === key)

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Loading community...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden animate-fade-in bg-slate-50 dark:bg-slate-950">
      {/* LEFT SIDEBAR */}
      <div className="w-60 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900 overflow-y-auto">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shrink-0"><Users className="w-4 h-4 text-white" /></div>
            <span className="font-display font-bold text-slate-900 dark:text-white">Community</span>
          </div>
          <button onClick={() => setShowCompose(true)} className="btn-primary w-full justify-center text-sm">
            <Plus className="w-4 h-4" /> Create Post
          </button>
        </div>
        <nav className="p-3 space-y-0.5">
          {[{ label: '🏠 Home', action: () => { setActiveCommunity(null); setView('feed') } }, { label: '🏆 Leaderboard', action: () => setView('leaderboard') }, { label: '👤 My Profile', action: () => setView('profile') }, { label: '📋 Guidelines', action: () => setView('guidelines') }].map(item => (
            <button key={item.label} onClick={item.action} className="w-full text-left px-3 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all">{item.label}</button>
          ))}
        </nav>
        <div className="px-3 pb-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">Junior Cycle</p>
          {JC_COMMUNITIES.map(c => (
            <button key={c.key} onClick={() => { setActiveCommunity(c.key); setView('feed') }} className={cn('w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all text-left', activeCommunity === c.key ? 'bg-primary-100 dark:bg-primary-950/50 text-primary-700 dark:text-primary-400 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')}>
              <span>{c.emoji}</span><span className="truncate">{c.name}</span>
              {joinedCommunities.includes(c.key) && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />}
            </button>
          ))}
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5 mt-3">Leaving Cert</p>
          {LC_COMMUNITIES.map(c => (
            <button key={c.key} onClick={() => { setActiveCommunity(c.key); setView('feed') }} className={cn('w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all text-left', activeCommunity === c.key ? 'bg-primary-100 dark:bg-primary-950/50 text-primary-700 dark:text-primary-400 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')}>
              <span>{c.emoji}</span><span className="truncate">{c.name}</span>
              {joinedCommunities.includes(c.key) && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 overflow-y-auto">
        {/* FEED */}
        {view === 'feed' && (
          <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
            {activeCommunity && (() => { const c = getCommunity(activeCommunity); if (!c) return null; return (
              <div className={cn('p-5 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-600 text-white shadow-xl shadow-primary-500/20')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3"><span className="text-4xl">{c.emoji}</span><div><h2 className="font-display text-xl font-bold">{c.name}</h2><p className="text-white/70 text-sm">{c.level} · {posts.filter(p => p.community === activeCommunity).length} posts</p></div></div>
                  <button onClick={() => handleJoinCommunity(activeCommunity)} className={cn('px-4 py-2 rounded-xl text-sm font-bold transition-all', joinedCommunities.includes(activeCommunity) ? 'bg-white/20 hover:bg-white/30' : 'bg-white text-primary-700 hover:shadow-lg')}>{joinedCommunities.includes(activeCommunity) ? '✓ Joined' : '+ Join'}</button>
                </div>
              </div>
            )})()}
            <div className="flex items-center gap-2">
              <div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search posts..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:border-primary-500 focus:outline-none" /></div>
              <div className="flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
                {SORT_OPTIONS.map(s => <button key={s} onClick={() => setSort(s)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', sort === s ? 'bg-primary-500 text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300')}>{s}</button>)}
              </div>
            </div>
            {filteredPosts.map(post => !reportedPosts.includes(post.id) && (
              <PostCard key={post.id} post={post} bookmarked={bookmarkedPosts.includes(post.id)} comments={comments[post.id] || []}
                expanded={expandedPost === post.id} onToggleExpand={() => setExpandedPost(prev => prev === post.id ? null : post.id)}
                onReact={handleReact} onBookmark={handleBookmark} onVotePoll={handleVotePoll} onReport={handleReport} onAIAction={handleAIAction}
                onAddComment={handleAddComment}
                getCommunity={getCommunity} formatTime={formatTime} aiPanel={aiPanel} />
            ))}
            {filteredPosts.length === 0 && <div className="text-center py-16 text-slate-400"><Users className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="font-medium">No posts yet</p><button onClick={() => setShowCompose(true)} className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white text-sm font-semibold hover:shadow-lg transition-all">Create First Post</button></div>}
          </div>
        )}

        {/* LEADERBOARD */}
        {view === 'leaderboard' && (
          <div className="max-w-2xl mx-auto px-4 py-6">
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2"><Trophy className="w-6 h-6 text-amber-500" /> Weekly Leaderboard</h2>
            <div className="space-y-3">
              {[{ rank:1, name:"Ciarán O'Brien", avatar:'🧑‍💻', xp:2840, level:'Expert', badge:'🏆' },{ rank:2, name:'Ms. Patricia Ryan', avatar:'👩‍🏫', xp:2610, level:'Master', badge:'👩‍🏫' },{ rank:3, name:'Aoife Murphy', avatar:'👩‍🎓', xp:1920, level:'Scholar', badge:'⭐' },{ rank:4, name:'Fionn Gallagher', avatar:'👨‍💻', xp:1540, level:'Scholar', badge:'🔥' },{ rank:5, name:'You', avatar:'🧑‍🎓', xp:user.xp, level:user.level, badge:'🌱', isYou:true }].map((e:any) => (
                <div key={e.rank} className={cn('flex items-center gap-4 p-4 rounded-2xl border', e.isYou ? 'border-primary-400 bg-primary-50 dark:bg-primary-950/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800')}>
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-sm shrink-0', e.rank===1?'bg-amber-400 text-white':e.rank===2?'bg-slate-300 text-slate-700':e.rank===3?'bg-amber-600 text-white':'bg-slate-100 dark:bg-slate-700 text-slate-500')}>{e.rank}</div>
                  <span className="text-2xl">{e.avatar}</span>
                  <div className="flex-1"><div className="font-semibold text-slate-900 dark:text-white text-sm">{e.name}{e.isYou&&<span className="text-xs text-primary-500 ml-1">(you)</span>}</div><div className={cn('text-xs', LEVEL_COLORS[e.level as keyof typeof LEVEL_COLORS])}>{e.level}</div></div>
                  <div className="text-right"><div className="font-display font-bold text-slate-900 dark:text-white">{e.xp.toLocaleString()}</div><div className="text-xs text-slate-400">XP</div></div>
                  <span className="text-xl">{e.badge}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PROFILE */}
        {view === 'profile' && (
          <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-600 text-white shadow-xl">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl shrink-0">{user.avatar}</div>
                <div className="flex-1"><h2 className="font-display text-2xl font-bold">{user.name}</h2><p className="text-white/80 text-sm">{user.bio}</p><div className="flex gap-4 text-xs text-white/70 mt-1">{user.school&&<span>🏫 {user.school}</span>}{user.county&&<span>📍 {user.county}</span>}<span>📅 {user.year}</span></div></div>
              </div>
              <div className="grid grid-cols-4 gap-3 pt-4 border-t border-white/20">
                {[['Posts',user.postsCount],['Followers',user.followers],['Following',user.following],['Bloom',user.bloomScore]].map(([l,v])=><div key={l as string} className="text-center"><div className="font-display font-bold text-xl">{v}</div><div className="text-white/70 text-xs">{l}</div></div>)}
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2"><span className={cn('font-semibold', LEVEL_COLORS[user.level as UserLevel] || 'text-slate-600')}>{user.level}</span><span className="text-sm text-slate-500">{user.xp} XP</span></div>
              <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden"><div className="h-full bg-gradient-to-r from-primary-500 to-accent-500" style={{ width:`${(user.xp%XP_PER_LEVEL)/XP_PER_LEVEL*100}%` }} /></div>
              <div className="text-xs text-slate-400 mt-1">{XP_PER_LEVEL-(user.xp%XP_PER_LEVEL)} XP to next level</div>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">🏅 Badges</h3>
              <div className="flex flex-wrap gap-2">{user.badges.map((b: BadgeType)=><div key={b} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800 text-xs"><span>{BADGE_INFO[b].emoji}</span><span className="text-primary-700 dark:text-primary-400 font-medium">{BADGE_INFO[b].label}</span></div>)}</div>
            </div>
          </div>
        )}

        {/* GUIDELINES */}
        {view === 'guidelines' && (
          <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2"><Shield className="w-6 h-6 text-primary-500" /> Community Guidelines</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Bloom Community exists to help every Irish student succeed. Keep it safe, kind, and educational.</p>
              {[['✅ Be helpful and kind','Support fellow students. Share your knowledge generously. Constructive criticism only.'],['📚 Keep it educational','Posts should be relevant to study, exams, or student life. No off-topic spam.'],['🚫 No cheating or academic dishonesty','Do not share answers to live assessments or promote dishonest practices.'],['🔒 Protect privacy','Do not share personal information about yourself or others.'],['🛡️ Report, don\'t engage','If you see inappropriate content, use the Report button. Our AI moderation team reviews all reports within 24 hours.'],['⚖️ Consequences','Violations may result in post removal, temporary suspension, or permanent ban depending on severity.']].map(([title, desc]) => (
                <div key={title as string} className="mb-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{desc}</p>
                </div>
              ))}
              <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800 mt-4">
                <p className="text-xs text-primary-700 dark:text-primary-400">🤖 <strong>AI Moderation:</strong> All posts are automatically scanned by Bloom AI for inappropriate content, spam, and harmful material before appearing in feeds.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANEL — AI results */}
      {aiPanel && (
        <div className="w-80 shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 text-sm"><Sparkles className="w-4 h-4 text-primary-500" /> Bloom AI</span>
            <button onClick={() => setAiPanel(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-4 h-4" /></button>
          </div>
          <div className="p-4">
            {aiPanel.loading ? <div className="flex gap-1 py-4">{[0,1,2].map(i=><div key={i} className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{animationDelay:`${i*150}ms`}}/>)}</div>
            : <div className="text-sm"><MarkdownRenderer content={aiPanel.result} /></div>}
          </div>
        </div>
      )}

      {/* COMPOSE MODAL */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">Create Post</h2>
              <button onClick={() => setShowCompose(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Type tabs */}
              <div className="flex gap-2 flex-wrap">
                {([['text','💬 Text'],['poll','📊 Poll'],['link','🔗 Link'],['image','🖼️ Image']] as [ComposeTab, string][]).map(([t, label]) => (
                  <button key={t} onClick={() => setComposeTab(t)} className={cn('px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all', composeTab === t ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary-300')}>{label}</button>
                ))}
              </div>
              {/* Community */}
              <select value={composeCommunity} onChange={e => setComposeCommunity(e.target.value)} className="input text-sm">
                <option value="">Choose community...</option>
                <optgroup label="Junior Cycle">{JC_COMMUNITIES.map(c=><option key={c.key} value={c.key}>{c.emoji} {c.name}</option>)}</optgroup>
                <optgroup label="Leaving Cert">{LC_COMMUNITIES.map(c=><option key={c.key} value={c.key}>{c.emoji} {c.name}</option>)}</optgroup>
              </select>
              {/* Title */}
              <input value={composeTitle} onChange={e => setComposeTitle(e.target.value)} placeholder={composeTab === 'poll' ? 'Poll question...' : 'Post title or question...'} className="input text-sm" />
              {/* Content */}
              {composeTab === 'text' && <textarea value={composeContent} onChange={e => setComposeContent(e.target.value)} rows={5} placeholder="Share your knowledge, tip, or question. Markdown supported..." className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-primary-500 focus:outline-none resize-none text-sm" />}
              {composeTab === 'poll' && <div className="space-y-2">{pollOptions.map((o,i)=><input key={i} value={o} onChange={e=>{const n=[...pollOptions];n[i]=e.target.value;setPollOptions(n)}} placeholder={`Option ${i+1}`} className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-primary-500 focus:outline-none text-sm" />)}{pollOptions.length < 4 && <button onClick={()=>setPollOptions([...pollOptions,''])} className="text-sm text-primary-600 dark:text-primary-400 hover:underline">+ Add option</button>}</div>}
              {composeTab === 'link' && <input value={composeLinkUrl} onChange={e => setComposeLinkUrl(e.target.value)} placeholder="https://..." className="input text-sm" />}
              {composeTab === 'image' && (
                <div>
                  <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleImageUpload} />
                  <button onClick={() => fileInputRef.current?.click()} className="w-full py-8 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary-400 text-slate-500 hover:text-primary-500 transition-colors flex flex-col items-center gap-2 text-sm">
                    <ImageIcon className="w-8 h-8" />{composeImageUrl ? '✓ Image uploaded' : 'Click to upload image or PDF'}
                  </button>
                  {composeImageUrl && composeImageUrl.startsWith('data:image') && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={composeImageUrl} alt="preview" className="mt-2 rounded-xl max-h-40 object-cover w-full" />
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-3 p-5 pt-0">
              <button onClick={handlePost} disabled={isPosting || !composeTitle.trim() || !composeCommunity} className={cn('flex-1 py-3 rounded-xl font-semibold text-white transition-all', isPosting || !composeTitle.trim() || !composeCommunity ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed' : 'bg-gradient-to-r from-primary-600 to-accent-500 hover:shadow-lg')}>{isPosting ? 'Posting...' : 'Post'}</button>
              <button onClick={() => setShowCompose(false)} className="px-5 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── PostCard ───────────────────────────────────────────────────────────────
function PostCard({ post, bookmarked, comments, expanded, onToggleExpand, onReact, onBookmark, onVotePoll, onReport, onAIAction, onAddComment, getCommunity, formatTime, aiPanel }: {
  post: CommunityPost; bookmarked: boolean; comments: CommunityComment[]
  expanded: boolean; onToggleExpand: () => void
  onReact: (id: string, r: Reaction) => void
  onBookmark: (id: string) => void
  onVotePoll: (id: string, i: number) => void
  onReport: (id: string) => void
  onAIAction: (post: CommunityPost, action: string) => void
  onAddComment: (postId: string, text: string, parentId?: string) => void
  getCommunity: (key: string) => any
  formatTime: (iso: string) => string
  aiPanel: any
}) {
  const [commentText, setCommentText] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [showAIMenu, setShowAIMenu] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const community = getCommunity(post.community)
  const isThisAIPanel = aiPanel?.postId === post.id

  const submitComment = () => {
    if (!commentText.trim()) return
    onAddComment(post.id, commentText)
    setCommentText('')
  }

  return (
    <div className={cn('rounded-2xl border bg-white dark:bg-slate-800 transition-all hover:shadow-lg', post.pinned ? 'border-primary-300 dark:border-primary-700' : 'border-slate-200 dark:border-slate-700')}>
      {post.pinned && <div className="flex items-center gap-1.5 px-4 pt-3 text-xs text-primary-600 dark:text-primary-400 font-medium"><Pin className="w-3 h-3" /> Pinned</div>}
      <div className="p-4">
        {/* Author row - simplified for now */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-lg shrink-0">👤</div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-slate-900 dark:text-white text-sm">Student</span>
                <span className="text-xs text-slate-400">{formatTime(post.created_at)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                {community && <span>{community.emoji} {community.name}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* AI menu */}
            <div className="relative">
              <button onClick={() => setShowAIMenu(!showAIMenu)} className="p-1.5 rounded-lg text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors" title="Bloom AI"><Sparkles className="w-4 h-4" /></button>
              {showAIMenu && (
                <div className="absolute right-0 top-8 w-48 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl z-20 overflow-hidden">
                  {[['summarise','📝 Summarise'],['flashcards','🃏 Flashcards'],['quiz','❓ Generate Quiz'],['techniques','🧠 Study Techniques'],['resources','📚 Related Resources']].map(([a, l]) => (
                    <button key={a} onClick={() => { onAIAction(post, a); setShowAIMenu(false) }} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">{l}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <button onClick={() => setShowMore(!showMore)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
              {showMore && (
                <div className="absolute right-0 top-8 w-40 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl z-20 overflow-hidden">
                  <button onClick={() => { onReport(post.id); setShowMore(false) }} className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-2"><Flag className="w-3.5 h-3.5" /> Report</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <h3 className="font-semibold text-slate-900 dark:text-white mb-2 leading-snug">{post.title}</h3>
        {post.content && (
          <div className={cn('text-sm text-slate-700 dark:text-slate-300', !expanded && post.content.length > 280 && 'line-clamp-3')}>
            <MarkdownRenderer content={post.content || ''} />
          </div>
        )}
        {post.content && post.content.length > 280 && <button onClick={onToggleExpand} className="text-xs text-primary-600 dark:text-primary-400 mt-1 hover:underline">{expanded ? 'Show less' : 'Read more'}</button>}

        {/* Image */}
        {post.image_url && post.image_url.startsWith('data:image') && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.image_url} alt="post image" className="mt-3 rounded-xl max-h-96 object-cover w-full" />
        )}

        {/* Link */}
        {post.link_url && (
          <a href={post.link_url} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary-400 transition-colors">
            <LinkIcon className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600 dark:text-slate-300 truncate">{post.link_url}</span>
          </a>
        )}

        {/* Poll */}
        {post.poll && (
          <div className="mt-3 space-y-2">
            {post.poll.options?.map((opt: any, i: number) => (
              <div key={i} className="relative">
                <button
                  onClick={() => onVotePoll(post.id, i)}
                  disabled={post.poll.userVoted !== undefined}
                  className={cn('w-full text-left px-4 py-2.5 rounded-xl border-2 transition-all text-sm', post.poll.userVoted === i ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30' : 'border-slate-200 dark:border-slate-700 hover:border-primary-300 disabled:opacity-50')}
                >
                  <div className="flex justify-between">
                    <span>{opt.text}</span>
                    <span className="text-slate-500">{post.poll.totalVotes > 0 ? Math.round((opt.votes / post.poll.totalVotes) * 100) : 0}%</span>
                  </div>
                  {post.poll.totalVotes > 0 && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="h-full bg-primary-100 dark:bg-primary-950/20 rounded-lg" style={{ width: `${(opt.votes / post.poll.totalVotes) * 100}%` }} />
                    </div>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Reactions */}
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          {Object.entries(REACTION_INFO).map(([key, info]) => (
            <button
              key={key}
              onClick={() => onReact(post.id, key as Reaction)}
              className={cn('flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all', post.user_reaction === key ? 'bg-primary-100 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700')}
            >
              <span>{info.emoji}</span>
              <span>{post.reactions[key as keyof typeof post.reactions]}</span>
            </button>
          ))}
          <button onClick={() => onBookmark(post.id)} className={cn('flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ml-auto', bookmarked ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700')}>
            <Bookmark className={cn('w-4 h-4', bookmarked && 'fill-current')} />
          </button>
          <button onClick={onToggleExpand} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
            <MessageCircle className="w-4 h-4" />
            <span>{post.comments_count}</span>
          </button>
        </div>

        {/* Comments */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <div className="space-y-3 mb-3">
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-2 text-sm">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xs shrink-0">👤</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 dark:text-white">Student</span>
                      <span className="text-xs text-slate-400">{formatTime(comment.created_at)}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mt-0.5">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:border-primary-500 focus:outline-none"
              />
              <button onClick={submitComment} disabled={!commentText.trim()} className="px-4 py-2 rounded-xl bg-primary-500 text-white text-sm font-medium disabled:opacity-50">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

