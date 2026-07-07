export const commonResponses = {
  ValidationError: {
    description: 'Validation error',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiErrorEnvelope' },
        example: {
          success: false,
          data: null,
          meta: {},
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: [{ path: 'name', message: 'Required' }],
          },
        },
      },
    },
  },
  Unauthenticated: {
    description: 'Missing or invalid bearer token',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiErrorEnvelope' },
        example: {
          success: false,
          data: null,
          meta: {},
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication is required',
            details: [],
          },
        },
      },
    },
  },
  Forbidden: {
    description: 'Insufficient role or company scope violation',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiErrorEnvelope' },
        example: {
          success: false,
          data: null,
          meta: {},
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have access to this resource.',
            details: [],
          },
        },
      },
    },
  },
  NotFound: {
    description: 'Resource not found',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiErrorEnvelope' },
        example: {
          success: false,
          data: null,
          meta: {},
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Resource not found',
            details: [],
          },
        },
      },
    },
  },
  Conflict: {
    description: 'Duplicate resource or lifecycle conflict',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiErrorEnvelope' },
        example: {
          success: false,
          data: null,
          meta: {},
          error: {
            code: 'DUPLICATE_RESOURCE',
            message: 'Resource already exists',
            details: [],
          },
        },
      },
    },
  },
};
