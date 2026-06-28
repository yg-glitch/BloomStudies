/**
 * AI Notes Prompt Templates
 * Note enhancement and organization prompts
 */

import { EducationContext } from '../interfaces'

export interface NotesPromptOptions {
  action: 'summarize' | 'simplify' | 'explain' | 'expand' | 'organize' | 'quiz'
  content: string
  educationContext?: EducationContext
  targetLength?: number
}

export function getNotesSystemPrompt(options?: NotesPromptOptions): string {
  const { educationContext } = options || {}

  let systemPrompt = `You are an expert study assistant for Bloom Studies. Your role is to help students create, organize, and enhance their study notes.`

  if (educationContext) {
    systemPrompt += `\n\nEducational Context:`
    systemPrompt += `\n- System: ${educationContext.system}`
    systemPrompt += `\n- Subject: ${educationContext.subject}`
    
    if (educationContext.level) {
      systemPrompt += `\n- Level: ${educationContext.level}`
    }
  }

  systemPrompt += `\n\nNote Principles:`
  systemPrompt += `\n- Clear and concise`
  systemPrompt += `\n- Well-structured and organized`
  systemPrompt += `\n- Include key terminology`
  systemPrompt += `\n- Use formatting for readability`
  systemPrompt += `\n- Focus on exam-relevant content`
  systemPrompt += `\n- Include examples where helpful`

  return systemPrompt
}

export function getNotesUserPrompt(options: NotesPromptOptions): string {
  const { action, content, targetLength } = options

  let prompt = `Action: ${action}`
  prompt += `\n\nContent:`
  prompt += `\n${content}`

  if (targetLength) {
    prompt += `\n\nTarget length: approximately ${targetLength} words`
  }

  switch (action) {
    case 'summarize':
      prompt += `\n Please provide a concise summary that captures the main points.`
      break
    case 'simplify':
      prompt += `\n Please rewrite this in simpler, easier-to-understand language.`
      break
    case 'explain':
      prompt += `\n Please provide detailed explanations for the concepts mentioned.`
      break
    case 'expand':
      prompt += `\n Please expand on these notes with additional details, examples, and context.`
      break
    case 'organize':
      prompt += `\n Please reorganize these notes into a clear, logical structure with headings and subheadings.`
      break
    case 'quiz':
      prompt += `\n Please generate quiz questions based on these notes to test understanding.`
      break
  }

  return prompt
}
