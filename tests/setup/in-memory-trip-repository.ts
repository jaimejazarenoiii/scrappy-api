import { randomUUID } from 'node:crypto';
import { TripEntity } from '../../src/modules/trip/domain/trip.entity.js';
import { BusinessRuleViolationError } from '../../src/shared/errors/http-exceptions.js';
import type {
  CreateTripInput,
  TripDashboardCounts,
  TripRepository,
  ListTripResult,
  ListTripSummariesResult,
  TripDetailProjection,
  TripMemberInput,
  UpdateTripInput,
  UpdateTripLoadFlagsInput,
  StartTripInput,
  CompleteTripInput,
  CancelTripInput,
  ArchiveTripInput,
  UpdateTripMemberInput,
} from '../../src/modules/trip/domain/trip.repository.js';
import type { TripMemberEntity } from '../../src/modules/trip/domain/trip-member.entity.js';
import { TripMemberEntity as TripMemberEntityClass } from '../../src/modules/trip/domain/trip-member.entity.js';
import type { InMemoryVehicleRepository } from './in-memory-repositories.js';
import type { InMemoryEmployeeRepository } from './in-memory-repositories.js';

const NOT_IMPLEMENTED = 'Trip operation not implemented yet';

interface StoredTripMember {
  id: string;
  tripId: string;
  employeeId: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export class InMemoryTripRepository implements TripRepository {
  public trips = new Map<string, TripEntity>();
  public members = new Map<string, StoredTripMember>();
  public sequences = new Map<string, number>();

  constructor(
    private readonly vehicleRepository?: InMemoryVehicleRepository,
    private readonly employeeRepository?: InMemoryEmployeeRepository,
  ) {}

  async create(input: CreateTripInput): Promise<TripEntity> {
    const now = new Date();
    const trip = TripEntity.create({
      id: input.id,
      companyId: input.companyId,
      tripNumber: input.tripNumber,
      vehicleId: input.vehicleId,
      status: input.status,
      scheduledStart: input.scheduledStart,
      actualStart: null,
      actualEnd: null,
      origin: input.origin,
      destination: input.destination,
      notes: input.notes,
      loadEnabled: true,
      strictLoadValidation: false,
      createdByUserId: input.createdByUserId,
      updatedByUserId: input.updatedByUserId,
      startedByUserId: null,
      completedByUserId: null,
      cancelledByUserId: null,
      cancellationReason: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
    this.trips.set(trip.id, trip);

    for (const member of input.members ?? []) {
      const id = randomUUID();
      this.members.set(id, {
        id,
        tripId: trip.id,
        employeeId: member.employeeId,
        role: member.role,
        createdAt: now,
        updatedAt: now,
      });
    }

    return trip;
  }

  async findById(tripId: string, companyId: string): Promise<TripEntity | null> {
    const trip = this.trips.get(tripId);
    if (!trip || trip.companyId !== companyId || trip.deletedAt) return null;
    return trip;
  }

  async findByTripNumber(tripNumber: string, companyId: string): Promise<TripEntity | null> {
    for (const trip of this.trips.values()) {
      if (trip.tripNumber === tripNumber && trip.companyId === companyId && !trip.deletedAt) {
        return trip;
      }
    }
    return null;
  }

  async findDetailById(tripId: string, companyId: string): Promise<TripDetailProjection | null> {
    const trip = await this.findById(tripId, companyId);
    if (!trip) return null;
    const props = trip.toPrimitives();
    const vehicle = this.vehicleRepository?.vehicles.get(props.vehicleId);
    const vehicleProps = vehicle?.toPrimitives();
    const tripMembers = [...this.members.values()].filter((member) => member.tripId === tripId);

    return {
      id: props.id,
      companyId: props.companyId,
      tripNumber: props.tripNumber,
      status: props.status,
      scheduledStart: props.scheduledStart,
      actualStart: props.actualStart,
      actualEnd: props.actualEnd,
      origin: props.origin,
      destination: props.destination,
      notes: props.notes,
      loadEnabled: props.loadEnabled,
      strictLoadValidation: props.strictLoadValidation,
      vehicle: {
        id: props.vehicleId,
        plateNumber: vehicleProps?.plateNumber ?? 'UNKNOWN',
        description: vehicleProps?.description ?? null,
        status: vehicleProps?.status ?? 'AVAILABLE',
      },
      members: tripMembers.map((member) => {
        const employee = this.employeeRepository?.employees.get(member.employeeId);
        const employeeProps = employee?.toPrimitives();
        return {
          id: member.id,
          tripId: member.tripId,
          employeeId: member.employeeId,
          role: member.role,
          firstName: employeeProps?.firstName ?? 'Unknown',
          lastName: employeeProps?.lastName ?? 'Employee',
          employeeNumber: employeeProps?.employeeNumber ?? null,
          createdAt: member.createdAt,
          updatedAt: member.updatedAt,
        };
      }),
      linkedTransactionCount: 0,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  async listMembers(tripId: string, companyId: string): Promise<TripMemberEntity[]> {
    const trip = await this.findById(tripId, companyId);
    if (!trip) return [];
    return [...this.members.values()]
      .filter((member) => member.tripId === tripId)
      .map((member) =>
        TripMemberEntityClass.create({
          id: member.id,
          tripId: member.tripId,
          employeeId: member.employeeId,
          role: member.role as 'DRIVER' | 'HELPER' | 'SUPERVISOR',
          createdAt: member.createdAt,
          updatedAt: member.updatedAt,
        }),
      );
  }

  async listByCompany(): Promise<ListTripResult> {
    return { items: [], total: 0 };
  }

  async listSummariesByCompany(): Promise<ListTripSummariesResult> {
    return { items: [], total: 0 };
  }

  async listMine(): Promise<ListTripResult> {
    return { items: [], total: 0 };
  }

  async getDashboardCounts(): Promise<TripDashboardCounts> {
    const now = new Date();
    let draftCount = 0;
    let scheduledCount = 0;
    let startedCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;

    for (const trip of this.trips.values()) {
      if (trip.deletedAt) continue;
      const status = trip.status;
      if (status === 'STARTED') startedCount += 1;
      else if (status === 'COMPLETED') completedCount += 1;
      else if (status === 'CANCELLED') cancelledCount += 1;
      else if (status === 'DRAFT') {
        if (trip.toPrimitives().scheduledStart > now) scheduledCount += 1;
        else draftCount += 1;
      }
    }

    return { draftCount, scheduledCount, startedCount, completedCount, cancelledCount };
  }

  async update(_tripId: string, _companyId: string, _input: UpdateTripInput): Promise<never> {
    throw new BusinessRuleViolationError(NOT_IMPLEMENTED);
  }
  async updateLoadFlags(
    tripId: string,
    companyId: string,
    input: UpdateTripLoadFlagsInput,
  ): Promise<TripEntity> {
    const trip = await this.findById(tripId, companyId);
    if (!trip) throw new BusinessRuleViolationError('Trip not found');
    const props = trip.toPrimitives();
    const updated = TripEntity.create({
      ...props,
      loadEnabled: true,
      strictLoadValidation: input.strictLoadValidation ?? props.strictLoadValidation,
      updatedByUserId:
        input.updatedByUserId !== undefined ? input.updatedByUserId : props.updatedByUserId,
      updatedAt: new Date(),
    });
    this.trips.set(tripId, updated);
    return updated;
  }
  async start(tripId: string, companyId: string, input: StartTripInput): Promise<TripEntity> {
    const trip = await this.findById(tripId, companyId);
    if (!trip) throw new BusinessRuleViolationError('Trip not found');
    const props = trip.toPrimitives();
    const updated = TripEntity.create({
      ...props,
      status: 'STARTED',
      actualStart: input.actualStart,
      startedByUserId: input.startedByUserId,
      updatedAt: new Date(),
    });
    this.trips.set(tripId, updated);
    return updated;
  }
  async complete(_tripId: string, _companyId: string, _input: CompleteTripInput): Promise<never> {
    throw new BusinessRuleViolationError(NOT_IMPLEMENTED);
  }
  async cancel(_tripId: string, _companyId: string, _input: CancelTripInput): Promise<never> {
    throw new BusinessRuleViolationError(NOT_IMPLEMENTED);
  }
  async archive(_tripId: string, _companyId: string, _input: ArchiveTripInput): Promise<never> {
    throw new BusinessRuleViolationError(NOT_IMPLEMENTED);
  }
  async findMemberByTripAndEmployee(): Promise<never> {
    throw new BusinessRuleViolationError(NOT_IMPLEMENTED);
  }
  async addMember(_tripId: string, _companyId: string, _input: TripMemberInput): Promise<never> {
    throw new BusinessRuleViolationError(NOT_IMPLEMENTED);
  }
  async updateMember(
    _tripId: string,
    _companyId: string,
    _memberId: string,
    _input: UpdateTripMemberInput,
  ): Promise<never> {
    throw new BusinessRuleViolationError(NOT_IMPLEMENTED);
  }
  async removeMember(): Promise<never> {
    throw new BusinessRuleViolationError(NOT_IMPLEMENTED);
  }
  async findStartedTripByVehicle(vehicleId: string, companyId: string): Promise<TripEntity | null> {
    for (const trip of this.trips.values()) {
      if (
        trip.companyId === companyId &&
        trip.vehicleId === vehicleId &&
        trip.status === 'STARTED' &&
        !trip.deletedAt
      ) {
        return trip;
      }
    }
    return null;
  }

  async findStartedTripByEmployee(
    employeeId: string,
    companyId: string,
  ): Promise<TripEntity | null> {
    for (const member of this.members.values()) {
      if (member.employeeId !== employeeId) continue;
      const trip = this.trips.get(member.tripId);
      if (trip && trip.companyId === companyId && trip.status === 'STARTED' && !trip.deletedAt) {
        return trip;
      }
    }
    return null;
  }

  async findStartedTripIdsByEmployeeId(employeeId: string, companyId: string): Promise<string[]> {
    const ids: string[] = [];
    for (const member of this.members.values()) {
      if (member.employeeId !== employeeId) continue;
      const trip = this.trips.get(member.tripId);
      if (trip && trip.companyId === companyId && trip.status === 'STARTED' && !trip.deletedAt) {
        ids.push(trip.id);
      }
    }
    return ids;
  }
}

export class InMemoryTripNumberSequenceRepository {
  private readonly sequences = new Map<string, number>();

  async allocateNext(companyId: string, sequenceDate: Date): Promise<number> {
    const key = `${companyId}:${sequenceDate.toISOString().slice(0, 10)}`;
    const next = (this.sequences.get(key) ?? 0) + 1;
    this.sequences.set(key, next);
    return next;
  }
}
