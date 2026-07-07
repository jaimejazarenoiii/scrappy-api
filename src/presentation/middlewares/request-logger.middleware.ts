import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import { pinoHttp } from 'pino-http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { getLogger } from '../../infrastructure/logger/pino.logger.js';

/**
 * Creates Express middleware for structured request/response logging.
 * Must be called after configuration is loaded.
 * @returns Request logging middleware
 */
export function createRequestLoggerMiddleware(): RequestHandler {
  return pinoHttp({
    logger: getLogger(),
    genReqId: (req: IncomingMessage, res: ServerResponse) => {
      const existing = req.headers['x-request-id'];
      const id = typeof existing === 'string' ? existing : randomUUID();
      res.setHeader('x-request-id', id);
      return id;
    },
    customLogLevel: (
      _req: IncomingMessage,
      res: ServerResponse,
      err?: Error,
    ): 'error' | 'warn' | 'info' => {
      if (err ?? res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
  });
}
