import type { TripEntity } from './trip.entity.js';
import type { TripStatus } from './trip-status.js';
import type { TripMemberRole } from './trip-member-role.js';
import type { TripMemberEntity } from './trip-member.entity.js';

export interface TripMemberInput {
  employeeId: string;
  role: TripMemberRole;
}

export interface UpdateTripMemberInput {
  role: TripMemberRole;
}

export interface CreateTripInput {
  id: string;
  companyId: string;
  tripNumber: string;
  vehicleId: string;
  status: TripStatus;
  scheduledStart: Date;
  origin: string;
  destination: string;
  notes: string | null;
  createdByUserId: string | null;
  updatedByUserId: string | null;
  members?: TripMemberInput[];
}

export interface UpdateTripInput {
  vehicleId?: string;
  scheduledStart?: Date;
  origin?: string;
  destination?: string;
  notes?: string | null;
  updatedByUserId?: string | null;
}

export interface UpdateTripLoadFlagsInput {
  loadEnabled?: boolean;
  strictLoadValidation?: boolean;
  updatedByUserId?: string | null;
}

export interface StartTripInput {
  actualStart: Date;
  startedByUserId: string;
  startingOdometer?: number | null;
}

export interface CompleteTripInput {
  actualEnd: Date;
  completedByUserId: string;
  endingOdometer?: number | null;
}

export interface CancelTripInput {
  cancelledByUserId: string;
  cancellationReason: string;
}

export interface ArchiveTripInput {
  archivedByUserId: string;
}

export interface ListTripQuery {
  page: number;
  limit: number;
  sortBy?: 'scheduledStart' | 'createdAt' | 'tripNumber';
  sortOrder?: 'asc' | 'desc';
  status?: TripStatus;
  vehicleId?: string;
  employeeId?: string;
  fromDate?: Date;
  toDate?: Date;
  tripNumber?: string;
  includeArchived?: boolean;
}

export interface ListTripResult {
  items: TripEntity[];
  total: number;
}

export interface TripDashboardCounts {
  draftCount: number;
  scheduledCount: number;
  startedCount: number;
  completedCount: number;
  cancelledCount: number;
}

export interface TripVehicleSummary {
  id: string;
  plateNumber: string;
  description: string | null;
  status: string;
}

export interface TripSummaryProjection {
  id: string;
  companyId: string;
  tripNumber: string;
  status: TripStatus;
  scheduledStart: Date;
  actualStart: Date | null;
  actualEnd: Date | null;
  origin: string;
  destination: string;
  notes: string | null;
  startingOdometer: number | null;
  endingOdometer: number | null;
  /** Computed as ending − starting when both readings are present. */
  distance: number | null;
  loadEnabled: boolean;
  strictLoadValidation: boolean;
  vehicle: TripVehicleSummary;
}

export interface TripMemberDetailProjection {
  id: string;
  tripId: string;
  employeeId: string;
  role: TripMemberRole;
  firstName: string;
  lastName: string;
  employeeNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TripDetailProjection extends TripSummaryProjection {
  members: TripMemberDetailProjection[];
  linkedTransactionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListTripSummariesResult {
  items: TripSummaryProjection[];
  total: number;
}

export interface TripRepository {
  create(input: CreateTripInput): Promise<TripEntity>;
  update(tripId: string, companyId: string, input: UpdateTripInput): Promise<TripEntity>;
  updateLoadFlags(
    tripId: string,
    companyId: string,
    input: UpdateTripLoadFlagsInput,
  ): Promise<TripEntity>;
  start(tripId: string, companyId: string, input: StartTripInput): Promise<TripEntity>;
  complete(tripId: string, companyId: string, input: CompleteTripInput): Promise<TripEntity>;
  cancel(tripId: string, companyId: string, input: CancelTripInput): Promise<TripEntity>;
  archive(tripId: string, companyId: string, input: ArchiveTripInput): Promise<TripEntity>;

  findById(tripId: string, companyId: string): Promise<TripEntity | null>;
  findByTripNumber(tripNumber: string, companyId: string): Promise<TripEntity | null>;
  findDetailById(tripId: string, companyId: string): Promise<TripDetailProjection | null>;

  listByCompany(companyId: string, query: ListTripQuery): Promise<ListTripResult>;
  listSummariesByCompany(companyId: string, query: ListTripQuery): Promise<ListTripSummariesResult>;
  listMine(companyId: string, employeeId: string, query: ListTripQuery): Promise<ListTripResult>;
  getDashboardCounts(companyId: string): Promise<TripDashboardCounts>;

  // Members
  listMembers(tripId: string, companyId: string): Promise<TripMemberEntity[]>;
  findMemberByTripAndEmployee(
    tripId: string,
    companyId: string,
    employeeId: string,
  ): Promise<TripMemberEntity | null>;
  addMember(tripId: string, companyId: string, input: TripMemberInput): Promise<TripMemberEntity>;
  updateMember(
    tripId: string,
    companyId: string,
    memberId: string,
    input: UpdateTripMemberInput,
  ): Promise<TripMemberEntity>;
  removeMember(tripId: string, companyId: string, memberId: string): Promise<void>;

  // Concurrency and derived state
  findStartedTripByVehicle(vehicleId: string, companyId: string): Promise<TripEntity | null>;
  findStartedTripByEmployee(employeeId: string, companyId: string): Promise<TripEntity | null>;
  findStartedTripIdsByEmployeeId(employeeId: string, companyId: string): Promise<string[]>;
}
