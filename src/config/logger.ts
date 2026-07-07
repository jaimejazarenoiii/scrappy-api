import pino from 'pino';
import { loadConfig } from './index.js';

let logger: pino.Logger | null = null;

export function getLogger(): pino.Logger {
  if (logger) return logger;
  const config = loadConfig();
  logger = pino({
    level: config.LOG_LEVEL,
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie', 'body.password', 'refreshToken'],
      censor: '[REDACTED]',
    },
  });
  return logger;
}

export function resetLoggerForTests(): void {
  logger = null;
}
