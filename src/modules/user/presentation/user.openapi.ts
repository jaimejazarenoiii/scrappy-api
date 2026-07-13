import {
  protectedOperation,
  successResponse,
  jsonRequestBody,
} from '../../../swagger/openapi-helpers.js';

export const userOpenApiPaths = {
  '/api/v1/users/me': {
    get: protectedOperation({
      tags: ['Users'],
      summary: 'View current user',
      description: 'Returns the authenticated user profile for the current company context.',
      responses: {
        ...successResponse('CurrentUser', 'Current user profile'),
      },
    }),
  },
  '/api/v1/users/me/password-status': {
    get: protectedOperation({
      tags: ['Users'],
      summary: 'Get password status',
      description:
        'Returns whether the authenticated user must change their password before accessing other protected resources.',
      responses: {
        ...successResponse('PasswordStatus', 'Password status'),
      },
    }),
  },
  '/api/v1/users/me/password': {
    post: protectedOperation({
      tags: ['Users'],
      summary: 'Change own password',
      description:
        'Verifies the current password, sets a new password hash, clears passwordChangeRequired, and revokes refresh sessions.',
      requestBody: jsonRequestBody('ChangePasswordRequest'),
      responses: {
        ...successResponse('ChangePasswordResult', 'Password changed'),
      },
    }),
  },
};
