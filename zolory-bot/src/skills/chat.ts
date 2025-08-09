import Sentiment from 'sentiment';
import { persona, Mood } from '../config/persona.js';
import { AiClient, AiMessage } from './aiClient.js';
import { franc } from 'franc';

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

function detectLang(text: string): 'en' | 'other' {
  try {
    const code = franc(text || '', { minLength: 6 });
    return code === 'eng' ? 'en' : 'other';
  } catch {
    return 'en';
  }
}

export async function generateReply(userText: string, ctx: ChatContext): Promise<string> {
  const ai = new AiClient();

  const lang = detectLang(userText);
  const system: AiMessage = {
    role: 'system',
    content: [
      `${persona.displayName} is ${persona.age}, ${persona.gender}, ${persona.ethnicity}, ${persona.vibe}. Accent ${persona.accent}.`,
      persona.description,
      `Owner: ${ctx.ownerId}. Address users by their display name. Avoid slurs or hate speech.`,
      `Tone: ${ctx.mood}. Be concise and helpful. Use modern slang naturally (${slang.join(', ')}).`,
      `Language policy: Default to English. Only switch if the user's message is clearly not English. Current user language: ${lang}.`,
      `When writing code, always use code blocks with proper language tags.`,
    ].join('\n'),
  };

  // Special-casing some common colloquial asks
  if (/\b(play\s*roblox|wanna\s*play\s*roblox|roblox\?)\b/i.test(userText)) {
    return `I can’t hop in Roblox, but I’m down to game here. ${randomSlang()} We can run TicTacToe — say "let’s play tictactoe first to 3".`;
  }

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