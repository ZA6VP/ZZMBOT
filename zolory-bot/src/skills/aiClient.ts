import { logger } from '../utils/logger.js';
import { callGemini } from './providers/gemini.js';
import { callGroq } from './providers/groq.js';
import { callReplicate } from './providers/replicate.js';

export type AiMessage = { role: 'system' | 'user' | 'assistant'; content: string };

type Provider = 'custom' | 'gemini' | 'groq' | 'replicate';

export class AiClient {
  private baseUrl: string;
  private apiKey?: string;
  private provider: Provider | null;

  constructor() {
    this.baseUrl = process.env.AI_BASE_URL || '';
    this.apiKey = process.env.AI_API_KEY;
    this.provider = (process.env.AI_PROVIDER as Provider) || null;
  }

  get isConfigured(): boolean {
    return Boolean(this.baseUrl || this.provider);
  }

  async chat(messages: AiMessage[]): Promise<string | null> {
    const defaults: Provider[] = ['custom', 'groq', 'gemini', 'replicate'];
    let order: Provider[];
    if (this.provider) {
      // Keep fallbacks while prioritizing chosen provider
      order = [this.provider, ...defaults.filter(p => p !== this.provider)];
    } else {
      order = defaults;
    }

    for (const p of order) {
      const res = await this.tryProvider(p, messages);
      if (res) return res;
    }
    return null;
  }

  private async tryProvider(provider: Provider, messages: AiMessage[]): Promise<string | null> {
    try {
      if (provider === 'custom' && this.baseUrl) {
        const res = await fetch(this.baseUrl + '/v1/chat', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {}),
          },
          body: JSON.stringify({ messages }),
        } as any);
        if (!res.ok) return null;
        const data = (await res.json()) as { text?: string; reply?: string };
        return data.text ?? data.reply ?? null;
      }
      if (provider === 'groq' && process.env.GROQ_API_KEY) {
        const model = process.env.GROQ_MODEL || 'llama3-70b-8192';
        return await callGroq(messages, process.env.GROQ_API_KEY, model);
      }
      if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
        const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
        return await callGemini(messages, process.env.GEMINI_API_KEY, model);
      }
      if (provider === 'replicate' && process.env.REPLICATE_API_TOKEN) {
        const model = process.env.REPLICATE_MODEL || 'meta/meta-llama-3-8b-instruct';
        return await callReplicate(messages, process.env.REPLICATE_API_TOKEN, model);
      }
      return null;
    } catch (e) {
      logger.warn(`AI provider ${provider} failed`, e);
      return null;
    }
  }
}