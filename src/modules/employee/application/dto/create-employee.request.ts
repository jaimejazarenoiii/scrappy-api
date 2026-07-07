export interface CreateEmployeeRequestDto {
  userId?: string;
  employeeNumber?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  contactNumber?: string;
  weeklySalary: number;
  status?: 'ACTIVE' | 'INACTIVE';
}
