export interface CurrentUserResponseDto {
  id: string;
  companyId: string;
  email: string;
  role: 'OWNER' | 'MANAGER' | 'EMPLOYEE';
  status: 'ACTIVE' | 'INACTIVE';
  employeeId: string | null;
  passwordChangeRequired: boolean;
}
