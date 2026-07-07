import type { RequestHandler } from 'express';
import { pinoHttp } from 'pino-http';
import { getLogger } from '../config/logger.js';

export function createRequestLoggerMiddleware(): RequestHandler {
  return pinoHttp({
    logger: getLogger(),
    quietReqLogger: true,
    customSuccessMessage: () => 'request completed',
    customErrorMessage: () => 'request failed',
  });
}
