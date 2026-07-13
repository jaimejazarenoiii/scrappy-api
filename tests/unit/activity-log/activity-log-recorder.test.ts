import { describe, expect, it, vi } from 'vitest';
import { ActivityLogRecorder } from '../../../src/modules/activity-log/application/services/activity-log-recorder.service.js';
import { InMemoryActivityLogRepository } from '../../setup/in-memory-activity-log-repository.js';
import { setupTestEnv } from '../../setup/test-app.js';

describe('ActivityLogRecorder', () => {
  it('appends sanitized activity logs', async () => {
    const repo = new InMemoryActivityLogRepository();
    const recorder = new ActivityLogRecorder(repo);

    await recorder.record({
      companyId: 'c1',
      eventType: 'AUTHENTICATION',
      module: 'user',
      action: 'user.password_changed',
      description: 'Password changed',
      userId: 'u1',
      metadata: {
        password: 'secret',
        temporaryPassword: 'tmp',
        reason: 'self-service',
      },
    });

    expect(repo.items).toHaveLength(1);
    expect(repo.items[0]!.metadata).toEqual({ reason: 'self-service' });
    expect(repo.items[0]!.metadata).not.toHaveProperty('password');
  });

  it('skips when companyId or userId missing', async () => {
    const repo = new InMemoryActivityLogRepository();
    const recorder = new ActivityLogRecorder(repo);
    await recorder.record({
      companyId: '',
      eventType: 'AUTHENTICATION',
      module: 'auth',
      action: 'auth.login',
      description: 'User logged in',
      userId: 'u1',
    });
    expect(repo.items).toHaveLength(0);
  });

  it('swallows repository failures', async () => {
    setupTestEnv();
    const repo = {
      append: vi.fn().mockRejectedValue(new Error('db down')),
      findById: vi.fn(),
      list: vi.fn(),
    };
    const recorder = new ActivityLogRecorder(repo);
    await expect(
      recorder.record({
        companyId: 'c1',
        eventType: 'COMPANY',
        module: 'company',
        action: 'company.updated',
        description: 'Company updated',
        userId: 'u1',
      }),
    ).resolves.toBeUndefined();
  });
});
