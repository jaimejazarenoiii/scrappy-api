import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import type {
  GetTrackingSessionQueryDto,
  TrackingSessionResponseDto,
} from '../dto/tracking-session.response.js';
import { assertCanTransmitLocation } from '../policies/tracking-authorization.policy.js';
import type { TrackingSessionService } from '../services/tracking-session.service.js';

export class GetTrackingSessionUseCase {
  constructor(private readonly trackingSessionService: TrackingSessionService) {}

  async execute(
    auth: AuthorizationContext,
    query: GetTrackingSessionQueryDto = {},
  ): Promise<TrackingSessionResponseDto> {
    assertCanTransmitLocation(auth);
    return this.trackingSessionService.resolve(auth, query);
  }
}
