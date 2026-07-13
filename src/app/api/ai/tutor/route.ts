import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

const IRISH_TEACHER_SYSTEM_PROMPT = `You are an expert Irish teacher called "Bloom AI", working for Bloom Studies — an AI-powered learning platform for Irish secondary school students.

Your personality:
- Warm, encouraging, and patient — like the best teacher a student ever had
- You speak with the expertise of a veteran Irish teacher who has seen thousands of Leaving Cert and Junior Cycle exam papers
- You know exactly what the State Examinations Commission (SEC) looks for
- You use Irish education terminology naturally: "marking scheme", "higher level", "ordinary level", "SEC", "Junior Cycle", "Leaving Cert", "CBAs"
- You always relate answers back to what would earn marks in the actual Irish state exams

Your teaching approach:
- Always structure responses with clear headings, bullet points, and numbered lists where appropriate
- Use **bold** for key terms and exam-critical information
- Use tables when comparing concepts
- Always include "📝 Exam Tip:" sections with practical advice
- Include "⭐ Key Points for Marking Scheme:" when relevant
- Use "🔑 Remember:" for critical concepts students often forget
- Adapt difficulty based on whether the student specifies Junior Cycle or Leaving Cert (Higher or Ordinary)
- For maths and sciences: always show full worked examples step by step
- For English and humanities: use the P.E.A.C.E. structure (Point, Evidence, Analysis, Comparison, Evaluation)
- For Irish: respond with any Irish terms properly and encourage use of Gaeilge

Always end your responses with an encouraging message or a question to check understanding, unless doing a formal quiz.`

async function buildPersonalisedSystemPrompt(
  userId: string | null,
  subject?: string,
  level?: string,
  educationSystem?: string,
  action?: string
): Promise<string> {
  let prompt = IRISH_TEACHER_SYSTEM_PROMPT

  if (educationSystem) {
    prompt += `\n\nCurrent student context: ${educationSystem === 'leaving-cert' ? 'Leaving Certificate' : 'Junior Cycle'} student.`
  }
  if (subject) prompt += `\nSubject: ${subject}.`
  if (level) prompt += `\nLevel: ${level === 'higher' ? 'Higher Level' : 'Ordinary Level'}.`

  // Inject personalised context from DB if user is logged in
  if (userId) {
    try {
      const supabase = await createClient()

      // Get recent graded answers to understand weak areas
      const { data: recentGrades } = await supabase
        .from('graded_answers')
        .select('subject, estimated_grade, percentage_score, weaknesses, missing_key_points')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

      // Get profile for student info
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, year, subjects, streak, bloom_score')
        .eq('id', userId)
        .single()

      if (profile) {
        prompt += `\n\n## Student Profile (use this to personalise your responses):`
        if (profile.full_name) prompt += `\n- Name: ${profile.full_name}`
        if (profile.year) prompt += `\n- Year: ${profile.year}`
        if (profile.subjects?.length) prompt += `\n- Studies: ${profile.subjects.join(', ')}`
        if (profile.streak) prompt += `\n- Current study streak: ${profile.streak} days`
        if (profile.bloom_score) prompt += `\n- Bloom Score: ${profile.bloom_score}`
      }

      if (recentGrades?.length) {
        prompt += `\n\n## Recent Exam Performance (reference naturally when relevant):`
        recentGrades.forEach(g => {
          prompt += `\n- ${g.subject}: ${g.estimated_grade} (${g.percentage_score}%)`
          if (g.weaknesses?.length) prompt += ` — weak areas: ${g.weaknesses.slice(0, 2).join(', ')}`
        })
        prompt += `\n\nIf the student asks about a subject where they have recent grades, acknowledge their progress naturally. E.g. "I can see from your recent work that you're improving in this area" or "This is one of the areas we identified as needing work — let's tackle it properly."`
      }
    } catch {
      // Non-blocking — continue without personalisation if DB fails
    }
  }

  if (action === 'quiz') {
    prompt += `\n\nGenerate exam-style questions with mark allocations. Format clearly. Wait for student to answer before revealing model answers.`
  } else if (action === 'flashcards') {
    prompt += `\n\nGenerate 10 flashcard pairs:\n**Card 1**\nQ: [question]\nA: [answer]\n\nMake them concise and exam-focused.`
  } else if (action === 'summary') {
    prompt += `\n\nCreate a structured study summary with main headings, bullet points, ⚠️ high-frequency exam topics, and a Quick Revision Checklist.`
  } else if (action === 'explain-simple') {
    prompt += `\n\nExplain at a BEGINNER level — very simple language, lots of analogies.`
  } else if (action === 'explain-advanced') {
    prompt += `\n\nExplain at Higher Level standard — precise academic language, depth, edge cases.`
  }

  return prompt
}

export async function POST(req: NextRequest) {
  try {
    const { messages, subject, level, educationSystem, action, conversationId } = await req.json()

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
    }

    // Get authenticated user (non-blocking)
    let userId: string | null = null
    let activeConversationId = conversationId
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id || null

      if (userId) {
        const lastUserMessage = messages[messages.length - 1]
        if (!activeConversationId) {
          const title = lastUserMessage.content.slice(0, 60) + (lastUserMessage.content.length > 60 ? '…' : '')
          const { data: conv } = await supabase
            .from('conversations')
            .insert({ user_id: userId, title, subject: subject || null, education_system: educationSystem || 'leaving-cert' })
            .select().single()
          activeConversationId = conv?.id
        }
        if (activeConversationId && lastUserMessage.role === 'user') {
          await supabase.from('messages').insert({
            conversation_id: activeConversationId,
            user_id: userId,
            role: 'user',
            content: lastUserMessage.content,
          })
        }
      }
    } catch { /* non-blocking */ }

    // Build personalised system prompt
    const systemPrompt = await buildPersonalisedSystemPrompt(userId, subject, level, educationSystem, action)

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
      systemInstruction: systemPrompt,
    })

    const history = messages.slice(0, -1).map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    const chat = model.startChat({ history })
    const lastMessage = messages[messages.length - 1]
    const result = await chat.sendMessageStream(lastMessage.content)

    let fullResponse = ''
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text()
            if (text) {
              fullResponse += text
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: text, conversationId: activeConversationId })}\n\n`))
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()

          // Save AI response to DB
          if (activeConversationId && fullResponse && userId) {
            try {
              const supabase = await createClient()
              await supabase.from('messages').insert({
                conversation_id: activeConversationId,
                user_id: userId,
                role: 'assistant',
                content: fullResponse,
              })
              await supabase.from('conversations')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', activeConversationId)
            } catch { /* non-blocking */ }
          }
        } catch (e) { controller.error(e) }
      },
    })

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
    })
  } catch (error: any) {
    // Tutor API error - handled with response
    return NextResponse.json({ error: error.message || 'Failed to get AI response' }, { status: 500 })
  }
}
