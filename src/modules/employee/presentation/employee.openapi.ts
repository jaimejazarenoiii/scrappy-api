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
      summary: 'Create employee',
      description: 'Requires Owner or Manager role.',
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
      summary: 'Link employee to user',
      parameters: [uuidPathParam('employeeId', 'Employee identifier')],
      requestBody: jsonRequestBody('LinkEmployeeUserRequest'),
      responses: {
        ...successResponse('Employee', 'Employee linked to user'),
      },
    }),
  },
};
