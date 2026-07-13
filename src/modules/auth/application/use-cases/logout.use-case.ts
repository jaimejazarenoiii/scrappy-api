import type { SessionRepository } from '../../../session/domain/session.repository.js';
import { logAuthAudit } from '../services/auth-audit.service.js';

export class LogoutUseCase {
  constructor(private readonly sessionRepository: SessionRepository) {}

  async execute(input: {
    sessionId?: string;
    companyId?: string;
    userId?: string;
  }): Promise<{ loggedOut: boolean }> {
    if (input.sessionId) await this.sessionRepository.revoke(input.sessionId);
    if (input.companyId && input.userId) {
      logAuthAudit({
        action: 'auth.logout',
        companyId: input.companyId,
        resourceType: 'session',
        resourceId: input.sessionId,
        actorUserId: input.userId,
      });
    }
    return { loggedOut: true };
  }
}
