export function normalize(text: string): string {
  return text.toLowerCase().replace(/[\s\n\r]+/g, ' ').trim();
}

export function clamp(text: string, max = 1900): string {
  return text.length <= max ? text : text.slice(0, max - 3) + '...';
}

export function codeBlock(language: string | undefined, code: string): string {
  const lang = language ?? '';
  return '```' + lang + '\n' + code + '\n```';
}