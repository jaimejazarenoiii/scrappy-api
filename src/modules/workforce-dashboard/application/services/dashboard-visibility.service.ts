import type { UserRole } from '../../../../shared/policy/roles.js';
import { isOperationallyReadyForRole } from '../../../../shared/workforce/operational-readiness.js';
import type { OperationalAttendanceSession } from '../../../../shared/workforce/operational-readiness.js';
import { isWorkforceTrackingRequired } from '../../../../shared/workforce/workforce-role-policy.js';
import type { DashboardVisibilityFlags } from '../dto/workforce-dashboard.response.js';

export class DashboardVisibilityService {
  resolve(
    openSession: OperationalAttendanceSession | null,
    role: UserRole,
  ): DashboardVisibilityFlags {
    if (!isWorkforceTrackingRequired(role)) {
      return {
        canTimeIn: false,
        canTimeOut: false,
        canCreateTransaction: true,
        canCreateExpense: true,
      };
    }

    const ready = isOperationallyReadyForRole(openSession, role);

    return {
      canTimeIn: !ready,
      canTimeOut: ready,
      canCreateTransaction: ready,
      canCreateExpense: ready,
    };
  }
}
