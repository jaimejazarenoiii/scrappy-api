import type { RequestHandler } from 'express';
import type { ZodSchema } from 'zod';
import { ValidationAppError } from '../shared/errors/http-exceptions.js';

export function validate(
  schema: ZodSchema,
  part: 'body' | 'params' | 'query' = 'body',
): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      next(
        new ValidationAppError(
          'Validation failed',
          result.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        ),
      );
      return;
    }
    req[part] = result.data;
    next();
  };
}
