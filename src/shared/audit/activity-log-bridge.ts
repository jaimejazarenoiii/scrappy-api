import type { AuditEvent } from './audit-event.js';
import type { RecordActivityLogInput } from '../activity-log/record-activity-log.input.js';
import type { ActivityLogRecorder } from '../../modules/activity-log/application/services/activity-log-recorder.service.js';

let recorder: ActivityLogRecorder | null = null;

export function registerActivityLogRecorder(instance: ActivityLogRecorder | null): void {
  recorder = instance;
}

type Taxonomy = Pick<RecordActivityLogInput, 'eventType' | 'module' | 'description'>;

const ACTION_TAXONOMY: Record<string, Taxonomy> = {
  'auth.login': { eventType: 'AUTHENTICATION', module: 'auth', description: 'User logged in' },
  'auth.admin_login': {
    eventType: 'AUTHENTICATION',
    module: 'auth',
    description: 'Platform admin logged in',
  },
  'auth.logout': { eventType: 'AUTHENTICATION', module: 'auth', description: 'User logged out' },
  'user.password_changed': {
    eventType: 'AUTHENTICATION',
    module: 'user',
    description: 'Password changed',
  },
  'user.password_admin_reset': {
    eventType: 'AUTHENTICATION',
    module: 'user',
    description: 'Password reset by administrator',
  },
  'company.updated': { eventType: 'COMPANY', module: 'company', description: 'Company updated' },
  'employee.created': {
    eventType: 'EMPLOYEE',
    module: 'employee',
    description: 'Employee created',
  },
  'employee.updated': {
    eventType: 'EMPLOYEE',
    module: 'employee',
    description: 'Employee updated',
  },
  'employee.archived': {
    eventType: 'EMPLOYEE',
    module: 'employee',
    description: 'Employee archived',
  },
  'employee.account_provisioned_on_create': {
    eventType: 'EMPLOYEE',
    module: 'employee',
    description: 'Employee account created',
  },
  'employee.system_access_granted': {
    eventType: 'EMPLOYEE',
    module: 'employee',
    description: 'Employee account created',
  },
  'employee.system_access_enabled': {
    eventType: 'EMPLOYEE',
    module: 'employee',
    description: 'Employee account enabled',
  },
  'employee.system_access_disabled': {
    eventType: 'EMPLOYEE',
    module: 'employee',
    description: 'Employee account disabled',
  },
  'branch.created': {
    eventType: 'ORGANIZATION',
    module: 'branch',
    description: 'Branch created',
  },
  'warehouse.created': {
    eventType: 'ORGANIZATION',
    module: 'warehouse',
    description: 'Warehouse created',
  },
  'vehicle.created': {
    eventType: 'ORGANIZATION',
    module: 'vehicle',
    description: 'Vehicle created',
  },
  'vehicle.updated': {
    eventType: 'ORGANIZATION',
    module: 'vehicle',
    description: 'Vehicle updated',
  },
  'transaction.created': {
    eventType: 'TRANSACTION',
    module: 'transaction',
    description: 'Transaction created',
  },
  'transaction.updated': {
    eventType: 'TRANSACTION',
    module: 'transaction',
    description: 'Transaction updated',
  },
  'transaction.finished': {
    eventType: 'TRANSACTION',
    module: 'transaction',
    description: 'Transaction submitted',
  },
  'transaction.returned_to_draft': {
    eventType: 'TRANSACTION',
    module: 'transaction',
    description: 'Transaction returned to draft',
  },
  'transaction.settled': {
    eventType: 'TRANSACTION',
    module: 'transaction',
    description: 'Transaction paid',
  },
  'transaction.cancelled': {
    eventType: 'TRANSACTION',
    module: 'transaction',
    description: 'Transaction cancelled',
  },
  'trip.created': { eventType: 'TRIP', module: 'trip', description: 'Trip created' },
  'trip.started': { eventType: 'TRIP', module: 'trip', description: 'Trip started' },
  'trip.completed': { eventType: 'TRIP', module: 'trip', description: 'Trip completed' },
  'trip.cancelled': { eventType: 'TRIP', module: 'trip', description: 'Trip cancelled' },
  'trip.load_enabled': { eventType: 'TRIP', module: 'trip', description: 'Trip load enabled' },
  'trip.load_disabled': { eventType: 'TRIP', module: 'trip', description: 'Trip load disabled' },
  'trip.load_created': { eventType: 'TRIP', module: 'trip', description: 'Trip load created' },
  'trip.load_updated': { eventType: 'TRIP', module: 'trip', description: 'Trip load updated' },
  'trip.load_deleted': { eventType: 'TRIP', module: 'trip', description: 'Trip load deleted' },
  'trip.load_item_added': {
    eventType: 'TRIP',
    module: 'trip',
    description: 'Trip load item added',
  },
  'trip.load_item_updated': {
    eventType: 'TRIP',
    module: 'trip',
    description: 'Trip load item updated',
  },
  'trip.load_item_removed': {
    eventType: 'TRIP',
    module: 'trip',
    description: 'Trip load item removed',
  },
  'expense.created': { eventType: 'EXPENSE', module: 'expense', description: 'Expense created' },
  'expense.recorded': { eventType: 'EXPENSE', module: 'expense', description: 'Expense recorded' },
  'expense.cancelled': {
    eventType: 'EXPENSE',
    module: 'expense',
    description: 'Expense cancelled',
  },
  'attendance.time_in': {
    eventType: 'WORKFORCE',
    module: 'attendance',
    description: 'Employee timed in',
  },
  'attendance.time_out': {
    eventType: 'WORKFORCE',
    module: 'attendance',
    description: 'Employee timed out',
  },
  'leave.created': { eventType: 'WORKFORCE', module: 'leave', description: 'Leave recorded' },
  'leave.recorded': { eventType: 'WORKFORCE', module: 'leave', description: 'Leave recorded' },
  'leave.requested': { eventType: 'WORKFORCE', module: 'leave', description: 'Leave recorded' },
  'cash_advance.created': {
    eventType: 'WORKFORCE',
    module: 'cash-advance',
    description: 'Cash advance created',
  },
  'payroll.paid': { eventType: 'WORKFORCE', module: 'payroll', description: 'Payroll paid' },
  'payroll.marked_paid': { eventType: 'WORKFORCE', module: 'payroll', description: 'Payroll paid' },
  'payroll.mark_paid': { eventType: 'WORKFORCE', module: 'payroll', description: 'Payroll paid' },
  'subscription.created': {
    eventType: 'COMPANY',
    module: 'subscription',
    description: 'Subscription created',
  },
  'subscription.renewed': {
    eventType: 'COMPANY',
    module: 'subscription',
    description: 'Subscription renewed',
  },
  'subscription.updated': {
    eventType: 'COMPANY',
    module: 'subscription',
    description: 'Subscription period updated',
  },
  'subscription.expired': {
    eventType: 'COMPANY',
    module: 'subscription',
    description: 'Subscription expired',
  },
  'subscription.suspended': {
    eventType: 'COMPANY',
    module: 'subscription',
    description: 'Subscription suspended',
  },
  'subscription.reactivated': {
    eventType: 'COMPANY',
    module: 'subscription',
    description: 'Subscription reactivated',
  },
  'tracking.started': {
    eventType: 'TRACKING',
    module: 'tracking',
    description: 'Live tracking started',
  },
  'tracking.stopped': {
    eventType: 'TRACKING',
    module: 'tracking',
    description: 'Live tracking stopped',
  },
  'admin.company_created': {
    eventType: 'COMPANY',
    module: 'company',
    description: 'Company created by platform admin',
  },
  'admin.account_created': {
    eventType: 'EMPLOYEE',
    module: 'employee',
    description: 'Account provisioned by platform admin',
  },
};
function resolveTaxonomy(action: string): Taxonomy {
  if (ACTION_TAXONOMY[action]) return ACTION_TAXONOMY[action]!;
  const [prefix] = action.split('.');
  const moduleGuess = prefix || 'company';
  return {
    eventType: 'COMPANY',
    module: moduleGuess,
    description: action.replaceAll('.', ' '),
  };
}

