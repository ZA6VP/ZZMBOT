type ChatLine = { author: 'user' | 'bot'; text: string };

const channelIdToHistory: Map<string, ChatLine[]> = new Map();

export function pushMessage(channelId: string, author: 'user' | 'bot', text: string, limit = 8) {
  const arr = channelIdToHistory.get(channelId) ?? [];
  arr.push({ author, text });
  while (arr.length > limit) arr.shift();
  channelIdToHistory.set(channelId, arr);
}

export function getRecent(channelId: string, limit = 6): string[] {
  const arr = channelIdToHistory.get(channelId) ?? [];
  return arr.slice(-limit).map(l => `${l.author.toUpperCase()}: ${l.text}`);
}