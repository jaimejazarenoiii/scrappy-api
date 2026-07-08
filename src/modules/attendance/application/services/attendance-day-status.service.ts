import { formatUtcDate, isSameUtcDay } from '../../../../shared/datetime/day-boundaries.js';
import type { AttendanceResponseDto } from '../dto/attendance.response.js';
import type {
  AttendanceDashboardEmployeeDto,
  AttendanceDashboardResponseDto,
  AttendanceDashboardSummaryDto,
} from '../dto/attendance-dashboard.response.js';
import type { LeaveResponseDto } from '../../../leave/application/dto/leave.response.js';

export const DEFAULT_WORK_DAY_START_HOUR_UTC = 9;
export const DEFAULT_WORK_DAY_START_MINUTE = 0;

interface AttendanceSessionLike {
  employeeId: string;
  status: 'OPEN' | 'CLOSED';
  timeInAt: Date;
  timeOutAt: Date | null;
  adjustedTimeInAt: Date | null;
  adjustedTimeOutAt: Date | null;
}

interface EmployeeLike {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string | null;
}

function effectiveTimeIn(session: AttendanceSessionLike): Date {
  return session.adjustedTimeInAt ?? session.timeInAt;
}

function effectiveTimeOut(session: AttendanceSessionLike): Date | null {
  return session.adjustedTimeOutAt ?? session.timeOutAt;
}

function expectedWorkStart(day: Date): Date {
  const expected = new Date(day);
  expected.setUTCHours(DEFAULT_WORK_DAY_START_HOUR_UTC, DEFAULT_WORK_DAY_START_MINUTE, 0, 0);
  return expected;
}

export function isLateTimeIn(timeIn: Date, day: Date): boolean {
  return timeIn > expectedWorkStart(day);
}

function sessionsForDay(
  sessions: AttendanceSessionLike[],
  employeeId: string,
  day: Date,
): AttendanceSessionLike[] {
  return sessions
    .filter((session) => session.employeeId === employeeId)
    .filter((session) => isSameUtcDay(effectiveTimeIn(session), day))
    .sort((left, right) => effectiveTimeIn(left).getTime() - effectiveTimeIn(right).getTime());
}

function resolveDayStatus(input: {
  day: Date;
  sessionsToday: AttendanceSessionLike[];
  openSession: AttendanceSessionLike | null;
  approvedLeaveToday: LeaveResponseDto | null;
}): Pick<
  AttendanceDashboardEmployeeDto,
  'status' | 'isTimedIn' | 'isLate' | 'isAbsent' | 'onLeave' | 'timeInToday' | 'timeOutToday'
> {
  if (input.approvedLeaveToday) {
    return {
      status: 'ON_LEAVE',
      isTimedIn: false,
      isLate: false,
      isAbsent: false,
      onLeave: true,
      timeInToday: null,
      timeOutToday: null,
    };
  }

  const primarySession = input.openSession ?? input.sessionsToday.at(-1) ?? null;
  if (!primarySession) {
    return {
      status: 'ABSENT',
      isTimedIn: false,
      isLate: false,
      isAbsent: true,
      onLeave: false,
      timeInToday: null,
      timeOutToday: null,
    };
  }

  const timeIn = effectiveTimeIn(primarySession);
  const timeOut = effectiveTimeOut(primarySession);
  const late = isLateTimeIn(timeIn, input.day);
  const isTimedIn = primarySession.status === 'OPEN';

  if (isTimedIn) {
    return {
      status: late ? 'LATE' : 'ON_TIME',
      isTimedIn: true,
      isLate: late,
      isAbsent: false,
      onLeave: false,
      timeInToday: timeIn.toISOString(),
      timeOutToday: null,
    };
  }

  return {
    status: late ? 'LATE' : 'TIMED_OUT',
    isTimedIn: false,
    isLate: late,
    isAbsent: false,
    onLeave: false,
    timeInToday: timeIn.toISOString(),
    timeOutToday: timeOut?.toISOString() ?? null,
  };
}

export class AttendanceDayStatusService {
  buildDashboard(input: {
    day: Date;
    employees: EmployeeLike[];
    sessions: AttendanceSessionLike[];
    openSessions: Array<AttendanceSessionLike | null>;
    approvedLeavesToday: LeaveResponseDto[];
  }): AttendanceDashboardResponseDto {
    const approvedLeaveByEmployee = new Map(
      input.approvedLeavesToday.map((leave) => [leave.employeeId, leave]),
    );

    const employeeRows: AttendanceDashboardEmployeeDto[] = input.employees.map(
      (employee, index) => {
        const sessionsToday = sessionsForDay(input.sessions, employee.id, input.day);
        const openSession = input.openSessions[index];
        const approvedLeaveToday = approvedLeaveByEmployee.get(employee.id) ?? null;
        const quickDetails = resolveDayStatus({
          day: input.day,
          sessionsToday,
          openSession,
          approvedLeaveToday,
        });

        return {
          employeeId: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          employeeNumber: employee.employeeNumber,
          leaveToday: approvedLeaveToday,
          openSession:
            openSession && openSession.status === 'OPEN'
              ? (openSession as unknown as AttendanceResponseDto)
              : null,
          ...quickDetails,
        };
      },
    );

    const summary: AttendanceDashboardSummaryDto = {
      totalEmployees: employeeRows.length,
      present: employeeRows.filter(
        (row) => row.status === 'ON_TIME' || row.status === 'LATE' || row.status === 'TIMED_OUT',
      ).length,
      late: employeeRows.filter((row) => row.isLate).length,
      absent: employeeRows.filter((row) => row.isAbsent).length,
      onLeave: employeeRows.filter((row) => row.onLeave).length,
      timedIn: employeeRows.filter((row) => row.isTimedIn).length,
    };

    return {
      date: formatUtcDate(input.day),
      summary,
      employees: employeeRows,
    };
  }
}
