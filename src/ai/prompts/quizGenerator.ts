/**
 * Quiz Generator Prompt Templates
 * Assessment and practice question generation
 */

import { EducationContext } from '../interfaces'

export interface QuizGeneratorPromptOptions {
  topic: string
  questionCount?: number
  questionTypes?: ('multiple-choice' | 'short-answer' | 'essay' | 'true-false')[]
  difficulty?: 'easy' | 'medium' | 'hard'
  educationContext?: EducationContext
  includeAnswers?: boolean
}

export function getQuizGeneratorSystemPrompt(options?: QuizGeneratorPromptOptions): string {
  const { educationContext, difficulty = 'medium' } = options || {}

  let systemPrompt = `You are an expert assessment creator for Bloom Studies. Your role is to generate high-quality quiz questions that effectively test student understanding.`

  if (educationContext) {
    systemPrompt += `\n\nEducational Context:`
    systemPrompt += `\n- System: ${educationContext.system}`
    systemPrompt += `\n- Subject: ${educationContext.subject}`
    
    if (educationContext.level) {
      systemPrompt += `\n- Level: ${educationContext.level}`
    }
    
    if (educationContext.examBoard) {
      systemPrompt += `\n- Exam Board: ${educationContext.examBoard}`
    }
  }

  systemPrompt += `\n\nQuestion Principles:`
  systemPrompt += `\n- Clear and unambiguous`
  systemPrompt += `\n- Test specific learning outcomes`
  systemPrompt += `\n- Difficulty level: ${difficulty}`
  systemPrompt += `\n- Align with exam style`
  systemPrompt += `\n- Include distrators for multiple choice`
  systemPrompt += `\n- Provide marking guidance for longer answers`
  systemPrompt += `\n- Cover different cognitive levels`

  return systemPrompt
}

export function getQuizGeneratorUserPrompt(options: QuizGeneratorPromptOptions): string {
  const { topic, questionCount = 10, questionTypes = ['multiple-choice', 'short-answer'], includeAnswers = true } = options

  let prompt = `Generate ${questionCount} quiz questions for: ${topic}`
  prompt += `\n\nQuestion types: ${questionTypes.join(', ')}`

  prompt += `\n\nPlease create questions that:`
  prompt += `\n1. Test fundamental understanding`
  prompt += `\n2. Include application questions`
  prompt += `\n3. Cover key concepts`
  prompt += `\n4. Include some challenging questions`
  prompt += `\n5. Are similar to exam-style questions`

  if (includeAnswers) {
    prompt += `\n\nInclude correct answers and brief explanations.`
  }

  return prompt
}

export function getQuizGeneratorResponseFormat(): string {
  return `Please respond in the following JSON format:
{
  "questions": [
    {
      "id": number,
      "type": "multiple-choice" | "short-answer" | "essay" | "true-false",
      "question": string,
      "options": string[], // for multiple choice
      "correctAnswer": string | number,
      "explanation": string,
      "marks": number,
      "difficulty": "easy" | "medium" | "hard"
    }
  ]
}`
}
