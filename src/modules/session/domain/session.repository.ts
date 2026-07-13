import type { RefreshSessionEntity } from './refresh-session.entity.js';

export interface CreateRefreshSessionInput {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface SessionRepository {
  create(input: CreateRefreshSessionInput): Promise<RefreshSessionEntity>;
  findById(sessionId: string): Promise<RefreshSessionEntity | null>;
  revoke(sessionId: string): Promise<void>;
  /** Revokes all refresh sessions for a user (e.g. on disable system access). */
  revokeAllForUser(userId: string): Promise<void>;
}
