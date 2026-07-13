import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

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
    const parsed = JSON.parse(cleaned)

    // Stamp unique IDs
    const ts = Date.now()
    parsed.flashcards = parsed.flashcards.map((f: any, i: number) => ({ ...f, id: `fc_${ts}_${i}` }))
    parsed.multipleChoice = parsed.multipleChoice.map((q: any, i: number) => ({ ...q, id: `mc_${ts}_${i}` }))
    parsed.trueFalse = parsed.trueFalse.map((q: any, i: number) => ({ ...q, id: `tf_${ts}_${i}` }))
    parsed.fillInBlanks = parsed.fillInBlanks.map((q: any, i: number) => ({ ...q, id: `fb_${ts}_${i}` }))

    // Save to Supabase if authenticated
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('flashcard_decks').insert({
          user_id: user.id,
          title: parsed.title,
          subject: parsed.subject,
          flashcards: parsed.flashcards.map((f: any) => ({
            ...f, mastery: 0, nextReview: new Date().toISOString(),
            reviewCount: 0, easeFactor: 2.5, interval: 1,
          })),
          multiple_choice: parsed.multipleChoice,
          true_false: parsed.trueFalse,
          fill_in_blanks: parsed.fillInBlanks,
        })
      }
    } catch { /* non-blocking */ }

    return NextResponse.json(parsed)
  } catch (error: any) {
    // Flashcard generation error - handled with response
    return NextResponse.json({ error: error.message || 'Failed to generate flashcards' }, { status: 500 })
  }
}
