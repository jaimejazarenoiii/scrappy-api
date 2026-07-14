import type { UserRole } from '../../../shared/policy/roles.js';
import { ForbiddenError, LifecycleConflictError } from '../../../shared/errors/http-exceptions.js';
import type { TripStatus } from './trip-status.js';
import { assertTransition } from './trip-lifecycle.js';

export interface TripProps {
  id: string;
  companyId: string;
  tripNumber: string;
  vehicleId: string;
  status: TripStatus;
  scheduledStart: Date;
  actualStart: Date | null;
  actualEnd: Date | null;
  origin: string;
  destination: string;
  notes: string | null;
  startingOdometer: number | null;
  endingOdometer: number | null;
  loadEnabled: boolean;
  strictLoadValidation: boolean;

  createdByUserId: string | null;
  updatedByUserId: string | null;
  startedByUserId: string | null;
  completedByUserId: string | null;
  cancelledByUserId: string | null;
  cancellationReason: string | null;

  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class TripEntity {
  private constructor(private readonly props: TripProps) {}

  static create(props: TripProps): TripEntity {
    return new TripEntity(props);
  }

  get id(): string {
    return this.props.id;
  }
  get companyId(): string {
    return this.props.companyId;
  }
  get tripNumber(): string {
    return this.props.tripNumber;
  }
  get status(): TripStatus {
    return this.props.status;
  }
  get loadEnabled(): boolean {
    return this.props.loadEnabled;
  }
  get strictLoadValidation(): boolean {
    return this.props.strictLoadValidation;
  }
  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  isDraft(): boolean {
    return this.props.status === 'DRAFT';
  }

  isStarted(): boolean {
    return this.props.status === 'STARTED';
  }

  isCompleted(): boolean {
    return this.props.status === 'COMPLETED';
  }

  isCancelled(): boolean {
    return this.props.status === 'CANCELLED';
  }

  isArchived(): boolean {
    return this.props.deletedAt !== null;
  }

  belongsToCompany(companyId: string): boolean {
    return this.props.companyId === companyId;
  }

  isEditableBy(role: UserRole): boolean {
    if (this.isArchived() || this.isCancelled() || this.isCompleted()) return false;
    if (this.isDraft()) return role === 'OWNER' || role === 'MANAGER';
    return false;
  }

  assertEditableBy(role: UserRole): void {
    if (!this.isEditableBy(role)) {
      if (this.isArchived() || this.isCancelled() || this.isCompleted()) {
        throw new LifecycleConflictError('This trip cannot be modified in its current state.');
      }
      throw new ForbiddenError('You do not have permission to modify this trip.');
    }
  }

  assertStartable(role: UserRole): void {
    assertTransition(this.props.status, 'start', role);
  }

  assertCompletable(role: UserRole): void {
    assertTransition(this.props.status, 'complete', role);
  }

  assertCancellable(role: UserRole): void {
    assertTransition(this.props.status, 'cancel', role);
  }

  assertArchivable(): void {
    if (this.isArchived()) {
      throw new LifecycleConflictError('Archived trips cannot be modified.');
    }
    if (this.isDraft() || this.isStarted()) {
      throw new LifecycleConflictError('Only completed or cancelled trips can be archived.');
    }
  }

  toPrimitives(): TripProps {
    return { ...this.props };
  }
}
