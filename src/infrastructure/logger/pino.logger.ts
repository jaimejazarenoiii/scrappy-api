import pino from 'pino';
import { getConfig } from '../config/index.js';

/**
 * Creates the application Pino logger with structured JSON output.
 * @returns Configured Pino logger instance
 */
export function createLogger(): pino.Logger {
  const config = getConfig();
  const isDev = config.NODE_ENV === 'development';

  return pino({
    level: config.LOG_LEVEL,
    transport: isDev
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
          },
        }
      : undefined,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'password',
        'DATABASE_URL',
        'body.password',
      ],
      censor: '[REDACTED]',
    },
  });
}

let loggerInstance: pino.Logger | null = null;

/**
 * Returns the singleton application logger.
 * @returns Pino logger instance
 */
export function getLogger(): pino.Logger {
  if (!loggerInstance) {
    loggerInstance = createLogger();
  }
  return loggerInstance;
}

/**
 * Resets logger singleton — for testing only.
 */
export function resetLoggerForTests(): void {
  loggerInstance = null;
}
