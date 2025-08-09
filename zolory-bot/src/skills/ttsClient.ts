import { logger } from '../utils/logger.js';

export async function synthesizeSpeech(text: string, voice = process.env.TTS_VOICE || 'yn_mexican_male'): Promise<Buffer | null> {
  // 1) Try self-hosted TTS
  const base = process.env.AI_BASE_URL;
  if (base) {
    try {
      const res = await fetch(base + '/v1/tts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text, voice, format: 'mp3' }),
      } as any);
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        return Buffer.from(arrayBuf);
      }
    } catch (e) {
      logger.warn('Self TTS failed', e);
    }
  }

  // 2) Replicate fallback
  const token = process.env.REPLICATE_API_TOKEN;
  const model = process.env.REPLICATE_TTS_MODEL || 'coqui-ai/xtts';
  if (token) {
    try {
      const createRes = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Token ${token}`,
        },
        body: JSON.stringify({ model, input: { text, voice, format: 'mp3' } }),
      } as any);
      if (!createRes.ok) return null;
      const created = await createRes.json() as any;
      const id = created?.id;
      if (!id) return null;

      let tries = 0;
      while (tries < 30) {
        const getRes = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
          headers: { authorization: `Token ${token}` },
        } as any);
        if (!getRes.ok) break;
        const data = await getRes.json() as any;
        if (data.status === 'succeeded') {
          const url = Array.isArray(data.output) ? data.output[0] : data.output;
          if (typeof url === 'string') {
            const bin = await fetch(url as any);
            const ab = await bin.arrayBuffer();
            return Buffer.from(ab);
          }
          return null;
        }
        if (data.status === 'failed' || data.status === 'canceled') return null;
        await new Promise(r => setTimeout(r, 1000 + tries * 200));
        tries++;
      }
      return null;
    } catch (e) {
      logger.warn('Replicate TTS failed', e);
      return null;
    }
  }

  return null;
}