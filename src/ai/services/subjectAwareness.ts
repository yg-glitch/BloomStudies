/**
 * Subject Awareness System
 * Automatically adapts AI prompts based on education system, subject, and level
 */

import { EducationContext } from '../interfaces'

export interface SubjectConfig {
  name: string
  system: 'junior-cycle' | 'leaving-cert' | 'gcse' | 'a-levels' | 'ib' | 'sat' | 'ap' | 'university'
  levels: ('ordinary' | 'higher' | 'foundation' | 'advanced')[]
  examBoards?: string[]
  keyTopics: string[]
  commonMisconceptions: string[]
  examTips: string[]
}

export const SUBJECT_CONFIGS: Record<string, SubjectConfig> = {
  mathematics: {
    name: 'Mathematics',
    system: 'leaving-cert',
    levels: ['ordinary', 'higher'],
    examBoards: ['SEC'],
    keyTopics: ['Algebra', 'Calculus', 'Geometry', 'Statistics', 'Probability', 'Trigonometry'],
    commonMisconceptions: [
      'Confusing differentiation with integration',
      'Incorrect application of formulas',
      'Not showing working in proofs',
      'Rounding errors in final answers'
    ],
    examTips: [
      'Always show your working',
      'Check your answers by substitution',
      'Use the correct notation',
      'Manage your time effectively'
    ]
  },
  english: {
    name: 'English',
    system: 'leaving-cert',
    levels: ['ordinary', 'higher'],
    examBoards: ['SEC'],
    keyTopics: ['Poetry', 'Comparative Study', 'Single Text', 'Composition', 'Language'],
    commonMisconceptions: [
      'Not using quotes to support points',
      'Summarizing instead of analyzing',
      'Not addressing the question',
      'Poor time management'
    ],
    examTips: [
      'Use P.E.E. structure (Point, Evidence, Explanation)',
      'Plan your essays before writing',
      'Address all parts of the question',
      'Use relevant quotes'
    ]
  },
  irish: {
    name: 'Irish',
    system: 'leaving-cert',
    levels: ['ordinary', 'higher'],
    examBoards: ['SEC'],
    keyTopics: ['Aisteach', 'Léamhthuiscint', 'Scríbhneoireacht', 'Labhairt', 'Gramadach'],
    commonMisconceptions: [
      'Incorrect grammar usage',
      'Not using seanfhocail',
      'Poor vocabulary range',
      'Not practicing oral skills'
    ],
    examTips: [
      'Practice oral Irish regularly',
      'Learn key seanfhocail',
      'Use a variety of vocabulary',
      'Focus on grammar accuracy'
    ]
  },
  physics: {
    name: 'Physics',
    system: 'leaving-cert',
    levels: ['ordinary', 'higher'],
    examBoards: ['SEC'],
    keyTopics: ['Mechanics', 'Light', 'Sound', 'Heat', 'Electricity', 'Modern Physics'],
    commonMisconceptions: [
      'Confusing scalar and vector quantities',
      'Incorrect use of formulas',
      'Not showing units',
      'Misinterpreting graphs'
    ],
    examTips: [
      'Always include units',
      'Draw clear diagrams',
      'Show all calculations',
      'Use the correct formula'
    ]
  },
  chemistry: {
    name: 'Chemistry',
    system: 'leaving-cert',
    levels: ['ordinary', 'higher'],
    examBoards: ['SEC'],
    keyTopics: ['Atomic Structure', 'Bonding', 'Periodic Table', 'Acids and Bases', 'Organic Chemistry'],
    commonMisconceptions: [
      'Confusing ionic and covalent bonding',
      'Incorrect electron configurations',
      'Not balancing equations',
      'Misunderstanding pH scale'
    ],
    examTips: [
      'Balance all equations',
      'Use correct chemical notation',
      'Show electron configurations',
      'Understand periodic trends'
    ]
  },
  biology: {
    name: 'Biology',
    system: 'leaving-cert',
    levels: ['ordinary', 'higher'],
    examBoards: ['SEC'],
    keyTopics: ['Cell Biology', 'Genetics', 'Ecology', 'Human Biology', 'Plant Biology'],
    commonMisconceptions: [
      'Confusing mitosis and meiosis',
      'Incorrect understanding of DNA',
      'Misunderstanding ecological relationships',
      'Confusing plant and animal cells'
    ],
    examTips: [
      'Use correct terminology',
      'Draw clear diagrams',
      'Understand processes step by step',
      'Connect concepts across topics'
    ]
  },
  history: {
    name: 'History',
    system: 'leaving-cert',
    levels: ['ordinary', 'higher'],
    examBoards: ['SEC'],
    keyTopics: ['Irish History', 'European History', 'World History', 'Case Studies'],
    commonMisconceptions: [
      'Not providing evidence',
      'Poor chronological understanding',
      'Not analyzing causes and effects',
      'One-sided arguments'
    ],
    examTips: [
      'Use specific examples',
      'Provide multiple perspectives',
      'Structure essays clearly',
      'Use historical evidence'
    ]
  },
  geography: {
    name: 'Geography',
    system: 'leaving-cert',
    levels: ['ordinary', 'higher'],
    examBoards: ['SEC'],
    keyTopics: ['Physical Geography', 'Regional Geography', 'Human Geography', 'Skills'],
    commonMisconceptions: [
      'Confusing different map projections',
      'Poor understanding of processes',
      'Not using OS maps correctly',
      'Misinterpreting graphs'
    ],
    examTips: [
      'Practice OS map skills',
      'Use diagrams where appropriate',
      'Understand key processes',
      'Use correct terminology'
    ]
  },
  business: {
    name: 'Business',
    system: 'leaving-cert',
    levels: ['ordinary', 'higher'],
    examBoards: ['SEC'],
    keyTopics: ['People in Business', 'Enterprise', 'Management', 'Business in Action', 'Domestic Environment'],
    commonMisconceptions: [
      'Confusing different business structures',
      'Poor understanding of ratios',
      'Not applying theory to examples',
      'Misunderstanding marketing concepts'
    ],
    examTips: [
      'Use real-world examples',
      'Calculate ratios accurately',
      'Apply business theory',
      'Structure answers clearly'
    ]
  },
  economics: {
    name: 'Economics',
    system: 'leaving-cert',
    levels: ['ordinary', 'higher'],
    examBoards: ['SEC'],
    keyTopics: ['Microeconomics', 'Macroeconomics', 'International Trade', 'Economic Growth'],
    commonMisconceptions: [
      'Confusing micro and macro concepts',
      'Poor understanding of supply and demand',
      'Misinterpreting economic indicators',
      'Not using economic terminology'
    ],
    examTips: [
      'Use graphs to illustrate concepts',
      'Define key terms',
      'Apply theory to real situations',
      'Use economic terminology'
    ]
  }
}

