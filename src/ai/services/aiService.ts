/**
 * Core AI Service
 * Provider-agnostic AI service with automatic failover
 */

import {
  AIProvider,
  AIProviderType,
  AIMessage,
  AIResponse,
  AIStreamChunk,
  AIRequestOptions,
  EducationContext,
} from '../interfaces'
import {
  GeminiProvider,
  OpenAIProvider,
  GroqProvider,
  AnthropicProvider,
  DeepSeekProvider,
} from '../providers'

// Provider priority order for failover
const PROVIDER_PRIORITY: AIProviderType[] = [
  'gemini',
  'groq',
  'openai',
  'deepseek',
  'anthropic',
]

interface ProviderInstance {
  provider: AIProvider
  type: AIProviderType
  available: boolean
}

class AIService {
  private providers: Map<AIProviderType, ProviderInstance> = new Map()
  private currentProviderIndex: number = 0
  private cache: Map<string, { response: AIResponse; timestamp: number }> = new Map()
  private rateLimits: Map<string, { count: number; resetTime: number }> = new Map()
  private defaultProvider: AIProviderType = 'gemini'

  constructor() {
    this.initializeProviders()
  }

  private initializeProviders() {
    // Initialize all providers with their API keys from environment
    const env = process.env

    this.providers.set('gemini', {
      provider: new GeminiProvider(env.GEMINI_API_KEY || env.GOOGLE_API_KEY || ''),
      type: 'gemini',
      available: !!(env.GEMINI_API_KEY || env.GOOGLE_API_KEY),
    })

    this.providers.set('openai', {
      provider: new OpenAIProvider(env.OPENAI_API_KEY || ''),
      type: 'openai',
      available: !!env.OPENAI_API_KEY,
    })

    this.providers.set('groq', {
      provider: new GroqProvider(env.GROQ_API_KEY || ''),
      type: 'groq',
      available: !!env.GROQ_API_KEY,
    })

    this.providers.set('anthropic', {
      provider: new AnthropicProvider(env.ANTHROPIC_API_KEY || ''),
      type: 'anthropic',
      available: !!env.ANTHROPIC_API_KEY,
    })

    this.providers.set('deepseek', {
      provider: new DeepSeekProvider(env.DEEPSEEK_API_KEY || ''),
      type: 'deepseek',
      available: !!env.DEEPSEEK_API_KEY,
    })

    // Set default provider from environment or use gemini
    this.defaultProvider = (env.AI_PROVIDER as AIProviderType) || 'gemini'
  }

  /**
   * Get the current provider based on priority and availability
   */
  private getProvider(): ProviderInstance | null {
    // Try default provider first
    const defaultInstance = this.providers.get(this.defaultProvider)
    if (defaultInstance?.available) {
      return defaultInstance
    }

    // Fall back to priority order
    for (const type of PROVIDER_PRIORITY) {
      const instance = this.providers.get(type)
      if (instance?.available) {
        return instance
      }
    }

    return null
  }

  /**
   * Get next available provider for failover
   */
  private getNextProvider(currentType: AIProviderType): ProviderInstance | null {
    const currentIndex = PROVIDER_PRIORITY.indexOf(currentType)
    for (let i = currentIndex + 1; i < PROVIDER_PRIORITY.length; i++) {
      const type = PROVIDER_PRIORITY[i]
      const instance = this.providers.get(type)
      if (instance?.available) {
        return instance
      }
    }
    return null
  }

  /**
   * Check rate limits
   */
  private checkRateLimit(providerType: AIProviderType): boolean {
    const now = Date.now()
    const limit = this.rateLimits.get(providerType)

    if (!limit) return true

    if (now > limit.resetTime) {
      this.rateLimits.delete(providerType)
      return true
    }

    return limit.count < 60 // 60 requests per minute
  }

