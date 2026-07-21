import type { CurrentLocationEntity } from './current-location.entity.js';

export interface UpsertCurrentLocationInput {
  id: string;
  companyId: string;
  employeeId: string;
  tripId: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
  batteryLevel: number | null;
  isMockLocation: boolean;
  lastSeenAt: Date;
}

export interface ListActiveLocationFilters {
  tripId?: string;
  employeeId?: string;
}

export interface CurrentLocationRepository {
  upsert(input: UpsertCurrentLocationInput): Promise<CurrentLocationEntity>;
  findByEmployeeId(employeeId: string, companyId: string): Promise<CurrentLocationEntity | null>;
  findByTripId(companyId: string, tripId: string): Promise<CurrentLocationEntity[]>;
  findActiveByCompany(
    companyId: string,
    filters?: ListActiveLocationFilters,
  ): Promise<CurrentLocationEntity[]>;
  clearTripAssociation(tripId: string, companyId: string): Promise<string[]>;
  findWithActiveTripOlderThan(companyId: string, threshold: Date): Promise<CurrentLocationEntity[]>;
  findDistinctCompanyIdsWithActiveTracking(): Promise<string[]>;
}
