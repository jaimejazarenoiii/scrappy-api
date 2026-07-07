import {
  jsonRequestBody,
  protectedOperation,
  standardErrorResponses,
  successResponse,
} from '../../../swagger/openapi-helpers.js';

export const authOpenApiPaths = {
  '/api/v1/auth/login': {
    post: {
      tags: ['Authentication'],
      summary: 'Login',
      description: 'Authenticate with email and password. Returns access and refresh tokens.',
      requestBody: jsonRequestBody('LoginRequest'),
      responses: {
        ...successResponse('AuthResponse', 'Authenticated session'),
        '401': {
          description: 'Invalid credentials',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiErrorEnvelope' },
            },
          },
        },
        '400': standardErrorResponses['400'],
      },
    },
  },
  '/api/v1/auth/logout': {
    post: protectedOperation({
      tags: ['Authentication'],
      summary: 'Logout',
      description: 'Revokes the current refresh session.',
      responses: {
        '200': {
          description: 'Logout successful',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', enum: [true] },
                  data: { type: 'object', nullable: true },
                  meta: { type: 'object' },
                  error: { nullable: true, type: 'null' },
                },
              },
            },
          },
        },
      },
    }),
  },
  '/api/v1/auth/refresh': {
    post: {
      tags: ['Authentication'],
      summary: 'Refresh session',
      requestBody: jsonRequestBody('RefreshRequest'),
      responses: {
        ...successResponse('AuthResponse', 'Refreshed session'),
        '401': standardErrorResponses['401'],
        '400': standardErrorResponses['400'],
      },
    },
  },
  '/api/v1/auth/forgot-password': {
    post: {
      tags: ['Authentication'],
      summary: 'Forgot password placeholder',
      description: 'Placeholder endpoint for future password reset workflow.',
      requestBody: jsonRequestBody('ForgotPasswordRequest'),
      responses: {
        '200': {
          description: 'Request accepted',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', enum: [true] },
                  data: { type: 'object' },
                  meta: { type: 'object' },
                  error: { nullable: true, type: 'null' },
                },
              },
            },
          },
        },
        '400': standardErrorResponses['400'],
      },
    },
  },
};
