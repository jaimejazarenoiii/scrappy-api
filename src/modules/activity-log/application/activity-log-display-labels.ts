const EVENT_TYPE_LABELS: Record<string, string> = {
  AUTHENTICATION: 'Authentication',
  COMPANY: 'Company',
  EMPLOYEE: 'Employee',
  ORGANIZATION: 'Organization',
  TRANSACTION: 'Transaction',
  TRIP: 'Trip',
  EXPENSE: 'Expense',
  WORKFORCE: 'Workforce',
};

const MODULE_LABELS: Record<string, string> = {
  auth: 'Authentication',
  company: 'Company',
  employee: 'Employee',
  branch: 'Branch',
  warehouse: 'Warehouse',
  vehicle: 'Vehicle',
  transaction: 'Transaction',
  trip: 'Trip',
  expense: 'Expense',
  attendance: 'Attendance',
  leave: 'Leave',
  'cash-advance': 'Cash advance',
  payroll: 'Payroll',
  user: 'User',
  subscription: 'Subscription',
};

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  company: 'Company',
  user: 'User',
  employee: 'Employee',
  branch: 'Branch',
  warehouse: 'Warehouse',
  vehicle: 'Vehicle',
  transaction: 'Transaction',
  transaction_item: 'Transaction item',
  transaction_attachment: 'Transaction attachment',
  trip: 'Trip',
  expense: 'Expense',
  expense_attachment: 'Expense attachment',
  session: 'Session',
  cash_advance: 'Cash advance',
  leave_record: 'Leave',
  payroll_record: 'Payroll',
  subscription: 'Subscription',
  attendance_session: 'Attendance',
};

const USER_ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee',
  SUPER_ADMIN: 'Super admin',
};

function titleCaseWords(value: string): string {
  return value
    .split(/[-_.\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function toActivityEventTypeLabel(code: string): string {
  return EVENT_TYPE_LABELS[code] ?? titleCaseWords(code);
}

export function toActivityModuleLabel(code: string): string {
  return MODULE_LABELS[code] ?? titleCaseWords(code);
}

export function toActivityResourceTypeLabel(code: string | null): string | null {
  if (!code) return null;
  return RESOURCE_TYPE_LABELS[code] ?? titleCaseWords(code);
}

export function toActivityActionLabel(action: string, description: string): string {
  const trimmed = description.trim();
  if (trimmed) return trimmed;
  return titleCaseWords(action.replaceAll('.', ' '));
}

export function toUserRoleLabel(role: string | null): string | null {
  if (!role) return null;
  return USER_ROLE_LABELS[role] ?? titleCaseWords(role);
}
