import type { UserRole } from '../../../../shared/policy/roles.js';
import type { UserStatus } from '../../../user/domain/user.entity.js';

export interface LinkedUserSummaryDto {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export function toLinkedUserSummary(user: {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}): LinkedUserSummaryDto {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  };
}
