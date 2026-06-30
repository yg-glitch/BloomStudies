import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '')

export interface Flashcard {
  id: string
  front: string
  back: string
  subject: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
}

export interface MultipleChoiceQ {
  id: string
  question: string
  options: string[]
  correct: number
  explanation: string
}

export interface TrueFalseQ {
  id: string
  statement: string
  answer: boolean
  explanation: string
}

export interface FillBlankQ {
  id: string
  sentence: string
  blanks: string[]
  hint: string
}

export interface GeneratedSet {
  title: string
  subject: string
  flashcards: Flashcard[]
  multipleChoice: MultipleChoiceQ[]
  trueFalse: TrueFalseQ[]
  fillInBlanks: FillBlankQ[]
}

export async function POST(req: NextRequest) {
  try {
    const { content, subject, count = 15 } = await req.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { temperature: 0.6, maxOutputTokens: 8192 },
    })

    const prompt = `You are an expert Irish secondary school teacher creating study materials from student notes.

Subject: ${subject || 'General'}
Content to process:
${content.slice(0, 8000)}

Generate a comprehensive study set. Respond with ONLY valid JSON matching this exact structure:
{
  "title": "descriptive title for this study set",
  "subject": "${subject || 'General'}",
  "flashcards": [
    {
      "id": "fc1",
      "front": "clear question or term",
      "back": "detailed answer or definition",
      "subject": "${subject || 'General'}",
      "difficulty": "easy|medium|hard",
      "tags": ["tag1", "tag2"]
    }
  ],
  "multipleChoice": [
    {
      "id": "mc1",
      "question": "question text",
      "options": ["A option", "B option", "C option", "D option"],
      "correct": 0,
      "explanation": "why this answer is correct"
    }
  ],
  "trueFalse": [
    {
      "id": "tf1",
      "statement": "a statement about the topic",
      "answer": true,
      "explanation": "explanation of why true or false"
    }
  ],
  "fillInBlanks": [
    {
      "id": "fb1",
      "sentence": "The ___ is responsible for ___.",
      "blanks": ["word1", "word2"],
      "hint": "helpful hint"
    }
  ]
}

Create exactly ${count} flashcards, ${Math.ceil(count * 0.6)} multiple choice questions, ${Math.ceil(count * 0.4)} true/false questions, and ${Math.ceil(count * 0.4)} fill-in-the-blank questions. Focus on exam-critical content for Irish state exams.`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed: GeneratedSet = JSON.parse(cleaned)

    // Ensure IDs are unique strings
    parsed.flashcards = parsed.flashcards.map((f, i) => ({ ...f, id: `fc_${Date.now()}_${i}` }))
    parsed.multipleChoice = parsed.multipleChoice.map((q, i) => ({ ...q, id: `mc_${Date.now()}_${i}` }))
    parsed.trueFalse = parsed.trueFalse.map((q, i) => ({ ...q, id: `tf_${Date.now()}_${i}` }))
    parsed.fillInBlanks = parsed.fillInBlanks.map((q, i) => ({ ...q, id: `fb_${Date.now()}_${i}` }))

    return NextResponse.json(parsed)
  } catch (error: any) {
    console.error('Flashcard generation error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate flashcards' }, { status: 500 })
  }
}
