import type { CompanyResponseDto } from '../../../company/application/dto/company.response.js';
import type { UserRole } from '../../../../shared/policy/roles.js';

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  company: CompanyResponseDto;
  user: {
    id: string;
    email: string;
    role: UserRole;
    passwordChangeRequired: boolean;
  };
}
