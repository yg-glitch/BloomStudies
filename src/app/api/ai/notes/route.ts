import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export type NotesAction =
  | 'summarise'
  | 'explain'
  | 'key-concepts'
  | 'definitions'
  | 'revision-notes'
  | 'flashcards'
  | 'quiz'
  | 'mind-map'

const ACTION_PROMPTS: Record<NotesAction, string> = {
  summarise: `Create a concise, well-structured summary of the following content. Use clear headings, bullet points, and highlight the most important exam-relevant information. Format with markdown.`,

  explain: `Explain the following content as an experienced Irish teacher would explain it to a student. Break down complex concepts, use analogies, and make it easy to understand. Format with markdown headings and examples.`,

  'key-concepts': `Extract and explain all key concepts from the following content. For each concept:
- State the concept clearly in **bold**
- Give a one-sentence definition
- Explain why it's important for exams
- Give an example
Format as a structured list with markdown.`,

  definitions: `Extract every important definition, term, and vocabulary word from the following content. Format as:
**Term**: Definition
Group by topic where possible. Mark terms likely to appear in exams with ⭐`,

  'revision-notes': `Create comprehensive revision notes from the following content, formatted for a student preparing for Irish state exams. Include:
# Main Topic Headings
## Sub-topics
- Key facts as bullet points
- ⚠️ Common exam questions
- 📝 Marking scheme keywords in **bold**
- 🔑 Things students often forget`,

  flashcards: `Generate 15 exam-focused flashcard pairs from this content. Format exactly as:

**Card 1**
Q: [concise question]
A: [clear answer]

Focus on the most testable facts and concepts.`,

  quiz: `Generate 10 exam-style quiz questions from this content, matching the style of Irish Leaving Cert or Junior Cycle questions. Include:
- 3 short answer questions (5-10 marks each)
- 3 multiple choice questions (with 4 options each)
- 2 true/false questions
- 2 longer analysis questions (15-20 marks)

For each question include the mark allocation and model answer.`,

  'mind-map': `Create a text-based mind map of the following content using ASCII/markdown structure. Format as:

# [Central Topic]

## Branch 1: [Main Theme]
### Sub-topic 1.1
- Detail
- Detail
### Sub-topic 1.2
- Detail

## Branch 2: [Main Theme]
...

Make it comprehensive and suitable for visual learners. Include all key connections between topics.`,
}

export async function POST(req: NextRequest) {
  try {
    const { content, action, subject }: { content: string; action: NotesAction; subject?: string } = await req.json()

    if (!content?.trim()) return NextResponse.json({ error: 'No content provided' }, { status: 400 })
    if (!action) return NextResponse.json({ error: 'No action specified' }, { status: 400 })

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { temperature: 0.5, maxOutputTokens: 6144 },
      systemInstruction: `You are an expert Irish secondary school teacher at Bloom Studies. Always tailor responses for Irish state exam students${subject ? ` studying ${subject}` : ''}. Use markdown formatting. Be comprehensive but clear.`,
    })

    const prompt = `${ACTION_PROMPTS[action]}\n\n---\nCONTENT:\n${content.slice(0, 10000)}`
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    return NextResponse.json({ result: text, action })
  } catch (error: any) {
    console.error('Notes AI error:', error)
    return NextResponse.json({ error: error.message || 'Failed to process notes' }, { status: 500 })
  }
}
