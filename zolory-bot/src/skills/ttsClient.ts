import { logger } from '../utils/logger.js';

export async function synthesizeSpeech(text: string, voice = 'male_american'): Promise<Buffer | null> {
  const base = process.env.AI_BASE_URL;
  if (!base) return null;
  try {
    const res = await fetch(base + '/v1/tts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text, voice, format: 'mp3' }),
    } as any);
    if (!res.ok) return null;
    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  } catch (e) {
    logger.warn('TTS synthesis failed', e);
    return null;
  }
}