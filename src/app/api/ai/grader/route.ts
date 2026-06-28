import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

const GRADER_SYSTEM_PROMPT = `You are the world's most accurate AI exam grader, trained on thousands of Irish state exam marking schemes. You work for Bloom Studies.

You grade answers exactly as a Senior Examiner for the State Examinations Commission (SEC) would — fair, precise, and constructive.

CRITICAL: You MUST respond with ONLY valid JSON. No markdown, no explanations outside the JSON. Your entire response must be parseable JSON.

You must evaluate answers based on:
1. Knowledge accuracy and completeness
2. Use of subject-specific vocabulary and terminology
3. Structure and organisation of the answer
4. Critical thinking and analysis (for Higher Level)
5. Evidence and examples used
6. Alignment with marking scheme keywords

For Leaving Certificate: Use H1-H8 (Higher) or O1-O8 (Ordinary) grading
For Junior Cycle: Use Distinction / Higher Merit / Merit / Achieved / Partially Achieved / Not Achieved

Always provide a "suggestedAnswer" that shows what a full-marks answer would look like.`

export interface GraderRequest {
  subject: string
  educationSystem: 'leaving-cert' | 'junior-cycle'
  level: 'higher' | 'ordinary'
  question: string
  studentAnswer: string
  maxMarks?: number
}

export interface GraderResult {
  estimatedGrade: string
  estimatedMarks: number
  maxMarks: number
  percentageScore: number
  bloomScore: number
  examinerFeedback: string
  strengths: string[]
  weaknesses: string[]
  areasToImprove: string[]
  suggestedAnswer: string
  missingKeyPoints: string[]
  scores: {
    vocabulary: number
    structure: number
    knowledge: number
    evaluation: number
    criticalThinking: number
  }
  markingSchemeAlignment: string[]
}

export async function POST(req: NextRequest) {
  try {
    const body: GraderRequest = await req.json()
    const { subject, educationSystem, level, question, studentAnswer, maxMarks = 100 } = body

    if (!subject || !question || !studentAnswer) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
      },
      systemInstruction: GRADER_SYSTEM_PROMPT,
    })

    const prompt = buildGraderPrompt(body)

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    // Parse JSON response
    let parsed: GraderResult
    try {
      // Strip any markdown code blocks if present
      const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      // If parsing fails, return a structured error with the raw response
      console.error('Failed to parse grader response:', responseText)
      return NextResponse.json({ error: 'Failed to parse AI response', raw: responseText }, { status: 500 })
    }

    return NextResponse.json(parsed)
  } catch (error: any) {
    console.error('Grader API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to grade answer' },
      { status: 500 }
    )
  }
}

function buildGraderPrompt(req: GraderRequest): string {
  const { subject, educationSystem, level, question, studentAnswer, maxMarks = 100 } = req

  const examType = educationSystem === 'leaving-cert'
    ? `Leaving Certificate ${level === 'higher' ? 'Higher Level' : 'Ordinary Level'}`
    : 'Junior Cycle'

  return `Grade this ${examType} ${subject} exam answer.

QUESTION (${maxMarks} marks):
${question}

STUDENT ANSWER:
${studentAnswer}

Respond ONLY with this exact JSON structure (no other text):
{
  "estimatedGrade": "${educationSystem === 'leaving-cert' ? (level === 'higher' ? 'H1-H8' : 'O1-O8') : 'Distinction/Higher Merit/Merit/Achieved/Partially Achieved/Not Achieved'}",
  "estimatedMarks": <number out of ${maxMarks}>,
  "maxMarks": ${maxMarks},
  "percentageScore": <0-100>,
  "bloomScore": <0-100, overall Bloom Studies score combining all metrics>,
  "examinerFeedback": "<2-3 paragraph detailed examiner feedback as a Senior SEC examiner would write>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "areasToImprove": ["<specific actionable improvement 1>", "<improvement 2>", "<improvement 3>"],
  "suggestedAnswer": "<a full model answer that would achieve maximum marks, written as the examiner would expect>",
  "missingKeyPoints": ["<key point 1 that was missing>", "<key point 2>", "<key point 3>"],
  "scores": {
    "vocabulary": <0-100, use of subject-specific terminology>,
    "structure": <0-100, organisation and presentation>,
    "knowledge": <0-100, factual accuracy and completeness>,
    "evaluation": <0-100, quality of analysis and argument>,
    "criticalThinking": <0-100, depth of thinking and insight>
  },
  "markingSchemeAlignment": ["<marking scheme point 1 addressed>", "<point 2>", "<point 3>"]
}`
}
