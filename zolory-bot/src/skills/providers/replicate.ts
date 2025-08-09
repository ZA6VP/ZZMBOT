import { logger } from '../../utils/logger.js';

export async function callReplicate(messages: { role: 'system'|'user'|'assistant'; content: string }[], apiToken: string, model: string): Promise<string | null> {
  try {
    const prompt = messages.map(m => `${m.role.toUpperCase()}:\n${m.content}`).join('\n\n');
    const createRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Token ${apiToken}`,
      },
      body: JSON.stringify({ model, input: { prompt } }),
    } as any);
    if (!createRes.ok) {
      const t = await createRes.text();
      logger.warn('Replicate create non-OK', { status: createRes.status, t });
      return null;
    }
    const created = await createRes.json() as any;
    const id = created?.id;
    if (!id) return null;

    // poll
    let tries = 0;
    while (tries < 30) {
      const getRes = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
        headers: { authorization: `Token ${apiToken}` }
      } as any);
      if (!getRes.ok) break;
      const data = await getRes.json() as any;
      if (data.status === 'succeeded') {
        const out = data.output;
        if (Array.isArray(out)) return out.join('\n');
        if (typeof out === 'string') return out;
        return JSON.stringify(out);
      }
      if (data.status === 'failed' || data.status === 'canceled') {
        logger.warn('Replicate failed', { status: data.status });
        return null;
      }
      await new Promise(r => setTimeout(r, 1000 + tries * 200));
      tries++;
    }
    return null;
  } catch (e) {
    logger.error('Replicate error', e);
    return null;
  }
}