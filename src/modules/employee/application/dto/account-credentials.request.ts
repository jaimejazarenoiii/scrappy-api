import type { UserRole } from '../../../../shared/policy/roles.js';

export interface AccountCredentialsRequestDto {
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}
