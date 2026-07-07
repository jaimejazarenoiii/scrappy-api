export interface UpdateEmployeeRequestDto {
  userId?: string | null;
  employeeNumber?: string | null;
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  suffix?: string | null;
  contactNumber?: string | null;
  weeklySalary?: number;
  status?: 'ACTIVE' | 'INACTIVE';
}
