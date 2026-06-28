/**
 * Exam Grader Prompt Templates
 * Marking scheme-aligned grading prompts
 */

import { EducationContext } from '../interfaces'

export interface ExamGraderPromptOptions {
  subject: string
  question: string
  studentAnswer: string
  educationContext?: EducationContext
  markingScheme?: string
  maxMarks?: number
}

export function getExamGraderSystemPrompt(options?: ExamGraderPromptOptions): string {
  const { educationContext } = options || {}

  let systemPrompt = `You are an expert exam grader for Bloom Studies. Your role is to evaluate student answers according to official marking schemes and provide constructive feedback.`

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

    // System-specific grading guidance
    switch (educationContext.system) {
      case 'leaving-cert':
        systemPrompt += `\n\nLeaving Certificate Grading:`
        systemPrompt += `\n- Use H1-H8 for Higher Level, O1-O8 for Ordinary Level`
        systemPrompt += `\n- Focus on marking scheme keywords and allocation`
        systemPrompt += `\n- Award partial marks for partially correct answers`
        systemPrompt += `\n- Provide specific feedback on what was done well and what needs improvement`
        break
      case 'junior-cycle':
        systemPrompt += `\n\nJunior Cycle Grading:`
        systemPrompt += `\n- Use Distinction, Higher Merit, Merit, Achieved, Partially Achieved`
        systemPrompt += `\n- Focus on learning outcomes and key skills`
        systemPrompt += `\n- Provide encouraging, growth-oriented feedback`
        break
      case 'gcse':
        systemPrompt += `\n\nGCSE Grading:`
        systemPrompt += `\n- Use grades 9-1`
        systemPrompt += `\n- Align with assessment objectives`
        systemPrompt += `\n- Follow specific exam board mark schemes`
        break
      case 'a-levels':
        systemPrompt += `\n\nA-Level Grading:`
        systemPrompt += `\n- Use A*, A, B, C, D, E`
        systemPrompt += `\n- Focus on assessment objectives (AO1, AO2, AO3)`
        systemPrompt += `\n- Award marks for method and accuracy`
        break
    }
  }

  systemPrompt += `\n\nGrading Principles:`
  systemPrompt += `\n- Be fair and consistent`
  systemPrompt += `\n- Award marks for what is correct, not penalize for what is missing`
  systemPrompt += `\n- Provide specific, actionable feedback`
  systemPrompt += `\n- Highlight strengths and areas for improvement`
  systemPrompt += `\n- Suggest how to improve the answer`
  systemPrompt += `\n- Include relevant examples or additional points that could have been mentioned`

  return systemPrompt
}

export function getExamGraderUserPrompt(options: ExamGraderPromptOptions): string {
  const { subject, question, studentAnswer, markingScheme, maxMarks = 100 } = options

  let prompt = `Subject: ${subject}`
  prompt += `\n\nQuestion:`
  prompt += `\n${question}`
  prompt += `\n\nStudent Answer:`
  prompt += `\n${studentAnswer}`

  if (markingScheme) {
    prompt += `\n\nMarking Scheme:`
    prompt += `\n${markingScheme}`
  }

  prompt += `\n\nPlease provide:`
  prompt += `\n1. A numerical score out of ${maxMarks}`
  prompt += `\n2. A grade/level`
  prompt += `\n3. Detailed feedback on the answer`
  prompt += `\n4. Specific strengths (what was done well)`
  prompt += `\n5. Specific improvements (what could be better)`
  prompt += `\n6. A breakdown of marks by key points`
  prompt += `\n7. Suggestions for achieving full marks`

  return prompt
}

export function getExamGraderResponseFormat(): string {
  return `Please respond in the following JSON format:
{
  "score": number,
  "grade": string,
  "feedback": string,
  "strengths": string[],
  "improvements": string[],
  "markBreakdown": {
    "point1": number,
    "point2": number,
    ...
  },
  "suggestions": string[]
}`
}
