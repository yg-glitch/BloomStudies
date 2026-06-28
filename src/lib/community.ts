// Community data types and constants

export type PostType = 'text' | 'image' | 'pdf' | 'poll' | 'link' | 'flashcard' | 'quiz' | 'achievement'
export type Reaction = 'like' | 'helpful' | 'fire' | 'mindblown'
export type BadgeType = 'top_contributor' | 'helpful_student' | 'verified_tutor' | 'verified_teacher' | 'early_adopter' | 'moderator' | 'streak_7' | 'streak_30' | 'first_post'
export type UserLevel = 'Seedling' | 'Sprout' | 'Learner' | 'Scholar' | 'Expert' | 'Master' | 'Legend'

export interface CommunityUser {
  id: string
  name: string
  avatar: string // emoji or initial
  bio: string
  school?: string
  county?: string
  year: 'Junior Cycle 1' | 'Junior Cycle 2' | 'Junior Cycle 3' | '5th Year' | '6th Year' | 'Other'
  subjects: string[]
  bloomScore: number
  xp: number
  level: UserLevel
  streak: number
  followers: number
  following: number
  badges: BadgeType[]
  joinedAt: string
  postsCount: number
  savedPosts: string[]
  joinedCommunities: string[]
}

export interface Poll {
  question: string
  options: { text: string; votes: number }[]
  totalVotes: number
  endsAt?: string
  userVoted?: number
}

export interface CommunityPost {
  id: string
  authorId: string
  author: Pick<CommunityUser, 'id' | 'name' | 'avatar' | 'level' | 'badges' | 'bloomScore'>
  community: string // subject key
  type: PostType
  title: string
  content: string
  imageUrl?: string
  pdfUrl?: string
  linkUrl?: string
  linkPreview?: string
  poll?: Poll
  tags: string[]
  reactions: Record<Reaction, number>
  userReaction?: Reaction
  commentsCount: number
  bookmarked: boolean
  pinned: boolean
  createdAt: string
  aiSummary?: string
}

export interface PostComment {
  id: string
  postId: string
  authorId: string
  author: Pick<CommunityUser, 'id' | 'name' | 'avatar' | 'level' | 'badges'>
  content: string
  reactions: Record<Reaction, number>
  userReaction?: Reaction
  replies: PostComment[]
  pinned: boolean
  createdAt: string
}

export const XP_PER_LEVEL = 500
export function getLevel(xp: number): UserLevel {
  const levels: UserLevel[] = ['Seedling', 'Sprout', 'Learner', 'Scholar', 'Expert', 'Master', 'Legend']
  const idx = Math.min(Math.floor(xp / XP_PER_LEVEL), levels.length - 1)
  return levels[idx]
}

export const BADGE_INFO: Record<BadgeType, { label: string; emoji: string; description: string }> = {
  top_contributor: { label: 'Top Contributor', emoji: '🏆', description: 'Most active community member' },
  helpful_student: { label: 'Helpful Student', emoji: '🤝', description: '10+ helpful reactions received' },
  verified_tutor: { label: 'Verified Tutor', emoji: '✅', description: 'Verified grinds tutor' },
  verified_teacher: { label: 'Verified Teacher', emoji: '👩‍🏫', description: 'Verified secondary school teacher' },
  early_adopter: { label: 'Early Adopter', emoji: '🌱', description: 'Joined in the first month' },
  moderator: { label: 'Moderator', emoji: '🛡️', description: 'Community moderator' },
  streak_7: { label: '7-Day Streak', emoji: '🔥', description: '7 days in a row' },
  streak_30: { label: '30-Day Streak', emoji: '⚡', description: '30 days in a row' },
  first_post: { label: 'First Post', emoji: '✍️', description: 'Posted for the first time' },
}

export const LEVEL_COLORS: Record<UserLevel, string> = {
  Seedling: 'text-green-600 dark:text-green-400',
  Sprout: 'text-emerald-600 dark:text-emerald-400',
  Learner: 'text-blue-600 dark:text-blue-400',
  Scholar: 'text-violet-600 dark:text-violet-400',
  Expert: 'text-purple-600 dark:text-purple-400',
  Master: 'text-amber-600 dark:text-amber-400',
  Legend: 'text-rose-600 dark:text-rose-400',
}

