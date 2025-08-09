import { logger } from '../../utils/logger.js';

export async function callGemini(messages: { role: 'system'|'user'|'assistant'; content: string }[], apiKey: string, model: string): Promise<string | null> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    // Map to Gemini contents: we'll combine system+user into a single user turn for simplicity
    const prompt = messages.map(m => `${m.role.toUpperCase()}:\n${m.content}`).join('\n\n');
    const body = { contents: [{ role: 'user', parts: [{ text: prompt }] }] } as any;
    const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } as any);
    if (!res.ok) {
      const t = await res.text();
      logger.warn('Gemini non-OK', { status: res.status, t });
      return null;
    }
    const data = await res.json() as any;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === 'string' ? text : null;
  } catch (e) {
    logger.error('Gemini error', e);
    return null;
  }
}