import { randomUUID } from 'node:crypto';
import { getLogger } from '../../../../config/logger.js';
import { ValidationAppError } from '../../../../shared/errors/http-exceptions.js';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { assertValidCoordinates } from '../../domain/coordinates.vo.js';
import { assertNotMockLocation } from '../../domain/tracking-rules.js';
import type { CurrentLocationRepository } from '../../domain/current-location.repository.js';
import type { LocationHistoryRepository } from '../../domain/location-history.repository.js';
import type { TrackingBroadcastPort } from '../../domain/ports/tracking-broadcast.port.js';
import type { UpsertLocationRequestDto } from '../dto/current-location.response.js';
import {
  isStaleCapture,
  toCurrentLocationSummaryDto,
  toLocationBroadcast,
  wasOnlineBefore,
} from '../mappers/current-location.mapper.js';
import { buildRoutePointsForBroadcast } from '../mappers/route-broadcast.mapper.js';
import { assertCanTransmitLocation } from '../policies/tracking-authorization.policy.js';
import { TrackingContextService } from '../services/tracking-context.service.js';
import {
  TRACKING_AUDIT_ACTIONS,
  logTrackingAudit,
  logTrackingLocationAccepted,
  logTrackingRouteBroadcast,
} from '../services/tracking-audit.service.js';
import type { AppendLocationHistoryUseCase } from './append-location-history.use-case.js';

export type TrackingLocationChannel = 'rest' | 'websocket';

export interface UpsertLocationOptions {
  channel?: TrackingLocationChannel;
}

export class UpsertCurrentLocationUseCase {
  constructor(
    private readonly currentLocationRepository: CurrentLocationRepository,
    private readonly trackingContextService: TrackingContextService,
    private readonly broadcastPort: TrackingBroadcastPort,
    private readonly appendLocationHistoryUseCase?: AppendLocationHistoryUseCase,
    private readonly locationHistoryRepository?: LocationHistoryRepository,
  ) {}

  async execute(
    auth: AuthorizationContext,
    input: UpsertLocationRequestDto,
    options: UpsertLocationOptions = {},
  ) {
    const channel = options.channel ?? 'rest';
    assertCanTransmitLocation(auth);
    assertNotMockLocation(input.isMockLocation);
    assertValidCoordinates(input.latitude, input.longitude);

    const capturedAt = new Date(input.capturedAt);
    if (Number.isNaN(capturedAt.getTime())) {
      throw new ValidationAppError('Invalid capture timestamp.');
    }

    const context = await this.trackingContextService.resolveForTransmit(auth);
    const existing = await this.currentLocationRepository.findByEmployeeId(
      context.employeeId,
      auth.companyId,
    );

    if (isStaleCapture(existing, capturedAt)) {
      throw new ValidationAppError('Location timestamp is older than the current location.', [
        { path: 'capturedAt', message: 'Stale location update rejected.' },
      ]);
    }

    const previouslyOnline = wasOnlineBefore(existing);
    const isFirstForTrip = !existing || existing.toPrimitives().tripId !== context.tripId;

    const saved = await this.currentLocationRepository.upsert({
      id: existing?.toPrimitives().id ?? randomUUID(),
      companyId: auth.companyId,
      employeeId: context.employeeId,
      tripId: context.tripId,
      latitude: input.latitude,
      longitude: input.longitude,
      speed: input.speed ?? null,
      heading: input.heading ?? null,
      accuracy: input.accuracy ?? null,
      batteryLevel: input.batteryLevel ?? null,
      isMockLocation: false,
      lastSeenAt: capturedAt,
    });

    const summary = toCurrentLocationSummaryDto(saved, context.tripNumber);

    let historyAppended = false;
    if (this.appendLocationHistoryUseCase) {
      try {
        historyAppended = await this.appendLocationHistoryUseCase.execute({
          companyId: auth.companyId,
          employeeId: context.employeeId,
          tripId: context.tripId,
          latitude: input.latitude,
          longitude: input.longitude,
          capturedAt,
          accuracy: input.accuracy ?? null,
          speed: input.speed ?? null,
          heading: input.heading ?? null,
          batteryLevel: input.batteryLevel ?? null,
        });
      } catch (error: unknown) {
        getLogger().error(
          {
            error,
            companyId: auth.companyId,
            employeeId: context.employeeId,
            tripId: context.tripId,
          },
          'failed to append location history',
        );
      }
    }

    const broadcastLocation = toLocationBroadcast(saved);
    if (this.locationHistoryRepository) {
      try {
        broadcastLocation.points = await buildRoutePointsForBroadcast(
          this.locationHistoryRepository,
          {
            companyId: auth.companyId,
            employeeId: context.employeeId,
            tripId: context.tripId,
            latitude: input.latitude,
            longitude: input.longitude,
            capturedAt,
            accuracy: input.accuracy ?? null,
            speed: input.speed ?? null,
            heading: input.heading ?? null,
            batteryLevel: input.batteryLevel ?? null,
          },
        );
      } catch (error: unknown) {
        getLogger().error(
          {
            error,
            companyId: auth.companyId,
            employeeId: context.employeeId,
            tripId: context.tripId,
          },
          'failed to build route points for websocket broadcast',
        );
        broadcastLocation.points = [
          {
            latitude: input.latitude,
            longitude: input.longitude,
            capturedAt: capturedAt.toISOString(),
            accuracy: input.accuracy ?? null,
            speed: input.speed ?? null,
            heading: input.heading ?? null,
            batteryLevel: input.batteryLevel ?? null,
          },
        ];
      }
    } else {
      broadcastLocation.points = [
        {
          latitude: input.latitude,
          longitude: input.longitude,
          capturedAt: capturedAt.toISOString(),
          accuracy: input.accuracy ?? null,
          speed: input.speed ?? null,
          heading: input.heading ?? null,
          batteryLevel: input.batteryLevel ?? null,
        },
      ];
    }

    this.broadcastPort.publish('location:updated', {
      companyId: auth.companyId,
      tripId: context.tripId,
      location: broadcastLocation,
    });

    logTrackingLocationAccepted({
      companyId: auth.companyId,
      employeeId: context.employeeId,
      tripId: context.tripId,
      tripNumber: context.tripNumber,
      userId: auth.userId,
      channel,
      capturedAt: capturedAt.toISOString(),
      routePointCount: broadcastLocation.points.length,
      historyAppended,
      latitude: input.latitude,
      longitude: input.longitude,
      accuracy: input.accuracy ?? null,
      batteryLevel: input.batteryLevel ?? null,
    });
    logTrackingRouteBroadcast({
      companyId: auth.companyId,
      tripId: context.tripId,
      employeeId: context.employeeId,
      routePointCount: broadcastLocation.points.length,
    });

    if (isFirstForTrip) {
      this.broadcastPort.publish('tracking:started', {
        companyId: auth.companyId,
        tripId: context.tripId,
        tripNumber: context.tripNumber,
        lastSeenAt: capturedAt.toISOString(),
      });
      logTrackingAudit({
        action: TRACKING_AUDIT_ACTIONS.STARTED,
        companyId: auth.companyId,
        resourceType: 'trip',
        resourceId: context.tripId,
        actorUserId: auth.userId,
        metadata: {
          tripNumber: context.tripNumber,
          employeeId: context.employeeId,
        },
      });
    }

    if (!previouslyOnline) {
      this.broadcastPort.publish('employee:online', {
        companyId: auth.companyId,
        tripId: context.tripId,
        lastSeenAt: capturedAt.toISOString(),
      });
    }

    return summary;
  }
}
