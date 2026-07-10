export interface CreateCashAdvanceRequestDto {
  employeeId: string;
  amount: number;
  reason?: string;
  issuedAt?: Date;
}
