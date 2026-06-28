export type ContentType = 'video' | 'article' | 'notes' | 'guide' | 'podcast' | 'pdf' | 'flashcards' | 'quiz' | 'sample-answer' | 'marking-scheme'
export type ContentCategory = 'junior-cycle' | 'leaving-cert' | 'study-skills' | 'exam-technique' | 'cao' | 'wellbeing' | 'ai-tips'
export type CreatorType = 'teacher' | 'tutor' | 'school' | 'bloom'

export interface Creator {
  id: string; name: string; avatar: string; type: CreatorType
  bio: string; subject: string; followers: number; verified: boolean
  publishedCount: number; rating: number; school?: string
}

export interface LearnResource {
  id: string; creatorId: string; creator: Creator
  type: ContentType; title: string; description: string
  subject: string; level: 'Junior Cycle' | 'Leaving Cert' | 'Both'
  category: ContentCategory; tags: string[]
  duration?: number; wordCount?: number; views: number; likes: number
  rating: number; ratingCount: number
  thumbnailColor: string; isPremium: boolean; isFree: boolean
  publishedAt: string; bookmarked: boolean; progress?: number
  videoUrl?: string; articleContent?: string; pdfUrl?: string
}

export const CONTENT_TYPE_INFO: Record<ContentType, { label: string; emoji: string; color: string }> = {
  video: { label: 'Video', emoji: '🎬', color: 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400' },
  article: { label: 'Article', emoji: '📄', color: 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400' },
  notes: { label: 'Notes', emoji: '📝', color: 'bg-violet-100 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400' },
  guide: { label: 'Study Guide', emoji: '📚', color: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' },
  podcast: { label: 'Podcast', emoji: '🎧', color: 'bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400' },
  pdf: { label: 'PDF', emoji: '📋', color: 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400' },
  flashcards: { label: 'Flashcards', emoji: '🃏', color: 'bg-pink-100 dark:bg-pink-950/30 text-pink-700 dark:text-pink-400' },
  quiz: { label: 'Quiz', emoji: '❓', color: 'bg-cyan-100 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-400' },
  'sample-answer': { label: 'Sample Answer', emoji: '✍️', color: 'bg-teal-100 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400' },
  'marking-scheme': { label: 'Marking Scheme', emoji: '🎯', color: 'bg-indigo-100 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400' },
}

export const THUMBNAIL_GRADIENTS = [
  'from-violet-500 to-purple-600', 'from-fuchsia-500 to-pink-600',
  'from-blue-500 to-indigo-600', 'from-emerald-500 to-teal-600',
  'from-orange-500 to-red-500', 'from-cyan-500 to-blue-500',
  'from-amber-500 to-orange-600', 'from-rose-500 to-pink-600',
]

export function generateMockResources(): LearnResource[] {
  const teachers: Creator[] = [
    { id: 'c1', name: 'Ms. Patricia Ryan', avatar: '👩‍🏫', type: 'teacher', bio: 'Leaving Cert English teacher with 20 years experience. Passionate about exam technique.', subject: 'English', followers: 4230, verified: true, publishedCount: 47, rating: 4.9, school: 'St. Mary\'s Secondary' },
    { id: 'c2', name: 'Mr. Seán Walsh', avatar: '👨‍🏫', type: 'teacher', bio: 'Maths and Applied Maths teacher. Special interest in Higher Level problem solving.', subject: 'Mathematics', followers: 3180, verified: true, publishedCount: 63, rating: 4.8 },
    { id: 'c3', name: 'Dr. Aoife Ní Bhriain', avatar: '👩‍🔬', type: 'tutor', bio: 'PhD in Biochemistry. Private tutor specialising in Leaving Cert Biology and Chemistry.', subject: 'Biology', followers: 2940, verified: true, publishedCount: 38, rating: 4.9 },
    { id: 'c4', name: 'Bloom Studies', avatar: '🌸', type: 'bloom', bio: 'Official Bloom Studies content. Created and reviewed by our expert educator team.', subject: 'All Subjects', followers: 18500, verified: true, publishedCount: 124, rating: 5.0 },
  ]

  return [
    { id: 'r1', creatorId: 'c1', creator: teachers[0], type: 'video', title: 'How to Write a Perfect Leaving Cert English Essay', description: 'Step-by-step walkthrough of the essay structure that scores H1s. Includes live annotation of a top student answer.', subject: 'English', level: 'Leaving Cert', category: 'leaving-cert', tags: ['english', 'essay', 'h1'], duration: 28, views: 12400, likes: 892, rating: 4.9, ratingCount: 234, thumbnailColor: 'from-violet-500 to-purple-600', isPremium: false, isFree: true, publishedAt: new Date(Date.now() - 7 * 86400000).toISOString(), bookmarked: false, progress: 45 },
    { id: 'r2', creatorId: 'c2', creator: teachers[1], type: 'notes', title: 'Complete Calculus Notes — Higher Level Leaving Cert', description: 'All differentiation and integration topics covered with worked examples, common mistakes, and exam tips.', subject: 'Mathematics', level: 'Leaving Cert', category: 'leaving-cert', tags: ['maths', 'calculus', 'higher'], wordCount: 4200, views: 8930, likes: 674, rating: 4.8, ratingCount: 189, thumbnailColor: 'from-blue-500 to-indigo-600', isPremium: false, isFree: true, publishedAt: new Date(Date.now() - 3 * 86400000).toISOString(), bookmarked: true, progress: 0 },
    { id: 'r3', creatorId: 'c3', creator: teachers[2], type: 'guide', title: 'Cell Biology Mastery Guide — Everything for Paper 1', description: 'The definitive resource for Leaving Cert Biology Cell Biology. Covers all mandatory experiments, processes, and exam questions.', subject: 'Biology', level: 'Leaving Cert', category: 'leaving-cert', tags: ['biology', 'cells', 'revision'], wordCount: 6100, views: 7420, likes: 543, rating: 4.9, ratingCount: 156, thumbnailColor: 'from-emerald-500 to-teal-600', isPremium: false, isFree: true, publishedAt: new Date(Date.now() - 14 * 86400000).toISOString(), bookmarked: false },
    { id: 'r4', creatorId: 'c4', creator: teachers[3], type: 'article', title: '10 Study Techniques Backed by Science', description: 'Stop wasting time on ineffective study. These evidence-based techniques will transform your revision sessions.', subject: 'Study Skills', level: 'Both', category: 'study-skills', tags: ['study-skills', 'productivity', 'tips'], wordCount: 2800, views: 23100, likes: 1890, rating: 5.0, ratingCount: 467, thumbnailColor: 'from-amber-500 to-orange-600', isPremium: false, isFree: true, publishedAt: new Date(Date.now() - 2 * 86400000).toISOString(), bookmarked: false },
    { id: 'r5', creatorId: 'c1', creator: teachers[0], type: 'sample-answer', title: 'H1 Shakespeare Sample Answer — Hamlet', description: 'Full annotated H1 answer for the Hamlet single text question. Includes examiner commentary on why each paragraph scores marks.', subject: 'English', level: 'Leaving Cert', category: 'leaving-cert', tags: ['english', 'hamlet', 'sample-answer'], wordCount: 1800, views: 9870, likes: 723, rating: 4.8, ratingCount: 201, thumbnailColor: 'from-rose-500 to-pink-600', isPremium: false, isFree: true, publishedAt: new Date(Date.now() - 5 * 86400000).toISOString(), bookmarked: false },
    { id: 'r6', creatorId: 'c4', creator: teachers[3], type: 'podcast', title: 'CAO Points Guide 2025 — Everything You Need to Know', description: 'Full breakdown of how CAO points work, what points you need for popular courses, and how to maximise your CAO.', subject: 'CAO Guidance', level: 'Leaving Cert', category: 'cao', tags: ['cao', 'points', '2025'], duration: 45, views: 31200, likes: 2140, rating: 4.9, ratingCount: 589, thumbnailColor: 'from-cyan-500 to-blue-500', isPremium: false, isFree: true, publishedAt: new Date(Date.now() - 10 * 86400000).toISOString(), bookmarked: true },
  ]
}