export const JC_COMMUNITIES = [
  { key: 'jc-english', name: 'English', emoji: '📚', level: 'Junior Cycle' },
  { key: 'jc-irish', name: 'Irish', emoji: '☘️', level: 'Junior Cycle' },
  { key: 'jc-maths', name: 'Maths', emoji: '📐', level: 'Junior Cycle' },
  { key: 'jc-science', name: 'Science', emoji: '🔬', level: 'Junior Cycle' },
  { key: 'jc-history', name: 'History', emoji: '🏛️', level: 'Junior Cycle' },
  { key: 'jc-geography', name: 'Geography', emoji: '🌍', level: 'Junior Cycle' },
  { key: 'jc-business', name: 'Business Studies', emoji: '💼', level: 'Junior Cycle' },
  { key: 'jc-french', name: 'French', emoji: '🇫🇷', level: 'Junior Cycle' },
  { key: 'jc-german', name: 'German', emoji: '🇩🇪', level: 'Junior Cycle' },
  { key: 'jc-spanish', name: 'Spanish', emoji: '🇪🇸', level: 'Junior Cycle' },
  { key: 'jc-homeec', name: 'Home Economics', emoji: '🍳', level: 'Junior Cycle' },
  { key: 'jc-cspe', name: 'CSPE', emoji: '⚖️', level: 'Junior Cycle' },
  { key: 'jc-sphe', name: 'SPHE', emoji: '💚', level: 'Junior Cycle' },
  { key: 'jc-coding', name: 'Coding', emoji: '💻', level: 'Junior Cycle' },
]

export const LC_COMMUNITIES = [
  { key: 'lc-english', name: 'English', emoji: '📖', level: 'Leaving Cert' },
  { key: 'lc-irish', name: 'Irish', emoji: '☘️', level: 'Leaving Cert' },
  { key: 'lc-maths', name: 'Maths', emoji: '📐', level: 'Leaving Cert' },
  { key: 'lc-biology', name: 'Biology', emoji: '🧬', level: 'Leaving Cert' },
  { key: 'lc-chemistry', name: 'Chemistry', emoji: '⚗️', level: 'Leaving Cert' },
  { key: 'lc-physics', name: 'Physics', emoji: '⚛️', level: 'Leaving Cert' },
  { key: 'lc-agri', name: 'Agricultural Science', emoji: '🌾', level: 'Leaving Cert' },
  { key: 'lc-appliedmaths', name: 'Applied Maths', emoji: '📊', level: 'Leaving Cert' },
  { key: 'lc-accounting', name: 'Accounting', emoji: '🧾', level: 'Leaving Cert' },
  { key: 'lc-business', name: 'Business', emoji: '💼', level: 'Leaving Cert' },
  { key: 'lc-economics', name: 'Economics', emoji: '📈', level: 'Leaving Cert' },
  { key: 'lc-history', name: 'History', emoji: '🏛️', level: 'Leaving Cert' },
  { key: 'lc-geography', name: 'Geography', emoji: '🌍', level: 'Leaving Cert' },
  { key: 'lc-politics', name: 'Politics & Society', emoji: '🗳️', level: 'Leaving Cert' },
  { key: 'lc-cs', name: 'Computer Science', emoji: '💻', level: 'Leaving Cert' },
  { key: 'lc-french', name: 'French', emoji: '🇫🇷', level: 'Leaving Cert' },
  { key: 'lc-german', name: 'German', emoji: '🇩🇪', level: 'Leaving Cert' },
  { key: 'lc-spanish', name: 'Spanish', emoji: '🇪🇸', level: 'Leaving Cert' },
  { key: 'lc-homeec', name: 'Home Economics', emoji: '🍳', level: 'Leaving Cert' },
  { key: 'lc-art', name: 'Art', emoji: '🎨', level: 'Leaving Cert' },
  { key: 'lc-music', name: 'Music', emoji: '🎵', level: 'Leaving Cert' },
  { key: 'lc-construction', name: 'Construction Studies', emoji: '🏗️', level: 'Leaving Cert' },
  { key: 'lc-engineering', name: 'Engineering', emoji: '⚙️', level: 'Leaving Cert' },
  { key: 'lc-dcg', name: 'DCG', emoji: '📐', level: 'Leaving Cert' },
]

export const ALL_COMMUNITIES = [...JC_COMMUNITIES, ...LC_COMMUNITIES]

