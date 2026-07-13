import type { UserRole } from '../../../../shared/policy/roles.js';

export interface GrantSystemAccessRequestDto {
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}
