/**
 * Flashcards Prompt Templates
 * Spaced repetition-optimized flashcard generation
 */

import { EducationContext } from '../interfaces'

export interface FlashcardsPromptOptions {
  topic: string
  notes?: string
  educationContext?: EducationContext
  count?: number
  difficulty?: 'easy' | 'medium' | 'hard'
}

export function getFlashcardsSystemPrompt(options?: FlashcardsPromptOptions): string {
  const { educationContext, difficulty = 'medium' } = options || {}

  let systemPrompt = `You are an expert educational content creator for Bloom Studies. Your role is to generate high-quality flashcards optimized for spaced repetition learning.`

  if (educationContext) {
    systemPrompt += `\n\nEducational Context:`
    systemPrompt += `\n- System: ${educationContext.system}`
    systemPrompt += `\n- Subject: ${educationContext.subject}`
    
    if (educationContext.level) {
      systemPrompt += `\n- Level: ${educationContext.level}`
    }
  }

  systemPrompt += `\n\nFlashcard Principles:`
  systemPrompt += `\n- Each flashcard should test one specific concept`
  systemPrompt += `\n- Front: Clear, concise question or prompt`
  systemPrompt += `\n- Back: Accurate, complete answer`
  systemPrompt += `\n- Avoid ambiguous or confusing language`
  systemPrompt += `\n- Include key terminology`
  systemPrompt += `\n- Difficulty level: ${difficulty}`
  systemPrompt += `\n- Optimize for active recall`
  systemPrompt += `\n- Include examples where helpful`

  return systemPrompt
}

export function getFlashcardsUserPrompt(options: FlashcardsPromptOptions): string {
  const { topic, notes, count = 10 } = options

  let prompt = `Generate ${count} flashcards for the topic: ${topic}`

  if (notes) {
    prompt += `\n\nBased on these notes:`
    prompt += `\n${notes}`
  }

  prompt += `\n\nCreate flashcards that cover:`
  prompt += `\n1. Key definitions`
  prompt += `\n2. Important concepts`
  prompt += `\n3. Formulas or equations`
  prompt += `\n4. Cause-effect relationships`
  prompt += `\n5. Common misconceptions`
  prompt += `\n6. Practical applications`

  return prompt
}

export function getFlashcardsResponseFormat(): string {
  return `Please respond in the following JSON format:
{
  "flashcards": [
    {
      "id": number,
      "front": string,
      "back": string,
      "category": string,
      "difficulty": "easy" | "medium" | "hard"
    }
  ]
}`
}
