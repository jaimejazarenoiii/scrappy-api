import { isOperationallyReady } from '../../../../shared/workforce/operational-readiness.js';
import type { OperationalAttendanceSession } from '../../../../shared/workforce/operational-readiness.js';
import type { DashboardVisibilityFlags } from '../dto/workforce-dashboard.response.js';

export class DashboardVisibilityService {
  resolve(openSession: OperationalAttendanceSession | null): DashboardVisibilityFlags {
    const ready = isOperationallyReady(openSession);

    return {
      canTimeIn: !ready,
      canTimeOut: ready,
      canCreateTransaction: ready,
      canCreateExpense: ready,
    };
  }
}
