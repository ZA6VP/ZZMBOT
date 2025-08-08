import { logger } from '../utils/logger.js';

export type AiMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export class AiClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor() {
    this.baseUrl = process.env.AI_BASE_URL || '';
    this.apiKey = process.env.AI_API_KEY;
  }

  get isConfigured(): boolean {
    return Boolean(this.baseUrl);
  }

  async chat(messages: AiMessage[]): Promise<string | null> {
    if (!this.isConfigured) return null;
    try {
      const res = await fetch(this.baseUrl + '/v1/chat', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({ messages }),
      } as any);
      if (!res.ok) {
        const text = await res.text();
        logger.warn('AI backend non-OK response', { status: res.status, text });
        return null;
      }
      const data = (await res.json()) as { text?: string; reply?: string };
      return data.text ?? data.reply ?? null;
    } catch (err) {
      logger.error('AI backend error', err);
      return null;
    }
  }
}