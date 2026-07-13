import type { ActivityLogEntity } from '../../domain/activity-log.entity.js';

export interface ActivityLogPerformedByDto {
  id: string;
  employeeId: string | null;
  email: string | null;
  role: string | null;
}

export interface ActivityLogResponseDto {
  id: string;
  companyId: string;
  eventType: string;
  module: string;
  action: string;
  description: string;
  userId: string;
  employeeId: string | null;
  resourceType: string | null;
  resourceId: string | null;
  resourceNumber: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  performedBy: ActivityLogPerformedByDto;
}

export function buildActivityLogResponse(entity: ActivityLogEntity): ActivityLogResponseDto {
  const props = entity.toPrimitives();
  const metadata = props.metadata;
  const email = typeof metadata?.actorEmail === 'string' ? metadata.actorEmail : null;
  const role = typeof metadata?.actorRole === 'string' ? metadata.actorRole : null;

  return {
    id: props.id,
    companyId: props.companyId,
    eventType: props.eventType,
    module: props.module,
    action: props.action,
    description: props.description,
    userId: props.userId,
    employeeId: props.employeeId,
    resourceType: props.resourceType,
    resourceId: props.resourceId,
    resourceNumber: props.resourceNumber,
    ipAddress: props.ipAddress,
    userAgent: props.userAgent,
    metadata,
    createdAt: props.createdAt,
    performedBy: {
      id: props.userId,
      employeeId: props.employeeId,
      email,
      role,
    },
  };
}
