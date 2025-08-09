import { logger } from '../../utils/logger.js';

export async function callGroq(messages: { role: 'system'|'user'|'assistant'; content: string }[], apiKey: string, model: string): Promise<string | null> {
  try {
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages })
    } as any);
    if (!res.ok) {
      const t = await res.text();
      logger.warn('Groq non-OK', { status: res.status, t });
      return null;
    }
    const data = await res.json() as any;
    const text = data?.choices?.[0]?.message?.content;
    return typeof text === 'string' ? text : null;
  } catch (e) {
    logger.error('Groq error', e);
    return null;
  }
}