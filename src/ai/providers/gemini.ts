/**
 * Google Gemini AI Provider
 * Default provider for Bloom Studies (free tier available)
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  AIProvider,
  AIMessage,
  AIResponse,
  AIStreamChunk,
  AIProviderConfig,
} from '../interfaces'

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini'
  private client: GoogleGenerativeAI | null = null
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
    if (apiKey) {
      this.client = new GoogleGenerativeAI(apiKey)
    }
  }

  isAvailable(): boolean {
    return this.client !== null && this.apiKey.length > 0
  }

  getDefaultModel(): string {
    return 'gemini-2.0-flash'
  }

  private convertMessages(messages: AIMessage[]): string {
    // Gemini uses a single string for simple prompts
    // For more complex conversations, we'd use the chat API
    return messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n\n')
  }

  async generateResponse(
    messages: AIMessage[],
    config?: Partial<AIProviderConfig>
  ): Promise<AIResponse> {
    if (!this.client || !this.isAvailable()) {
      throw new Error('Gemini provider is not available or not configured')
    }

    const model = this.client.getGenerativeModel({
      model: config?.model || this.getDefaultModel(),
      generationConfig: {
        temperature: config?.temperature ?? 0.7,
        maxOutputTokens: config?.maxTokens ?? 2048,
      },
    })

    const prompt = this.convertMessages(messages)

    try {
      const result = await model.generateContent(prompt)
      const response = result.response
      const text = response.text()

      // Estimate token usage (Gemini doesn't provide exact counts)
      const estimatedTokens = Math.ceil((prompt.length + text.length) / 4)

      return {
        content: text,
        usage: {
          promptTokens: Math.ceil(prompt.length / 4),
          completionTokens: Math.ceil(text.length / 4),
          totalTokens: estimatedTokens,
        },
        model: config?.model || this.getDefaultModel(),
        provider: this.name,
      }
    } catch (error) {
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async *generateStreamResponse(
    messages: AIMessage[],
    config?: Partial<AIProviderConfig>
  ): AsyncGenerator<AIStreamChunk, void, unknown> {
    if (!this.client || !this.isAvailable()) {
      throw new Error('Gemini provider is not available or not configured')
    }

    const model = this.client.getGenerativeModel({
      model: config?.model || this.getDefaultModel(),
      generationConfig: {
        temperature: config?.temperature ?? 0.7,
        maxOutputTokens: config?.maxTokens ?? 2048,
      },
    })

    const prompt = this.convertMessages(messages)

    try {
      const result = await model.generateContentStream(prompt)

      for await (const chunk of result.stream) {
        const chunkText = chunk.text()
        if (chunkText) {
          yield {
            content: chunkText,
            done: false,
          }
        }
      }

      yield {
        content: '',
        done: true,
      }
    } catch (error) {
      throw new Error(`Gemini streaming error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  estimateCost(promptTokens: number, completionTokens: number): number {
    // Gemini 1.5 Flash pricing (as of 2024)
    // Free tier: 15 requests per minute
    // Paid tier: Very low cost
    // For estimation purposes, we'll use conservative pricing
    const inputCostPerMillion = 0.075 // USD
    const outputCostPerMillion = 0.15 // USD

    const inputCost = (promptTokens / 1_000_000) * inputCostPerMillion
    const outputCost = (completionTokens / 1_000_000) * outputCostPerMillion

    return inputCost + outputCost
  }
}
