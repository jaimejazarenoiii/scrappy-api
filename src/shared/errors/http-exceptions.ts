import { AppError } from './app-error.js';
import { ERROR_CODES } from './error-codes.js';

export class ValidationAppError extends AppError {
  constructor(message: string, details: Record<string, unknown>[] = []) {
    super(message, 400, ERROR_CODES.VALIDATION_ERROR, details);
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = 'Authentication is required') {
    super(message, 401, ERROR_CODES.UNAUTHENTICATED);
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message = 'Invalid credentials') {
    super(message, 401, ERROR_CODES.INVALID_CREDENTIALS);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have access to this resource.') {
    super(message, 403, ERROR_CODES.FORBIDDEN);
  }
}

export class CompanyScopeViolationError extends AppError {
  constructor(message = 'Cross-company access is not allowed.') {
    super(message, 403, ERROR_CODES.COMPANY_SCOPE_VIOLATION);
  }
}

export class ResourceNotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, ERROR_CODES.RESOURCE_NOT_FOUND);
  }
}

export class DuplicateResourceError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, ERROR_CODES.DUPLICATE_RESOURCE);
  }
}

export class LifecycleConflictError extends AppError {
  constructor(message = 'Invalid lifecycle transition') {
    super(message, 409, ERROR_CODES.LIFECYCLE_CONFLICT);
  }
}

export class BusinessRuleViolationError extends AppError {
  constructor(message = 'Business rule violation', details: Record<string, unknown>[] = []) {
    super(message, 409, ERROR_CODES.BUSINESS_RULE_VIOLATION, details);
  }
}

export class SessionExpiredError extends AppError {
  constructor(message = 'Session has expired') {
    super(message, 401, ERROR_CODES.SESSION_EXPIRED);
  }
}

export class SessionRevokedError extends AppError {
  constructor(message = 'Session has been revoked') {
    super(message, 401, ERROR_CODES.SESSION_REVOKED);
  }
}
