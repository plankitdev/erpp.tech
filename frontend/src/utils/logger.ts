type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDev = import.meta.env.DEV;

const levelPriority: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const minLevel: LogLevel = isDev ? 'debug' : 'error';

function shouldLog(level: LogLevel): boolean {
  return levelPriority[level] >= levelPriority[minLevel];
}

function formatMessage(level: LogLevel, context: string, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`;
}

export const logger = {
  debug(context: string, message: string, data?: unknown) {
    if (!shouldLog('debug')) return;
    console.debug(formatMessage('debug', context, message), data ?? '');
  },

  info(context: string, message: string, data?: unknown) {
    if (!shouldLog('info')) return;
    console.info(formatMessage('info', context, message), data ?? '');
  },

  warn(context: string, message: string, data?: unknown) {
    if (!shouldLog('warn')) return;
    console.warn(formatMessage('warn', context, message), data ?? '');
  },

  error(context: string, message: string, error?: unknown) {
    if (!shouldLog('error')) return;
    console.error(formatMessage('error', context, message), error ?? '');
  },
};
