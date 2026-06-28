/**
 * OpenAI AI Provider
 * Premium provider with GPT-4 and other models
 */

import OpenAI from 'openai'
import {
  AIProvider,
  AIMessage,
  AIResponse,
  AIStreamChunk,
  AIProviderConfig,
} from '../interfaces'

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai'
  private client: OpenAI | null = null
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
    if (apiKey) {
      this.client = new OpenAI({ apiKey })
    }
  }

  isAvailable(): boolean {
    return this.client !== null && this.apiKey.length > 0
  }

  getDefaultModel(): string {
    return 'gpt-4o-mini'
  }

  private convertMessages(messages: AIMessage[]): OpenAI.Chat.ChatCompletionMessageParam[] {
    return messages.map(m => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    }))
  }

  async generateResponse(
    messages: AIMessage[],
    config?: Partial<AIProviderConfig>
  ): Promise<AIResponse> {
    if (!this.client || !this.isAvailable()) {
      throw new Error('OpenAI provider is not available or not configured')
    }

    try {
      const response = await this.client.chat.completions.create({
        model: config?.model || this.getDefaultModel(),
        messages: this.convertMessages(messages),
        temperature: config?.temperature ?? 0.7,
        max_tokens: config?.maxTokens ?? 2048,
      })

      const choice = response.choices[0]
      if (!choice?.message?.content) {
        throw new Error('No content in OpenAI response')
      }

      return {
        content: choice.message.content,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        model: response.model,
        provider: this.name,
      }
    } catch (error) {
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async *generateStreamResponse(
    messages: AIMessage[],
    config?: Partial<AIProviderConfig>
  ): AsyncGenerator<AIStreamChunk, void, unknown> {
    if (!this.client || !this.isAvailable()) {
      throw new Error('OpenAI provider is not available or not configured')
    }

    try {
      const stream = await this.client.chat.completions.create({
        model: config?.model || this.getDefaultModel(),
        messages: this.convertMessages(messages),
        temperature: config?.temperature ?? 0.7,
        max_tokens: config?.maxTokens ?? 2048,
        stream: true,
      })

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content
        if (content) {
          yield {
            content,
            done: false,
          }
        }
      }

      yield {
        content: '',
        done: true,
      }
    } catch (error) {
      throw new Error(`OpenAI streaming error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  estimateCost(promptTokens: number, completionTokens: number): number {
    // GPT-4o-mini pricing (as of 2024)
    const inputCostPerMillion = 0.15 // USD
    const outputCostPerMillion = 0.60 // USD

    const inputCost = (promptTokens / 1_000_000) * inputCostPerMillion
    const outputCost = (completionTokens / 1_000_000) * outputCostPerMillion

    return inputCost + outputCost
  }
}
