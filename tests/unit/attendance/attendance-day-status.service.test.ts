import { describe, expect, it } from 'vitest';
import { AttendanceDayStatusService } from '../../../src/modules/attendance/application/services/attendance-day-status.service.js';

describe('AttendanceDayStatusService', () => {
  const service = new AttendanceDayStatusService();
  const day = new Date('2026-07-08T00:00:00.000Z');

  it('marks approved leave as on leave and absent when no session exists', () => {
    const result = service.buildDashboard({
      day,
      employees: [
        {
          id: 'emp-1',
          firstName: 'Jane',
          lastName: 'Absent',
          employeeNumber: null,
        },
        {
          id: 'emp-2',
          firstName: 'John',
          lastName: 'Leave',
          employeeNumber: 'E-2',
        },
      ],
      sessions: [],
      openSessions: [null, null],
      approvedLeavesToday: [
        {
          id: 'leave-1',
          companyId: 'company-1',
          employeeId: 'emp-2',
          leaveType: 'FULL_DAY',
          leaveDate: day,
          status: 'APPROVED',
          reason: null,
          managerNote: null,
          createdAt: day,
          updatedAt: day,
        },
      ],
    });

    expect(result.summary.absent).toBe(1);
    expect(result.summary.onLeave).toBe(1);
    expect(result.employees[0]?.status).toBe('ABSENT');
    expect(result.employees[1]?.status).toBe('ON_LEAVE');
  });

  it('marks late and timed-out sessions', () => {
    const result = service.buildDashboard({
      day,
      employees: [
        {
          id: 'emp-3',
          firstName: 'Late',
          lastName: 'Worker',
          employeeNumber: null,
        },
      ],
      sessions: [
        {
          employeeId: 'emp-3',
          status: 'CLOSED',
          timeInAt: new Date('2026-07-08T02:30:00.000Z'),
          timeOutAt: new Date('2026-07-08T10:00:00.000Z'),
          adjustedTimeInAt: null,
          adjustedTimeOutAt: null,
        },
      ],
      openSessions: [null],
      approvedLeavesToday: [],
    });

    expect(result.employees[0]?.status).toBe('LATE');
    expect(result.employees[0]?.isLate).toBe(true);
    expect(result.employees[0]?.timeOutToday).toBeTruthy();
  });
});
