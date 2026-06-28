import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateExplanation(topic: string, subject: string, level: string = 'leaving-cert') {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are an expert tutor for ${level} students. Explain concepts clearly, concisely, and with relevant examples for exam preparation.`
      },
      {
        role: 'user',
        content: `Explain ${topic} in the context of ${subject} for exam preparation.`
      }
    ],
    max_tokens: 500,
  })

  return response.choices[0].message.content
}

export async function gradeAnswer(answer: string, question: string, subject: string, markingScheme: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are an expert examiner. Grade answers based on the provided marking scheme. Provide detailed feedback, strengths, and areas for improvement.`
      },
      {
        role: 'user',
        content: `Question: ${question}\n\nAnswer: ${answer}\n\nMarking Scheme: ${markingScheme}\n\nGrade this answer out of 100 and provide detailed feedback.`
      }
    ],
    max_tokens: 800,
  })

  return response.choices[0].message.content
}

export async function generateFlashcards(topic: string, subject: string, count: number = 10) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `Generate ${count} flashcards for ${topic} in ${subject}. Format as JSON array with "front" and "back" fields.`
      },
      {
        role: 'user',
        content: `Generate ${count} flashcards for ${topic} in ${subject}.`
      }
    ],
    max_tokens: 1000,
  })

  const content = response.choices[0].message.content
  return JSON.parse(content || '[]')
}
