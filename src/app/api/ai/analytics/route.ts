import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(req: NextRequest) {
  try {
    const { analyticsData } = await req.json()

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { temperature: 0.5, maxOutputTokens: 2048 },
    })

    const prompt = `You are an expert Irish secondary school academic advisor at Bloom Studies. Analyse this student's learning data and provide actionable recommendations.

Student Analytics Data:
${JSON.stringify(analyticsData, null, 2)}

Respond with ONLY valid JSON:
{
  "predictedPoints": <number 0-625, Leaving Cert CAO points estimate>,
  "predictedGrades": { "subject": "H1-H8 or O1-O8" },
  "weakTopics": ["topic1", "topic2", "topic3"],
  "strongTopics": ["topic1", "topic2", "topic3"],
  "consistencyScore": <0-100>,
  "recommendations": [
    { "priority": "high|medium|low", "title": "recommendation title", "description": "detailed advice", "action": "specific action to take" }
  ],
  "weeklyReport": "2-3 sentence summary of this week's performance",
  "monthlyReport": "2-3 sentence summary of this month's performance",
  "studyTip": "one personalized exam tip based on the data"
}`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return NextResponse.json(JSON.parse(cleaned))
  } catch (error: any) {
    console.error('Analytics AI error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
