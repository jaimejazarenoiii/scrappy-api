import type {
  ActivityEventType,
  ActivityModule,
} from '../../modules/activity-log/domain/activity-log.entity.js';

export interface RecordActivityLogInput {
  companyId: string;
  eventType: ActivityEventType | string;
  module: ActivityModule | string;
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
}