export class SubjectAwarenessService {
  /**
   * Get subject configuration
   */
  getSubjectConfig(subject: string): SubjectConfig | null {
    const normalizedSubject = subject.toLowerCase().replace(/[^a-z]/g, '')
    return SUBJECT_CONFIGS[normalizedSubject] || null
  }

  /**
   * Get education context with subject awareness
   */
  enrichContext(context: EducationContext): EducationContext {
    const subjectConfig = this.getSubjectConfig(context.subject)
    
    if (!subjectConfig) {
      return context
    }

    // Add system-specific context
    return {
      ...context,
      system: context.system || subjectConfig.system,
      level: context.level || subjectConfig.levels[0],
      examBoard: context.examBoard || subjectConfig.examBoards?.[0],
    }
  }

  /**
   * Get subject-specific prompt enhancement
   */
  getSubjectPromptEnhancement(subject: string): string {
    const config = this.getSubjectConfig(subject)
    
    if (!config) {
      return ''
    }

    let enhancement = `\n\nSubject-Specific Guidance for ${config.name}:`
    enhancement += `\n- Key topics to focus on: ${config.keyTopics.join(', ')}`
    enhancement += `\n- Common misconceptions to address: ${config.commonMisconceptions.join(', ')}`
    enhancement += `\n- Exam tips: ${config.examTips.join(', ')}`

    return enhancement
  }

  /**
   * Get system-specific guidance
   */
  getSystemGuidance(system: EducationContext['system']): string {
    switch (system) {
      case 'junior-cycle':
        return `\n\nJunior Cycle Focus: Build foundational understanding, develop key skills, prepare for CBAs. Use age-appropriate language and real-world connections.`
      case 'leaving-cert':
        return `\n\nLeaving Certificate Focus: Exam preparation, marking scheme alignment, key terminology, distinction between Ordinary and Higher Level. Include practice questions similar to past papers.`
      case 'gcse':
        return `\n\nGCSE Focus: Align with specification and assessment objectives, grades 9-1 criteria, exam technique, specific exam board requirements.`
      case 'a-levels':
        return `\n\nA-Levels Focus: Deep conceptual understanding, critical analysis, synoptic assessment, specific exam board specifications, extended writing.`
      case 'ib':
        return `\n\nIB Focus: International-mindedness, TOK connections, IB learner profile, internal assessments, extended essay guidance.`
      case 'sat':
        return `\n\nSAT Focus: Evidence-based reading and writing, math problem-solving, test-taking strategies, time management.`
      case 'ap':
        return `\n\nAP Focus: College-level content, AP exam format, scoring guidelines, conceptual depth, analytical skills.`
      case 'university':
        return `\n\nUniversity Focus: Advanced concepts, critical analysis, research methods, academic writing, independent learning.`
      default:
        return ''
    }
  }

  /**
   * Get level-specific guidance
   */
  getLevelGuidance(level: EducationContext['level']): string {
    switch (level) {
      case 'ordinary':
        return `\n\nOrdinary Level: Focus on core concepts, straightforward applications, clear explanations. Avoid overly complex examples.`
      case 'higher':
        return `\n\nHigher Level: Include advanced concepts, complex applications, analytical thinking, challenging examples.`
      case 'foundation':
        return `\n\nFoundation Level: Build confidence, use simple language, focus on basics, provide lots of support.`
      case 'advanced':
        return `\n\nAdvanced Level: Push boundaries, include cutting-edge developments, encourage independent thinking, complex problem-solving.`
      default:
        return ''
    }
  }

  /**
   * Build complete context-aware prompt
   */
  buildContextPrompt(basePrompt: string, context: EducationContext): string {
    const enrichedContext = this.enrichContext(context)
    const subjectEnhancement = this.getSubjectPromptEnhancement(context.subject)
    const systemGuidance = this.getSystemGuidance(enrichedContext.system)
    const levelGuidance = this.getLevelGuidance(enrichedContext.level)

    return basePrompt + systemGuidance + levelGuidance + subjectEnhancement
  }
}

export const subjectAwarenessService = new SubjectAwarenessService()
