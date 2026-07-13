import type { UserRole } from '../../../../shared/policy/roles.js';

export interface CurrentUserResponseDto {
  id: string;
  companyId: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
  employeeId: string | null;
  passwordChangeRequired: boolean;
}
