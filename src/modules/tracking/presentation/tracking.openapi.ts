export const trackingOpenApiPaths = {
  '/tracking/session': {
    get: {
      tags: ['Tracking'],
      summary: 'Synchronize employee tracking session (mobile recovery)',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Tracking session state' } },
    },
  },
  '/tracking/available-trips': {
    get: {
      tags: ['Tracking'],
      summary: 'List Started trips assigned to authenticated employee',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Available trips for tracking selection' } },
    },
  },
  '/tracking/location': {
    put: {
      tags: ['Tracking'],
      summary: 'Upsert authenticated employee current location',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Location accepted' } },
    },
  },
  '/tracking/employees/{employeeId}/location': {
    get: {
      tags: ['Tracking'],
      summary: 'Get employee current location',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Current location snapshot' } },
    },
  },
  '/tracking/employees/{employeeId}/status': {
    get: {
      tags: ['Tracking'],
      summary: 'Get employee tracking status',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Online/offline status' } },
    },
  },
  '/trips/{tripId}/tracking/locations': {
    get: {
      tags: ['Tracking', 'Trips'],
      summary: 'Get current locations for trip members',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Trip tracking snapshot' } },
    },
  },
  '/tracking/trips/active/locations': {
    get: {
      tags: ['Tracking'],
      summary: 'List active trip locations for company',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Paginated active trip tracking' } },
    },
  },
  '/admin/companies/{companyId}/tracking/trips/active/locations': {
    get: {
      tags: ['Tracking', 'Admin'],
      summary: 'Super Admin company active trip locations',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Admin tracking snapshot' } },
    },
  },
};
