export interface AuditEvent {
  action: string;
  actorUserId?: string;
  companyId?: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}
