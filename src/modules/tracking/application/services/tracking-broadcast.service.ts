import type {
  TrackingBroadcastEventType,
  TrackingBroadcastPayload,
  TrackingBroadcastPort,
} from '../../domain/ports/tracking-broadcast.port.js';

type BroadcastHandler = (
  eventType: TrackingBroadcastEventType,
  payload: TrackingBroadcastPayload,
) => void;

/**
 * In-process broadcast hub; WebSocket adapter registers as handler.
 */
export class TrackingBroadcastService implements TrackingBroadcastPort {
  private handler: BroadcastHandler | null = null;

  setHandler(handler: BroadcastHandler | null): void {
    this.handler = handler;
  }

  publish(eventType: TrackingBroadcastEventType, payload: TrackingBroadcastPayload): void {
    this.handler?.(eventType, payload);
  }
}
