import { describe, expect, it } from 'vitest';
import { ActivityLogRecorder } from '../../../src/modules/activity-log/application/services/activity-log-recorder.service.js';
import { persistActivityLogFromAudit } from '../../../src/shared/audit/activity-log-bridge.js';
import { registerActivityLogRecorder } from '../../../src/shared/audit/activity-log-bridge.js';
import { InMemoryActivityLogRepository } from '../../setup/in-memory-activity-log-repository.js';

describe('password activity log events', () => {
  it('omits secrets from password change and admin reset metadata', async () => {
    const repo = new InMemoryActivityLogRepository();
    const recorder = new ActivityLogRecorder(repo);
    registerActivityLogRecorder(recorder);

    persistActivityLogFromAudit({
      action: 'user.password_changed',
      companyId: 'c1',
      actorUserId: 'u1',
      resourceType: 'user',
      resourceId: 'u1',
      metadata: { password: 'x', newPassword: 'y', confirmPassword: 'y' },
    });
    persistActivityLogFromAudit({
      action: 'user.password_admin_reset',
      companyId: 'c1',
      actorUserId: 'owner',
      resourceType: 'user',
      resourceId: 'u2',
      metadata: { temporaryPassword: 'tmp-123', token: 'abc' },
    });

    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(repo.items).toHaveLength(2);
    for (const item of repo.items) {
      expect(JSON.stringify(item.metadata ?? {})).not.toMatch(/password|tmp-123|token/i);
    }

    registerActivityLogRecorder(null);
  });
});
