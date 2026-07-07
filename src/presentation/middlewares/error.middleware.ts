import type { ErrorRequestHandler } from 'express';
import { AppError } from '../../domain/errors/app.error.js';
import { getLogger } from '../../infrastructure/logger/pino.logger.js';
import { failure } from '../../shared/utils/api-response.js';

/**
 * Global error handler — maps errors to the standard API response envelope.
 */
export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  const logger = getLogger();

  if (err instanceof AppError) {
    logger.warn({ err, code: err.code }, err.message);
    res.status(err.statusCode).json(
      failure({
        code: err.code,
        message: err.message,
      }),
    );
    return;
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json(
    failure({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    }),
  );
};
