/**
 * Anthropic AI Provider
 * Premium provider with Claude models
 */

import Anthropic from '@anthropic-ai/sdk'
import {
  AIProvider,
  AIMessage,
  AIResponse,
  AIStreamChunk,
  AIProviderConfig,
} from '../interfaces'

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic'
  private client: Anthropic | null = null
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
    if (apiKey) {
      this.client = new Anthropic({ apiKey })
    }
  }

  isAvailable(): boolean {
    return this.client !== null && this.apiKey.length > 0
  }

  getDefaultModel(): string {
    return 'claude-3-5-sonnet-20241022'
  }

  private convertMessages(messages: AIMessage[]): Anthropic.MessageParam[] {
    return messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))
  }

  async generateResponse(
    messages: AIMessage[],
    config?: Partial<AIProviderConfig>
  ): Promise<AIResponse> {
    if (!this.client || !this.isAvailable()) {
      throw new Error('Anthropic provider is not available or not configured')
    }

    try {
      const response = await this.client.messages.create({
        model: config?.model || this.getDefaultModel(),
        messages: this.convertMessages(messages),
        max_tokens: config?.maxTokens ?? 2048,
        temperature: config?.temperature ?? 0.7,
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Anthropic response is not text')
      }

      return {
        content: content.text,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        model: response.model,
        provider: this.name,
      }
    } catch (error) {
      throw new Error(`Anthropic API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async *generateStreamResponse(
    messages: AIMessage[],
    config?: Partial<AIProviderConfig>
  ): AsyncGenerator<AIStreamChunk, void, unknown> {
    if (!this.client || !this.isAvailable()) {
      throw new Error('Anthropic provider is not available or not configured')
    }

    try {
      const stream = await this.client.messages.create({
        model: config?.model || this.getDefaultModel(),
        messages: this.convertMessages(messages),
        max_tokens: config?.maxTokens ?? 2048,
        temperature: config?.temperature ?? 0.7,
        stream: true,
      })

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          yield {
            content: event.delta.text,
            done: false,
          }
        }
      }

      yield {
        content: '',
        done: true,
      }
    } catch (error) {
      throw new Error(`Anthropic streaming error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  estimateCost(promptTokens: number, completionTokens: number): number {
    // Claude 3.5 Sonnet pricing (as of 2024)
    const inputCostPerMillion = 3.0 // USD
    const outputCostPerMillion = 15.0 // USD

    const inputCost = (promptTokens / 1_000_000) * inputCostPerMillion
    const outputCost = (completionTokens / 1_000_000) * outputCostPerMillion

    return inputCost + outputCost
  }
}
