import type { CompanyResponseDto } from '../../../company/application/dto/company.response.js';

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  company: CompanyResponseDto;
  user: {
    id: string;
    email: string;
    role: 'OWNER' | 'MANAGER' | 'EMPLOYEE';
    passwordChangeRequired: boolean;
  };
}
