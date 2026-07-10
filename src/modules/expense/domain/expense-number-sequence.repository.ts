export interface ExpenseNumberSequenceRepository {
  allocateNext(companyId: string, sequenceDate: Date): Promise<number>;
}
