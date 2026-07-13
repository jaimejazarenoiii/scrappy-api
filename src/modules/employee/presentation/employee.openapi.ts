import {
  jsonRequestBody,
  protectedOperation,
  successResponse,
  uuidPathParam,
} from '../../../swagger/openapi-helpers.js';

export const employeeOpenApiPaths = {
  '/api/v1/employees': {
    get: protectedOperation({
      tags: ['Employees'],
      summary: 'List company employees',
      description:
        "Returns the active employees of the authenticated user's company, resolved from the access token. Useful for populating assignment pickers.",
      responses: {
        ...successResponse({ type: 'array', items: 'Employee' }, 'Company employees'),
      },
    }),
    post: protectedOperation({
      tags: ['Employees'],
      summary: 'Create employee (optional login account)',
      description:
        'Requires Owner or Manager. Set createAccount=true with account credentials to provision a linked User in the same request.',
      requestBody: jsonRequestBody('CreateEmployeeRequest'),
      responses: {
        ...successResponse('Employee', 'Employee created', '201'),
      },
    }),
  },
  '/api/v1/employees/me': {
    get: protectedOperation({
      tags: ['Employees'],
      summary: 'View current employee profile',
      description:
        'Returns the employee profile linked to the authenticated user, resolved from the access token. Returns 404 when the user has no linked employee record.',
      responses: {
        ...successResponse('Employee', 'Current employee profile'),
      },
    }),
  },
  '/api/v1/employees/{employeeId}': {
    get: protectedOperation({
      tags: ['Employees'],
      summary: 'View employee',
      parameters: [uuidPathParam('employeeId', 'Employee identifier')],
      responses: {
        ...successResponse('Employee', 'Employee details'),
      },
    }),
    patch: protectedOperation({
      tags: ['Employees'],
      summary: 'Update employee',
      description: 'Requires Owner or Manager role.',
      parameters: [uuidPathParam('employeeId', 'Employee identifier')],
      requestBody: jsonRequestBody('UpdateEmployeeRequest'),
      responses: {
        ...successResponse('Employee', 'Updated employee'),
      },
    }),
  },
  '/api/v1/employees/{employeeId}/archive': {
    post: protectedOperation({
      tags: ['Employees'],
      summary: 'Archive employee',
      parameters: [uuidPathParam('employeeId', 'Employee identifier')],
      responses: {
        ...successResponse('Employee', 'Archived employee'),
      },
    }),
  },
  '/api/v1/employees/{employeeId}/user-link': {
    post: protectedOperation({
      tags: ['Employees'],
      summary: 'Link employee to existing user',
      parameters: [uuidPathParam('employeeId', 'Employee identifier')],
      requestBody: jsonRequestBody('LinkEmployeeUserRequest'),
      responses: {
        ...successResponse('Employee', 'Employee linked to user'),
      },
    }),
  },
  '/api/v1/employees/{employeeId}/system-access': {
    post: protectedOperation({
      tags: ['Employees'],
      summary: 'Grant system access (create User and link)',
      description:
        'Creates a new User account and links it to an Employee that does not yet have access. Owner or Manager only.',
      parameters: [uuidPathParam('employeeId', 'Employee identifier')],
      requestBody: jsonRequestBody('GrantSystemAccessRequest'),
      responses: {
        ...successResponse('Employee', 'System access granted', '201'),
      },
    }),
  },
  '/api/v1/employees/{employeeId}/system-access/disable': {
    post: protectedOperation({
      tags: ['Employees'],
      summary: 'Disable system access',
      description:
        'Sets the linked User to INACTIVE and revokes refresh sessions. Employee remains.',
      parameters: [uuidPathParam('employeeId', 'Employee identifier')],
      responses: {
        ...successResponse('Employee', 'System access disabled'),
      },
    }),
  },
  '/api/v1/employees/{employeeId}/system-access/enable': {
    post: protectedOperation({
      tags: ['Employees'],
      summary: 'Enable system access',
      description: 'Re-activates a previously disabled linked User account.',
      parameters: [uuidPathParam('employeeId', 'Employee identifier')],
      responses: {
        ...successResponse('Employee', 'System access enabled'),
      },
    }),
  },
  '/api/v1/employees/{employeeId}/password-reset': {
    post: protectedOperation({
      tags: ['Employees'],
      summary: 'Reset employee password (system-generated temporary)',
      description:
        'Generates a secure temporary password, stores only the hash, sets passwordChangeRequired=true, revokes sessions, and returns the temporary password once. Manager may reset Employees only; Owner may reset Employee, Manager, or Owner (linked). Clients must not send a temporary password.',
      parameters: [uuidPathParam('employeeId', 'Employee identifier')],
      requestBody: jsonRequestBody('EmptyObject', false),
      responses: {
        ...successResponse(
          'ResetEmployeePasswordResult',
          'Password reset; one-time temporaryPassword included',
        ),
      },
    }),
  },
};
