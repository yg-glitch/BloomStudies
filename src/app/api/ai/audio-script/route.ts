import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '')

export interface AudioChapter {
  title: string
  startIndex: number // character index in script
  summary: string
}

export interface AudioScript {
  title: string
  subject: string
  duration: number // estimated seconds
  script: string
  chapters: AudioChapter[]
  transcript: string
}

export async function POST(req: NextRequest) {
  try {
    const { content, subject, voice = 'alloy' } = await req.json()
    if (!content?.trim()) return NextResponse.json({ error: 'No content' }, { status: 400 })

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
    })

    const prompt = `You are a professional educational podcast scriptwriter for Bloom Studies, an Irish secondary school learning platform.

Convert the following study notes into a natural, engaging educational podcast script for Irish students preparing for state exams.

Subject: ${subject || 'General'}
Notes:
${content.slice(0, 8000)}

Requirements:
- Write in a warm, conversational Irish teacher tone
- Structure as a podcast with natural speech patterns (no bullet points in the script itself)
- Include an intro, 3-6 content chapters, and an outro
- Each chapter should cover one main topic or concept
- Include exam tips naturally woven in ("This is a common Leaving Cert question...")
- Use transitions between topics ("Now let's move on to...", "Building on that...")
- Estimated speaking time: 8-15 minutes at normal pace (~130 words/minute)
- Make it genuinely engaging and educational

Respond with ONLY valid JSON in this exact format:
{
  "title": "descriptive podcast episode title",
  "subject": "${subject || 'General'}",
  "duration": estimated_seconds_as_number,
  "chapters": [
    { "title": "chapter title", "startIndex": 0, "summary": "one sentence summary" }
  ],
  "script": "The full podcast script as one continuous string. Use \\n\\n for paragraph breaks. Start with an engaging intro.",
  "transcript": "Same as script but formatted for reading display"
}`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed: AudioScript = JSON.parse(cleaned)

    // Fix chapter startIndex values to be actual positions in the script
    let searchFrom = 0
    parsed.chapters = parsed.chapters.map(ch => {
      const idx = parsed.script.indexOf(ch.title, searchFrom)
      const startIndex = idx > -1 ? idx : searchFrom
      searchFrom = startIndex + ch.title.length
      return { ...ch, startIndex }
    })

    return NextResponse.json(parsed)
  } catch (error: any) {
    console.error('Audio script error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate script' }, { status: 500 })
  }
}
