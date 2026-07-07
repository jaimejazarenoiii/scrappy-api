import type { UserRole } from '../shared/policy/roles.js';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      auth?: {
        userId: string;
        companyId: string;
        role: UserRole;
        sessionId?: string;
        email?: string;
      };
      companyContext?: {
        companyId: string;
      };
      validatedQuery?: unknown;
    }
  }
}

export {};