export function persistActivityLogFromAudit(event: AuditEvent): void {
  if (!recorder || !event.companyId || !event.actorUserId) return;
  const taxonomy = resolveTaxonomy(event.action);
  const metadata = { ...(event.metadata ?? {}) };
  const resourceNumber =
    typeof metadata.resourceNumber === 'string'
      ? metadata.resourceNumber
      : typeof metadata.transactionNumber === 'string'
        ? metadata.transactionNumber
        : typeof metadata.tripNumber === 'string'
          ? metadata.tripNumber
          : typeof metadata.expenseNumber === 'string'
            ? metadata.expenseNumber
            : typeof metadata.employeeName === 'string'
              ? metadata.employeeName
              : null;

  void recorder.record({
    companyId: event.companyId,
    eventType: taxonomy.eventType,
    module: taxonomy.module,
    action: event.action,
    description: taxonomy.description,
    userId: event.actorUserId,
    // Actor employee is resolved by ActivityLogRecorder from the user account.
    // Do not map metadata.employeeId here — that is often the subject, not the actor.
    resourceType: event.resourceType,
    resourceId: event.resourceId,
    resourceNumber,
    ipAddress: typeof metadata.ipAddress === 'string' ? metadata.ipAddress : null,
    userAgent: typeof metadata.userAgent === 'string' ? metadata.userAgent : null,
    metadata,
  });
}
