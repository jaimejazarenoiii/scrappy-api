import type { SessionRepository } from '../../../session/domain/session.repository.js';

export class LogoutUseCase {
  constructor(private readonly sessionRepository: SessionRepository) {}
  async execute(sessionId: string | undefined): Promise<{ loggedOut: boolean }> {
    if (sessionId) await this.sessionRepository.revoke(sessionId);
    return { loggedOut: true };
  }
}
