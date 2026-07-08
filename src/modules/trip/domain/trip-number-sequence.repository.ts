export interface TripNumberSequenceRepository {
  allocateNext(companyId: string, sequenceDate: Date): Promise<number>;
}
