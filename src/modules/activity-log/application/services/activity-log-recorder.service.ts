import { randomUUID } from 'node:crypto';
import { getLogger } from '../../../../config/logger.js';
import type { ActivityLogRepository } from '../../domain/activity-log.repository.js';
import type { RecordActivityLogInput } from '../../../../shared/activity-log/record-activity-log.input.js';

const SECRET_KEYS = new Set([
  'password',
  'temporaryPassword',
  'passwordHash',
  'currentPassword',
  'newPassword',
  'confirmPassword',
  'secret',
  'token',
]);

function sanitizeMetadata(
  metadata: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!metadata) return null;
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (SECRET_KEYS.has(key)) continue;
    cleaned[key] = value;
  }
  return Object.keys(cleaned).length > 0 ? cleaned : null;
}

export class ActivityLogRecorder {
  constructor(private readonly activityLogRepository: ActivityLogRepository) {}

  /**
   * Appends an Activity Log. Failures are logged and never thrown to callers.
   */
  async record(input: RecordActivityLogInput): Promise<void> {
    try {
      if (!input.userId || !input.companyId) return;
      await this.activityLogRepository.append({
        id: randomUUID(),
        companyId: input.companyId,
        eventType: input.eventType,
        module: input.module,
        action: input.action,
        description: input.description,
        userId: input.userId,
        employeeId: input.employeeId ?? null,
        resourceType: input.resourceType ?? null,
        resourceId: input.resourceId ?? null,
        resourceNumber: input.resourceNumber ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        metadata: sanitizeMetadata(input.metadata),
      });
    } catch (error) {
      try {
        getLogger().error({ error, action: input.action }, 'Failed to persist activity log');
      } catch {
        // Logger/config failures must never break business use cases.
      }
    }
  }
}
