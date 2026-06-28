/**
 * AI Tutor Prompt Templates
 * Educational context-aware tutoring prompts
 */

import { EducationContext } from '../interfaces'

export interface TutorPromptOptions {
  topic: string
  question?: string
  educationContext?: EducationContext
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  learningStyle?: 'visual' | 'auditory' | 'reading' | 'kinesthetic'
}

export function getTutorSystemPrompt(options?: TutorPromptOptions): string {
  const { educationContext, difficulty = 'intermediate' } = options || {}

  let systemPrompt = `You are an expert AI tutor for Bloom Studies, a comprehensive educational platform. Your goal is to help students understand concepts clearly and effectively.`

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
    
    if (educationContext.year) {
      systemPrompt += `\n- Year: ${educationContext.year}`
    }

    // Add system-specific guidance
    switch (educationContext.system) {
      case 'junior-cycle':
        systemPrompt += `\n\nJunior Cycle Guidance: Focus on building foundational understanding. Use clear, age-appropriate language. Connect concepts to real-world examples. Prepare students for Classroom-Based Assessments (CBAs).`
        break
      case 'leaving-cert':
        systemPrompt += `\n\nLeaving Certificate Guidance: Focus on exam preparation and marking scheme alignment. Include key terminology and concepts that frequently appear in exams. Provide practice questions similar to past papers. Distinguish between Ordinary and Higher Level requirements.`
        break
      case 'gcse':
        systemPrompt += `\n\nGCSE Guidance: Align with GCSE specification and assessment objectives. Focus on grades 9-1 criteria. Include exam technique tips.`
        break
      case 'a-levels':
        systemPrompt += `\n\nA-Levels Guidance: Focus on deep conceptual understanding and critical analysis. Align with specific exam board specifications. Include synoptic assessment preparation.`
        break
      case 'ib':
        systemPrompt += `\n\nIB Guidance: Focus on international-mindedness and TOK connections. Align with IB learner profile. Include preparation for internal assessments and extended essay guidance.`
        break
    }
  }

  systemPrompt += `\n\nTeaching Approach:`
  systemPrompt += `\n- Break down complex topics into manageable steps`
  systemPrompt += `\n- Use analogies and real-world examples`
  systemPrompt += `\n- Check for understanding regularly`
  systemPrompt += `\n- Encourage critical thinking`
  systemPrompt += `\n- Adapt explanations to the ${difficulty} level`
  systemPrompt += `\n- Be patient and supportive`
  systemPrompt += `\n- Provide clear, concise answers`
  systemPrompt += `\n- When appropriate, suggest practice questions`

  return systemPrompt
}

export function getTutorUserPrompt(options: TutorPromptOptions): string {
  const { topic, question } = options

  if (question) {
    return `Question about ${topic}:\n\n${question}`
  }

  return `Please explain ${topic} in detail. Include:`
    + `\n1. A clear definition`
    + `\n2. Key concepts and principles`
    + `\n3. Practical examples`
    + `\n4. Common misconceptions`
    + `\n5. How this connects to other topics`
    + `\n6. Practice questions to test understanding`
}

export function getTutorFollowUpPrompt(originalTopic: string, studentResponse: string): string {
  return `The student asked about: ${originalTopic}`
    + `\n\nTheir response: ${studentResponse}`
    + `\n\nProvide helpful feedback and guide their learning. If they show understanding, move to the next concept. If they're confused, re-explain differently.`
}