  /**
   * Update rate limit
   */
  private updateRateLimit(providerType: AIProviderType) {
    const now = Date.now()
    const limit = this.rateLimits.get(providerType)

    if (!limit || now > limit.resetTime) {
      this.rateLimits.set(providerType, {
        count: 1,
        resetTime: now + 60000, // 1 minute
      })
    } else {
      limit.count++
    }
  }

  /**
   * Generate cache key
   */
  private getCacheKey(messages: AIMessage[], options?: AIRequestOptions): string {
    const content = messages.map(m => `${m.role}:${m.content}`).join('|')
    const context = options?.educationContext ? JSON.stringify(options.educationContext) : ''
    return `${content}|${context}`.slice(0, 100)
  }

  /**
   * Get cached response
   */
  private getCachedResponse(cacheKey: string): AIResponse | null {
    const cached = this.cache.get(cacheKey)
    if (!cached) return null

    // Cache expires after 1 hour
    if (Date.now() - cached.timestamp > 3600000) {
      this.cache.delete(cacheKey)
      return null
    }

    return cached.response
  }

  /**
   * Cache response
   */
  private setCachedResponse(cacheKey: string, response: AIResponse) {
    this.cache.set(cacheKey, {
      response,
      timestamp: Date.now(),
    })
  }

  /**
   * Generate AI response with automatic failover
   */
  async generateResponse(
    messages: AIMessage[],
    options?: AIRequestOptions
  ): Promise<AIResponse> {
    const enableCache = options?.enableCache !== false
    const enableRetry = options?.enableRetry !== false
    const maxRetries = options?.maxRetries || 3

    // Check cache
    if (enableCache) {
      const cacheKey = this.getCacheKey(messages, options)
      const cached = this.getCachedResponse(cacheKey)
      if (cached) return cached
    }

    let lastError: Error | null = null
    let providerInstance = this.getProvider()

    if (!providerInstance) {
      throw new Error('No AI providers available. Please configure at least one provider.')
    }

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (!providerInstance) {
        throw new Error('All providers failed or are unavailable')
      }

      // Check rate limits
      if (!this.checkRateLimit(providerInstance.type)) {
        providerInstance = this.getNextProvider(providerInstance.type)
        continue
      }

      try {
        const response = await providerInstance.provider.generateResponse(messages, options)
        this.updateRateLimit(providerInstance.type)

        // Cache response
        if (enableCache) {
          const cacheKey = this.getCacheKey(messages, options)
          this.setCachedResponse(cacheKey, response)
        }

        return response
      } catch (error) {
        lastError = error as Error
        console.error(`Provider ${providerInstance.type} failed:`, error)

        // Try next provider
        providerInstance = this.getNextProvider(providerInstance.type)
      }
    }

    throw new Error(`All AI providers failed. Last error: ${lastError?.message}`)
  }

  /**
   * Generate streaming AI response
   */
  async *generateStreamResponse(
    messages: AIMessage[],
    options?: AIRequestOptions
  ): AsyncGenerator<AIStreamChunk, void, unknown> {
    const providerInstance = this.getProvider()

    if (!providerInstance) {
      throw new Error('No AI providers available. Please configure at least one provider.')
    }

    if (!this.checkRateLimit(providerInstance.type)) {
      throw new Error('Rate limit exceeded for current provider')
    }

    try {
      this.updateRateLimit(providerInstance.type)
      yield* providerInstance.provider.generateStreamResponse(messages, options)
    } catch (error) {
      console.error(`Streaming failed for provider ${providerInstance.type}:`, error)
      throw error
    }
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): AIProviderType[] {
    const available: AIProviderType[] = []
    for (const [type, instance] of this.providers) {
      if (instance.available) {
        available.push(type)
      }
    }
    return available
  }

  /**
   * Set default provider
   */
  setDefaultProvider(provider: AIProviderType) {
    if (this.providers.has(provider)) {
      this.defaultProvider = provider
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, value]) => ({
        key,
        age: Date.now() - value.timestamp,
      })),
    }
  }
}

// Singleton instance
export const aiService = new AIService()
