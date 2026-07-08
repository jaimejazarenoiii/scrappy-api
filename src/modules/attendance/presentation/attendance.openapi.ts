import {
  jsonRequestBody,
  paginatedListResponse,
  protectedOperation,
  queryParam,
  successResponse,
  uuidPathParam,
} from '../../../swagger/openapi-helpers.js';

export const attendanceOpenApiPaths = {
  '/api/v1/workforce/attendance/time-in': {
    post: protectedOperation({
      tags: ['Attendance'],
      summary: 'Time In',
      requestBody: jsonRequestBody('TimeInRequest'),
      responses: { ...successResponse('AttendanceSession', 'Attendance session opened') },
    }),
  },
  '/api/v1/workforce/attendance/time-out': {
    post: protectedOperation({
      tags: ['Attendance'],
      summary: 'Time Out',
      requestBody: jsonRequestBody('TimeOutRequest'),
      responses: { ...successResponse('AttendanceSession', 'Attendance session closed') },
    }),
  },
  '/api/v1/workforce/attendance/status': {
    get: protectedOperation({
      tags: ['Attendance'],
      summary: 'Current attendance status',
      responses: { ...successResponse('AttendanceStatus', 'Operational attendance status') },
    }),
  },
  '/api/v1/workforce/attendance': {
    get: protectedOperation({
      tags: ['Attendance'],
      summary: 'My attendance history',
      parameters: [
        queryParam('page', { type: 'integer', default: 1 }),
        queryParam('limit', { type: 'integer', default: 20 }),
        queryParam('sortBy', { type: 'string', enum: ['timeInAt', 'createdAt'] }),
        queryParam('sortOrder', { type: 'string', enum: ['asc', 'desc'] }),
        queryParam('fromDate', { type: 'string', format: 'date' }),
        queryParam('toDate', { type: 'string', format: 'date' }),
      ],
      responses: { ...paginatedListResponse('AttendanceSession', 'Attendance history') },
    }),
  },
  '/api/v1/workforce/attendance/company': {
    get: protectedOperation({
      tags: ['Attendance'],
      summary: 'Company attendance records',
      parameters: [
        queryParam('employeeId', { type: 'string', format: 'uuid' }),
        queryParam('page', { type: 'integer', default: 1 }),
        queryParam('limit', { type: 'integer', default: 20 }),
        queryParam('fromDate', { type: 'string', format: 'date' }),
        queryParam('toDate', { type: 'string', format: 'date' }),
      ],
      responses: { ...paginatedListResponse('CompanyAttendanceSession', 'Company attendance') },
    }),
  },
  '/api/v1/workforce/attendance/dashboard': {
    get: protectedOperation({
      tags: ['Attendance'],
      summary: 'Attendance dashboard for owners and managers',
      parameters: [queryParam('date', { type: 'string', format: 'date' })],
      responses: { ...successResponse('AttendanceDashboard', 'Attendance dashboard') },
    }),
  },
  '/api/v1/workforce/attendance/{attendanceId}': {
    patch: protectedOperation({
      tags: ['Attendance'],
      summary: 'Manage attendance record',
      parameters: [uuidPathParam('attendanceId', 'Attendance identifier')],
      requestBody: jsonRequestBody('ManageAttendanceRequest'),
      responses: { ...successResponse('AttendanceSession', 'Updated attendance record') },
    }),
  },
};
