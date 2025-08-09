const gifs = {
  greet: [
    'https://media.tenor.com/wk7B7rYw1lUAAAAC/wave-hey.gif',
    'https://media.tenor.com/ZxRrI80YwioAAAAC/hello-hi.gif',
    'https://media.tenor.com/7Q7wCkSRnI4AAAAC/sup-hey.gif',
  ],
  win: [
    'https://media.tenor.com/1AqrdYpJqZ4AAAAC/ez-victory.gif',
    'https://media.tenor.com/4TR2I4m2zJ8AAAAC/win-lets-go.gif',
  ],
  think: [
    'https://media.tenor.com/3g07v7dXy1cAAAAC/thinking-hard.gif',
    'https://media.tenor.com/5oTFd1VvwuAAAAAC/think-ponder.gif',
  ],
};

const lastIndex: Record<string, number> = {};

export function randomGif(category: keyof typeof gifs): string {
  const arr = gifs[category];
  if (!arr || arr.length === 0) return '';
  const key = String(category);
  const prev = lastIndex[key] ?? -1;
  let idx = Math.floor(Math.random() * arr.length);
  if (arr.length > 1 && idx === prev) idx = (idx + 1) % arr.length;
  lastIndex[key] = idx;
  return arr[idx];
}

export const Emojis = {
  laugh: '😂',
  fire: '🔥',
  salute: '🫡',
  think: '🤔',
  sleepy: '😴',
  game: '🎮',
  check: '✅',
  x: '❌',
};