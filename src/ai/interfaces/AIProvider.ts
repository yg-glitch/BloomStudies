/**
 * Core AI Provider Interface
 * All AI providers must implement this interface to ensure provider independence
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model?: string
  provider: string
}

export interface AIStreamChunk {
  content: string
  done: boolean
}

export interface AIProviderConfig {
  apiKey: string
  model?: string
  temperature?: number
  maxTokens?: number
  timeout?: number
}

export interface AIProvider {
  /**
   * Provider identifier
   */
  readonly name: string

  /**
   * Generate a non-streaming response
   */
  generateResponse(
    messages: AIMessage[],
    config?: Partial<AIProviderConfig>
  ): Promise<AIResponse>

  /**
   * Generate a streaming response
   */
  generateStreamResponse(
    messages: AIMessage[],
    config?: Partial<AIProviderConfig>
  ): AsyncGenerator<AIStreamChunk, void, unknown>

  /**
   * Check if the provider is available and configured
   */
  isAvailable(): boolean

  /**
   * Get the default model for this provider
   */
  getDefaultModel(): string

  /**
   * Estimate cost for a request (in USD)
   */
  estimateCost(promptTokens: number, completionTokens: number): number
}

export type AIProviderType = 'gemini' | 'openai' | 'groq' | 'anthropic' | 'deepseek'

export interface EducationContext {
  system: 'junior-cycle' | 'leaving-cert' | 'gcse' | 'a-levels' | 'ib' | 'sat' | 'ap' | 'university'
  subject: string
  level?: 'ordinary' | 'higher' | 'foundation' | 'advanced'
  examBoard?: string
  year?: number
}

export interface AIRequestOptions extends Partial<AIProviderConfig> {
  educationContext?: EducationContext
  cacheKey?: string
  enableCache?: boolean
  enableRetry?: boolean
  maxRetries?: number
  stream?: boolean
}
