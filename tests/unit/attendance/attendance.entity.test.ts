import { describe, expect, it } from 'vitest';
import { AttendanceSessionEntity } from '../../../src/modules/attendance/domain/attendance-session.entity.js';

describe('attendance session entity', () => {
  it('tracks open and closed lifecycle', () => {
    const session = AttendanceSessionEntity.create({
      id: '1',
      companyId: 'c1',
      employeeId: 'e1',
      status: 'OPEN',
      timeInAt: new Date(),
      timeOutAt: null,
      note: null,
      correctionNote: null,
      adjustedTimeInAt: null,
      adjustedTimeOutAt: null,
      createdByUserId: null,
      updatedByUserId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(session.isOpen()).toBe(true);
    const closed = session.close(new Date(), 'done');
    expect(closed.isClosed()).toBe(true);
  });
});
