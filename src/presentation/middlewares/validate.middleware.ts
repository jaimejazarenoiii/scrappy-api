import type { RequestHandler } from 'express';
import type { ZodSchema } from 'zod';
import { ValidationError } from '../../domain/errors/validation.error.js';

type RequestPart = 'body' | 'query' | 'params';

/**
 * Creates middleware that validates a request part against a Zod schema.
 * @param schema - Zod validation schema
 * @param part - Request property to validate (default: body)
 * @returns Express validation middleware
 */
export function validate(schema: ZodSchema, part: RequestPart = 'body'): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      const message = result.error.issues.map((i) => i.message).join('; ');
      next(new ValidationError(message));
      return;
    }

    req[part] = result.data;
    next();
  };
}
