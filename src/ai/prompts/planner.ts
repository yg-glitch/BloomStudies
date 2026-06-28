/**
 * Study Planner Prompt Templates
 * Personalized study plan generation
 */

import { EducationContext } from '../interfaces'

export interface PlannerPromptOptions {
  subjects: string[]
  examDate?: Date
  availableHoursPerDay?: number
  weakAreas?: string[]
  educationContext?: EducationContext
  goals?: string[]
}

export function getPlannerSystemPrompt(options?: PlannerPromptOptions): string {
  const { educationContext } = options || {}

  let systemPrompt = `You are an expert study planner for Bloom Studies. Your role is to create personalized, effective study schedules that maximize learning outcomes.`

  if (educationContext) {
    systemPrompt += `\n\nEducational Context:`
    systemPrompt += `\n- System: ${educationContext.system}`
    systemPrompt += `\n- Subject: ${educationContext.subject}`
    
    if (educationContext.level) {
      systemPrompt += `\n- Level: ${educationContext.level}`
    }
  }

  systemPrompt += `\n\nPlanning Principles:`
  systemPrompt += `\n- Balance workload across subjects`
  systemPrompt += `\n- Include regular breaks`
  systemPrompt += `\n- Prioritize weak areas`
  systemPrompt += `\n- Allow for review sessions`
  systemPrompt += `\n- Be realistic about time constraints`
  systemPrompt += `\n- Include variety in study methods`
  systemPrompt += `\n- Align with exam timing`
  systemPrompt += `\n- Build in flexibility for adjustments`

  return systemPrompt
}

export function getPlannerUserPrompt(options: PlannerPromptOptions): string {
  const { subjects, examDate, availableHoursPerDay = 4, weakAreas, goals } = options

  let prompt = `Create a personalized study plan.`

  prompt += `\n\nSubjects: ${subjects.join(', ')}`
  prompt += `\nAvailable study hours per day: ${availableHoursPerDay}`

  if (examDate) {
    const daysUntilExam = Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    prompt += `\nDays until exam: ${daysUntilExam}`
    prompt += `\nExam date: ${examDate.toDateString()}`
  }

  if (weakAreas && weakAreas.length > 0) {
    prompt += `\nWeak areas to focus on: ${weakAreas.join(', ')}`
  }

  if (goals && goals.length > 0) {
    prompt += `\nStudent goals: ${goals.join(', ')}`
  }

  prompt += `\n\nPlease provide:`
  prompt += `\n1. A weekly study schedule`
  prompt += `\n2. Daily breakdown with time allocations`
  prompt += `\n3. Focus areas for each study session`
  prompt += `\n4. Review schedule`
  prompt += `\n5. Milestone checkpoints`
  prompt += `\n6. Tips for staying on track`

  return prompt
}

export function getPlannerResponseFormat(): string {
  return `Please respond in the following JSON format:
{
  "weeklySchedule": {
    "monday": [{ "time": string, "subject": string, "topic": string, "duration": number }],
    "tuesday": [...],
    ...
  },
  "milestones": [
    { "date": string, "goal": string, "subjects": string[] }
  ],
  "recommendations": string[]
}`
}
