import { createHash, randomUUID } from 'node:crypto';
import type {
  TokenProvider,
  AuthTokenPayload,
  TokenPair,
} from '../../../../shared/auth/token-provider.interface.js';
import {
  SessionExpiredError,
  SessionRevokedError,
} from '../../../../shared/errors/http-exceptions.js';
import type { SessionRepository } from '../../../session/domain/session.repository.js';

export class RefreshSessionUseCase {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly tokenProvider: TokenProvider,
  ) {}

  async execute(refreshToken: string): Promise<TokenPair> {
    const payload = this.tokenProvider.verifyRefreshToken(refreshToken);
    const session = await this.sessionRepository.findById(payload.sessionId);
    if (!session) throw new SessionExpiredError();
    if (session.isRevoked()) throw new SessionRevokedError();
    if (session.isExpired()) throw new SessionExpiredError();
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    if (session.tokenHash !== tokenHash) throw new SessionRevokedError();
    const nextSessionId = randomUUID();
    await this.sessionRepository.revoke(session.id);
    const nextPayload: AuthTokenPayload = { ...payload, sessionId: nextSessionId };
    const accessToken = this.tokenProvider.signAccessToken(nextPayload);
    const nextRefreshToken = this.tokenProvider.signRefreshToken(nextPayload);
    const nextHash = createHash('sha256').update(nextRefreshToken).digest('hex');
    await this.sessionRepository.create({
      id: nextSessionId,
      userId: payload.sub,
      tokenHash: nextHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    return {
      accessToken,
      refreshToken: nextRefreshToken,
      expiresIn: this.tokenProvider.getAccessTokenTtlSeconds(),
    };
  }
}
