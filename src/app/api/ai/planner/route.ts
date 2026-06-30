import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '')

export interface StudySession {
  id: string
  date: string        // YYYY-MM-DD
  startTime: string   // HH:MM
  endTime: string     // HH:MM
  subject: string
  topic: string
  type: 'study' | 'revision' | 'practice' | 'break' | 'catchup'
  priority: 'high' | 'medium' | 'low'
  completed: boolean
  missed: boolean
  notes: string
}

export interface ExamEntry {
  subject: string
  date: string
  level: string
  targetGrade: string
}

export interface StudyPlan {
  studentName: string
  createdAt: string
  examEntries: ExamEntry[]
  sessions: StudySession[]
  weeklyHours: number
  advice: string[]
  milestones: { date: string; description: string; subject: string }[]
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      subjects, examDates, targetPoints, studyHoursPerDay,
      sportsSchedule, workSchedule, startDate,
      educationSystem = 'leaving-cert',
    } = body

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { temperature: 0.4, maxOutputTokens: 8192 },
    })

    const today = startDate || new Date().toISOString().split('T')[0]

    const prompt = `You are an expert Irish secondary school study planner at Bloom Studies.

Create a detailed personalised study plan for an Irish student.

STUDENT INFO:
- Education System: ${educationSystem === 'leaving-cert' ? 'Leaving Certificate' : 'Junior Cycle'}
- Subjects: ${Array.isArray(subjects) ? subjects.join(', ') : subjects}
- Target Points/Grade: ${targetPoints || 'Maximum possible'}
- Study hours available per day: ${studyHoursPerDay || 3}
- Start date: ${today}
- Sports/activities schedule: ${sportsSchedule || 'None specified'}
- Work schedule: ${workSchedule || 'None specified'}

EXAM DATES:
${Array.isArray(examDates) ? examDates.map((e: any) => `- ${e.subject}: ${e.date} (${e.level || 'Higher Level'})`).join('\n') : 'Not specified'}

INSTRUCTIONS:
1. Generate study sessions for the next 4 weeks from ${today}
2. Each study session is 45-90 minutes (include 10-min breaks after each)
3. Distribute subjects fairly based on exam proximity and difficulty
4. Higher priority subjects = more frequent sessions
5. No studying on days blocked by sports/work if specified
6. Include "catchup" sessions on weekends
7. Include milestone checkpoints before each exam
8. Vary session types: study, revision, practice papers, flashcard review

Respond with ONLY valid JSON:
{
  "studentName": "Student",
  "createdAt": "${today}",
  "weeklyHours": total_weekly_study_hours,
  "advice": ["specific advice 1", "advice 2", "advice 3", "advice 4", "advice 5"],
  "milestones": [
    { "date": "YYYY-MM-DD", "description": "milestone description", "subject": "subject name" }
  ],
  "sessions": [
    {
      "id": "s1",
      "date": "YYYY-MM-DD",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "subject": "subject name",
      "topic": "specific topic to study",
      "type": "study|revision|practice|break|catchup",
      "priority": "high|medium|low",
      "completed": false,
      "missed": false,
      "notes": ""
    }
  ],
  "examEntries": ${JSON.stringify(examDates || [])}
}`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed: StudyPlan = JSON.parse(cleaned)

    // Ensure IDs are unique
    parsed.sessions = parsed.sessions.map((s, i) => ({ ...s, id: `session_${Date.now()}_${i}` }))

    return NextResponse.json(parsed)
  } catch (error: any) {
    console.error('Planner API error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate plan' }, { status: 500 })
  }
}