// Generate mock posts
export function generateMockPosts(community?: string): CommunityPost[] {
  const posts: CommunityPost[] = [
    {
      id: '1', authorId: 'u1',
      author: { id: 'u1', name: 'Aoife Murphy', avatar: '👩‍🎓', level: 'Scholar', badges: ['early_adopter', 'helpful_student'], bloomScore: 720 },
      community: community || 'lc-biology',
      type: 'text', title: 'Photosynthesis vs Respiration — full comparison table 🌿',
      content: `Here's my comparison table that helped me nail this topic:\n\n**Photosynthesis** — takes in CO₂, releases O₂, requires light\n**Respiration** — takes in O₂, releases CO₂, happens 24/7\n\nKey exam tip: Always mention **where** each reaction happens in the cell! Examiners love that.`,
      tags: ['biology', 'leaving-cert', 'photosynthesis'], reactions: { like: 47, helpful: 23, fire: 8, mindblown: 3 },
      commentsCount: 12, bookmarked: false, pinned: true, createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '2', authorId: 'u2',
      author: { id: 'u2', name: 'Ciarán O\'Brien', avatar: '🧑‍💻', level: 'Expert', badges: ['top_contributor', 'streak_30'], bloomScore: 890 },
      community: community || 'lc-maths',
      type: 'poll', title: 'Which Maths paper 2 topic are you most worried about?',
      content: 'Trying to figure out what to focus on for revision week. Vote below!',
      poll: { question: 'Most difficult Paper 2 topic?', options: [{ text: 'Probability & Statistics', votes: 34 }, { text: 'Trigonometry', votes: 28 }, { text: 'Co-ordinate Geometry', votes: 19 }, { text: 'Calculus', votes: 41 }], totalVotes: 122 },
      tags: ['maths', 'leaving-cert', 'paper2'], reactions: { like: 89, helpful: 12, fire: 5, mindblown: 7 },
      commentsCount: 34, bookmarked: true, pinned: false, createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: '3', authorId: 'u3',
      author: { id: 'u3', name: 'Siobhán Kelly', avatar: '👩‍🔬', level: 'Learner', badges: ['first_post'], bloomScore: 340 },
      community: community || 'lc-english',
      type: 'text', title: '🎉 Got H1 in my English mock!! Here\'s what worked',
      content: `I've been struggling with English all year but finally cracked it. My tips:\n\n1. **P.E.A.C.E. structure** for every paragraph\n2. Learn 5 quotes per poem by heart\n3. Focus on **style of language** not just plot\n4. Practice the **Unseen poem** — it's always worth 20 marks\n\nUsed Bloom AI Tutor to practise essay structures. Game changer!`,
      tags: ['english', 'h1', 'tips', 'achievement'], reactions: { like: 156, helpful: 67, fire: 43, mindblown: 12 },
      commentsCount: 28, bookmarked: false, pinned: false, createdAt: new Date(Date.now() - 14400000).toISOString(),
    },
    {
      id: '4', authorId: 'u4',
      author: { id: 'u4', name: 'Ms. Patricia Ryan', avatar: '👩‍🏫', level: 'Master', badges: ['verified_teacher', 'top_contributor'], bloomScore: 1240 },
      community: community || 'lc-chemistry',
      type: 'text', title: '📋 Complete Organic Chemistry cheat sheet — SEC approved topics',
      content: `Here's a comprehensive summary of all organic chemistry topics that appear regularly in the Leaving Cert:\n\n**Alcohols** — Primary, secondary, tertiary\n**Carboxylic Acids** — RCOOH, esterification reactions\n**Esters** — naming, formation, uses\n\n⭐ Remember: SEC marking schemes award marks for *specific key words*. Learn them!`,
      tags: ['chemistry', 'organic', 'revision', 'teacher'], reactions: { like: 234, helpful: 189, fire: 56, mindblown: 34 },
      commentsCount: 45, bookmarked: true, pinned: false, createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ]
  return posts
}

export function generateMockUser(): CommunityUser {
  return {
    id: 'current-user', name: 'You', avatar: '🧑‍🎓', bio: 'Leaving Cert student. Aiming for 550+ points.',
    school: 'Your School', county: 'Dublin', year: '6th Year',
    subjects: ['Mathematics', 'English', 'Biology', 'Chemistry', 'Irish'],
    bloomScore: 520, xp: 1240, level: 'Scholar', streak: 12,
    followers: 23, following: 41, badges: ['early_adopter', 'first_post', 'streak_7'],
    joinedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    postsCount: 7, savedPosts: [], joinedCommunities: ['lc-biology', 'lc-maths', 'lc-english', 'lc-chemistry'],
  }
}
