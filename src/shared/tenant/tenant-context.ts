import type { UserRole } from '../policy/roles.js';

export interface TenantContext {
  companyId: string;
  userId: string;
  role: UserRole;
  sessionId?: string;
  email?: string;
}
