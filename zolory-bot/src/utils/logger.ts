export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levelToPrefix: Record<LogLevel, string> = {
  debug: '[DEBUG] ',
  info: '[INFO ] ',
  warn: '[WARN ] ',
  error: '[ERROR] ',
};

function format(message: string, meta?: unknown): string {
  const ts = new Date().toISOString();
  const metaStr = typeof meta === 'undefined' ? '' : `\n  → ${JSON.stringify(meta, null, 2)}`;
  return `${ts} ${message}${metaStr}`;
}

export const logger = {
  debug: (msg: string, meta?: unknown) => console.debug(levelToPrefix.debug + format(msg, meta)),
  info: (msg: string, meta?: unknown) => console.info(levelToPrefix.info + format(msg, meta)),
  warn: (msg: string, meta?: unknown) => console.warn(levelToPrefix.warn + format(msg, meta)),
  error: (msg: string, meta?: unknown) => console.error(levelToPrefix.error + format(msg, meta)),
};