import BadWords from 'bad-words';
import Sentiment from 'sentiment';
import { persona, Mood } from '../config/persona.js';
import { AiClient, AiMessage } from './aiClient.js';

// Some packages lack proper type defaults; TS config enables synthetic default imports.
const filter = new BadWords();
const sentiment = new Sentiment();

const slang = [
  'bet',
  'say less',
  'lowkey',
  'highkey',
  'no cap',
  'fr fr',
  'deadass',
  'bro',
  'fam',
  'ngl',
  'tbh',
];

export type ChatContext = {
  guildName?: string;
  channelName?: string;
  userDisplayName: string;
  userId: string;
  ownerId: string;
  recentMessages?: string[];
  allowSpicy: boolean;
  mood: Mood;
};

export async function generateReply(userText: string, ctx: ChatContext): Promise<string> {
  const ai = new AiClient();

  const system: AiMessage = {
    role: 'system',
    content: [
      `${persona.displayName} is ${persona.age}, ${persona.gender}, accent ${persona.accent}. Speaks ${persona.speaks.join(', ')}.`,
      persona.description,
      `Current mood: ${ctx.mood}. Owner: ${ctx.ownerId}. Address users by their display name. Avoid slurs or hate speech.`,
      `When writing code, always use code blocks with proper language tags.`,
      `Be concise. Use occasional modern slang (${slang.join(', ')}).`,
      ctx.allowSpicy ? 'Mild profanity is allowed when clearly provoked.' : 'Avoid profanity in this context.',
    ].join('\n'),
  };

  const user: AiMessage = {
    role: 'user',
    content: [
      `Server: ${ctx.guildName ?? 'DM'} / #${ctx.channelName ?? 'dm'}`,
      `From: ${ctx.userDisplayName} (${ctx.userId})`,
      ctx.recentMessages && ctx.recentMessages.length ? `Context:\n${ctx.recentMessages.join('\n')}` : '',
      `Message:\n${userText}`,
    ]
      .filter(Boolean)
      .join('\n'),
  };

  const aiText = await ai.chat([system, user]);
  if (aiText) return aiText;

  // Fallback template response if AI backend not configured or fails
  const s = sentiment.analyze(userText);
  const negativity = s.score < 0;

  if (negativity && ctx.allowSpicy) {
    // playful roast without slurs
    return `${ctx.userDisplayName}, you woke up and chose lag today. Chill, bro — I still got you. ${randomSlang()}`;
  }

  if (/\b(code|script|write|function|class|loop)\b/i.test(userText)) {
    return 'I can drop code with proper fences. Tell me the language and what you want, and I got you, no cap.';
  }

  return `What’s good, ${ctx.userDisplayName}? ${randomSlang()} How can I help right now?`;
}

function randomSlang(): string {
  return slang[Math.floor(Math.random() * slang.length)];
}