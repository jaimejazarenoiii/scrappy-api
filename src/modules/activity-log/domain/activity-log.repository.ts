import type { ActivityLogEntity } from './activity-log.entity.js';

export interface AppendActivityLogInput {
  id: string;
  companyId: string;
  eventType: string;
  module: string;
  action: string;
  description: string;
  userId: string;
  employeeId?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  resourceNumber?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: Date;
}

export interface ListActivityLogsQuery {
  page: number;
  limit: number;
  sortBy: 'createdAt' | 'module' | 'user';
  sortOrder: 'asc' | 'desc';
  q?: string;
  searchBy?:
    'employeeName' | 'transactionNumber' | 'tripNumber' | 'expenseNumber' | 'user' | 'action';
  module?: string;
  action?: string;
  userId?: string;
  eventType?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ListActivityLogsResult {
  items: ActivityLogEntity[];
  total: number;
}

export interface ActivityLogRepository {
  append(input: AppendActivityLogInput): Promise<ActivityLogEntity>;
  findById(activityLogId: string, companyId: string): Promise<ActivityLogEntity | null>;
  list(companyId: string, query: ListActivityLogsQuery): Promise<ListActivityLogsResult>;
}
