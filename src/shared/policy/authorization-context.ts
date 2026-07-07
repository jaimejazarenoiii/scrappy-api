import type { UserRole } from './roles.js';

export interface AuthorizationContext {
  companyId: string;
  userId: string;
  role: UserRole;
}
