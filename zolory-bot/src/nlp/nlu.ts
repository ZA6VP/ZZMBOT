import { normalize } from '../utils/strings.js';
import * as chrono from 'chrono-node';

export type Intent =
  | { name: 'moderation.ban'; target?: string; durationMs?: number; reason?: string }
  | { name: 'moderation.kick'; target?: string; reason?: string }
  | { name: 'moderation.timeout'; target?: string; durationMs?: number; reason?: string }
  | { name: 'moderation.warn'; target?: string; reason?: string }
  | { name: 'game.tictactoe.start'; rounds?: number }
  | { name: 'smalltalk.hello' }
  | { name: 'ask.roblox' }
  | { name: 'unknown' };

export function parseDurationMs(text: string): number | undefined {
  const results = chrono.parse(text, new Date(), { forwardDate: true });
  const now = Date.now();
  const first = results[0];
  if (!first) return undefined;
  const date = first.date();
  const ms = date.getTime() - now;
  return ms > 0 ? ms : undefined;
}

export function detectIntent(raw: string): Intent {
  const text = normalize(raw);

  // Games
  const gameMatch = text.match(/(play|let\'s play|lets play|wanna play)[^\n]*?(tic.?tac.?toe|tictactoe|ttt)/);
  if (gameMatch) {
    const roundsMatch = text.match(/first to (\d+)|best of (\d+)/);
    const num = roundsMatch ? Number(roundsMatch[1] || roundsMatch[2]) : undefined;
    return { name: 'game.tictactoe.start', rounds: num };
  }
  if (/(play|wanna play)[^\n]*roblox|roblox\?/.test(text)) return { name: 'ask.roblox' };

  // Moderation intents with flexible phrasing
  if (/\b(ban|swing|yeet)\b/.test(text)) {
    const durationMs = parseDurationMs(text);
    const becauseIdx = text.indexOf(' because ');
    const reason = becauseIdx >= 0 ? text.slice(becauseIdx + 9) : undefined;
    return { name: 'moderation.ban', target: extractTarget(text), durationMs, reason };
  }
  if (/\b(kick|boot)\b/.test(text)) {
    const becauseIdx = text.indexOf(' because ');
    const reason = becauseIdx >= 0 ? text.slice(becauseIdx + 9) : undefined;
    return { name: 'moderation.kick', target: extractTarget(text), reason };
  }
  if (/\b(timeout|mute|time out|time-out)\b/.test(text)) {
    const durationMs = parseDurationMs(text);
    const becauseIdx = text.indexOf(' because ');
    const reason = becauseIdx >= 0 ? text.slice(becauseIdx + 9) : undefined;
    return { name: 'moderation.timeout', target: extractTarget(text), durationMs, reason };
  }
  if (/\b(warn|warning)\b/.test(text)) {
    const becauseIdx = text.indexOf(' because ');
    const reason = becauseIdx >= 0 ? text.slice(becauseIdx + 9) : undefined;
    return { name: 'moderation.warn', target: extractTarget(text), reason };
  }

  if (/\b(hi|hey|hello|yo|yoo|sup|what\'s up|whats up)\b/.test(text)) return { name: 'smalltalk.hello' };

  return { name: 'unknown' };
}

export function extractTarget(text: string): string | undefined {
  // Prefer mentions
  const mention = text.match(/<@!?([0-9]+)>/);
  if (mention) return mention[1];
  // Try after keywords like ban/kick/warn
  const m = text.match(/(?:ban|kick|warn|timeout|mute)\s+([^\s]+(?:\s+[^\s]+){0,2})/);
  if (m) return m[1];
  return undefined;
}