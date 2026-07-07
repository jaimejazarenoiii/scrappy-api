import {
  jsonRequestBody,
  protectedOperation,
  successResponse,
  uuidPathParam,
} from '../../../swagger/openapi-helpers.js';

export const employeeOpenApiPaths = {
  '/api/v1/employees': {
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
