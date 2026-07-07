export const employeeOpenApiPaths = {
  '/api/v1/employees': { post: { tags: ['Employees'], summary: 'Create employee' } },
  '/api/v1/employees/{employeeId}': {
    get: { tags: ['Employees'], summary: 'View employee' },
    patch: { tags: ['Employees'], summary: 'Update employee' },
  },
  '/api/v1/employees/{employeeId}/archive': {
    post: { tags: ['Employees'], summary: 'Archive employee' },
  },
  '/api/v1/employees/{employeeId}/user-link': {
    post: { tags: ['Employees'], summary: 'Link employee to user' },
  },
};
