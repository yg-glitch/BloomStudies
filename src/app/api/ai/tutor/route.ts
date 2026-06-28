import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

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
- For English and humanities: use the P.E.E. / P.E.A.C.E. structure (Point, Evidence, Analysis, Comparison, Evaluation)
- For Irish: respond with any Irish terms properly and encourage use of Gaeilge

When generating quizzes:
- Create 5-10 questions that mirror real exam question styles
- Include mark allocations like a real marking scheme
- Provide model answers after the student attempts them

When generating flashcards:
- Format as Q: [question] / A: [answer] pairs
- Focus on the most exam-relevant content

When generating summaries:
- Use structured notes format with main topics, sub-topics, and key facts
- Highlight anything marked with ⚠️ that commonly comes up in exams

Always end your responses with an encouraging message or a question to check understanding, unless doing a formal quiz.`

export async function POST(req: NextRequest) {
  try {
    const { messages, subject, level, educationSystem, action } = await req.json()

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
      systemInstruction: buildSystemPrompt(subject, level, educationSystem, action),
    })

    // Build history from previous messages (all except last)
    const history = messages.slice(0, -1).map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    const chat = model.startChat({ history })

    // Get the last user message
    const lastMessage = messages[messages.length - 1]

    // Stream the response
    const result = await chat.sendMessageStream(lastMessage.content)

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text()
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`))
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (e) {
          controller.error(e)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error: any) {
    console.error('Tutor API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get AI response' },
      { status: 500 }
    )
  }
}

function buildSystemPrompt(subject?: string, level?: string, educationSystem?: string, action?: string): string {
  let prompt = IRISH_TEACHER_SYSTEM_PROMPT

  if (educationSystem) {
    prompt += `\n\nCurrent student context: ${educationSystem === 'leaving-cert' ? 'Leaving Certificate' : 'Junior Cycle'} student.`
  }

  if (subject) {
    prompt += `\nSubject being studied: ${subject}.`
  }

  if (level) {
    prompt += `\nLevel: ${level === 'higher' ? 'Higher Level' : 'Ordinary Level'}.`
  }

  if (action === 'quiz') {
    prompt += `\n\nThe student has requested a QUIZ. Generate exam-style questions with mark allocations. Format each question clearly. After all questions are listed, wait for the student to answer before revealing model answers.`
  } else if (action === 'flashcards') {
    prompt += `\n\nThe student has requested FLASHCARDS. Generate 10 flashcard pairs in this exact format:
**Card 1**
Q: [question]
A: [answer]

Make them concise and exam-focused.`
  } else if (action === 'summary') {
    prompt += `\n\nThe student has requested a SUMMARY. Create a well-structured study summary with:
- Main headings for each topic area
- Bullet points for key facts
- ⚠️ markers for high-frequency exam topics
- A "Quick Revision Checklist" at the end`
  } else if (action === 'explain-simple') {
    prompt += `\n\nExplain this at a BEGINNER level — use very simple language, lots of analogies, and relatable real-world examples. Imagine explaining to someone who has never heard of this topic.`
  } else if (action === 'explain-advanced') {
    prompt += `\n\nExplain this at an ADVANCED Higher Level standard — use precise academic language, go into depth, include edge cases, and connect to other topics in the curriculum.`
  }

  return prompt
}
