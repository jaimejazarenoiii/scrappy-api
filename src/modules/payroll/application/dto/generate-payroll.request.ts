export interface GeneratePayrollRequestDto {
  payPeriodStart: Date;
  payPeriodEnd: Date;
  employeeIds?: string[];
}
