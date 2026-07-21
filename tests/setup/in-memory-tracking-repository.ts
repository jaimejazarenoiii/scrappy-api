import { randomUUID } from 'node:crypto';
import { CurrentLocationEntity } from '../../src/modules/tracking/domain/current-location.entity.js';
import type {
  CurrentLocationRepository,
  ListActiveLocationFilters,
  UpsertCurrentLocationInput,
} from '../../src/modules/tracking/domain/current-location.repository.js';

export class InMemoryCurrentLocationRepository implements CurrentLocationRepository {
  private readonly byEmployee = new Map<string, CurrentLocationEntity>();

  async upsert(input: UpsertCurrentLocationInput): Promise<CurrentLocationEntity> {
    const existing = this.byEmployee.get(input.employeeId);
    if (existing && input.lastSeenAt.getTime() < existing.toPrimitives().lastSeenAt.getTime()) {
      return existing;
    }

    const entity = CurrentLocationEntity.create({
      id: existing?.toPrimitives().id ?? input.id ?? randomUUID(),
      companyId: input.companyId,
      employeeId: input.employeeId,
      tripId: input.tripId,
      latitude: input.latitude,
      longitude: input.longitude,
      speed: input.speed,
      heading: input.heading,
      accuracy: input.accuracy,
      batteryLevel: input.batteryLevel,
      isMockLocation: false,
      lastSeenAt: input.lastSeenAt,
      createdAt: existing?.toPrimitives().createdAt ?? new Date(),
      updatedAt: new Date(),
    });
    this.byEmployee.set(input.employeeId, entity);
    return entity;
  }

  async findByEmployeeId(
    employeeId: string,
    companyId: string,
  ): Promise<CurrentLocationEntity | null> {
    const row = this.byEmployee.get(employeeId);
    if (!row || row.toPrimitives().companyId !== companyId) return null;
    return row;
  }

  async findByTripId(companyId: string, tripId: string): Promise<CurrentLocationEntity[]> {
    return Array.from(this.byEmployee.values()).filter(
      (row) => row.toPrimitives().companyId === companyId && row.toPrimitives().tripId === tripId,
    );
  }

  async findActiveByCompany(
    companyId: string,
    filters: ListActiveLocationFilters = {},
  ): Promise<CurrentLocationEntity[]> {
    return Array.from(this.byEmployee.values()).filter((row) => {
      const props = row.toPrimitives();
      if (props.companyId !== companyId || !props.tripId) return false;
      if (filters.tripId && props.tripId !== filters.tripId) return false;
      if (filters.employeeId && props.employeeId !== filters.employeeId) return false;
      return true;
    });
  }

  async clearTripAssociation(tripId: string, companyId: string): Promise<string[]> {
    const affected: string[] = [];
    for (const [employeeId, row] of this.byEmployee.entries()) {
      const props = row.toPrimitives();
      if (props.companyId === companyId && props.tripId === tripId) {
        this.byEmployee.set(employeeId, row.clearTripAssociation());
        affected.push(employeeId);
      }
    }
    return affected;
  }

  async findWithActiveTripOlderThan(
    companyId: string,
    threshold: Date,
  ): Promise<CurrentLocationEntity[]> {
    return Array.from(this.byEmployee.values()).filter((row) => {
      const props = row.toPrimitives();
      return (
        props.companyId === companyId &&
        props.tripId != null &&
        props.lastSeenAt.getTime() < threshold.getTime()
      );
    });
  }

  async findDistinctCompanyIdsWithActiveTracking(): Promise<string[]> {
    const companyIds = new Set<string>();
    for (const row of this.byEmployee.values()) {
      const props = row.toPrimitives();
      if (props.tripId) companyIds.add(props.companyId);
    }
    return Array.from(companyIds);
  }
}
