import type { IncomingMessage } from 'node:http';
import type { Server } from 'node:http';
import type { Duplex } from 'node:stream';
import { WebSocket, WebSocketServer } from 'ws';
import { AppError } from '../../../shared/errors/app-error.js';
import type { TokenProvider } from '../../../shared/auth/token-provider.interface.js';
import type { AuthorizationContext } from '../../../shared/policy/authorization-context.js';
import type {
  TrackingBroadcastEventType,
  TrackingBroadcastPayload,
} from '../domain/ports/tracking-broadcast.port.js';
import type { TrackingBroadcastService } from '../application/services/tracking-broadcast.service.js';
import type { UpsertCurrentLocationUseCase } from '../application/use-cases/upsert-current-location.use-case.js';
import { logTrackingLocationRejected } from '../application/services/tracking-audit.service.js';
import { wsClientMessageSchema } from './tracking.schemas.js';

interface TrackedSocket extends WebSocket {
  auth?: AuthorizationContext;
  rooms?: Set<string>;
  lastLocationUpdateAt?: number;
}

const WS_LOCATION_MIN_INTERVAL_MS = 1000;

function extractWsToken(req: IncomingMessage): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice('Bearer '.length);

  try {
    const url = new URL(req.url ?? '', 'http://localhost');
    const token = url.searchParams.get('access_token');
    if (token) return token;
  } catch {
    return undefined;
  }
  return undefined;
}

function roomCompany(companyId: string): string {
  return `company:${companyId}:tracking:live`;
}

function roomTrip(companyId: string, tripId: string): string {
  return `company:${companyId}:trip:${tripId}`;
}

function roomAdminCompany(companyId: string): string {
  return `platform:company:${companyId}:tracking`;
}

export class TrackingWebSocketGateway {
  private wss: WebSocketServer | null = null;
  private readonly sockets = new Set<TrackedSocket>();

  constructor(
    private readonly tokenProvider: TokenProvider,
    private readonly broadcastService: TrackingBroadcastService,
    private readonly upsertCurrentLocationUseCase: UpsertCurrentLocationUseCase,
  ) {}

  attach(server: Server, path: string): void {
    this.wss = new WebSocketServer({ noServer: true });
    this.broadcastService.setHandler((eventType, payload) => this.fanOut(eventType, payload));

    server.on('upgrade', (req, socket, head) => {
      const url = new URL(req.url ?? '', 'http://localhost');
      if (url.pathname !== path) return;

      void this.handleUpgrade(req, socket, head);
    });
  }

  private async handleUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer): Promise<void> {
    const token = extractWsToken(req);
    if (!token || !this.wss) {
      socket.destroy();
      return;
    }

    try {
      const payload = this.tokenProvider.verifyAccessToken(token);
      const auth: AuthorizationContext = {
        userId: payload.sub,
        companyId: payload.companyId,
        role: payload.role,
      };

      this.wss.handleUpgrade(req, socket, head, (ws) => {
        const tracked = ws as TrackedSocket;
        tracked.auth = auth;
        tracked.rooms = new Set();
        this.sockets.add(tracked);

        tracked.on('close', () => {
          this.sockets.delete(tracked);
        });

        tracked.on('message', (raw) => {
          void this.handleMessage(tracked, raw.toString()).catch(() => {
            this.send(tracked, 'error', { code: 'INTERNAL_ERROR', message: 'Message failed' });
          });
        });

        this.wss!.emit('connection', tracked, req);
        this.send(tracked, 'tracking:connected', {
          userId: auth.userId,
          role: auth.role,
        });
      });
    } catch {
      socket.destroy();
    }
  }

  private async handleMessage(ws: TrackedSocket, raw: string): Promise<void> {
    if (!ws.auth) return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      this.send(ws, 'error', { code: 'VALIDATION_ERROR', message: 'Invalid JSON message' });
      return;
    }

    const result = wsClientMessageSchema.safeParse(parsed);
    if (!result.success) {
      this.send(ws, 'error', { code: 'VALIDATION_ERROR', message: 'Invalid message shape' });
      return;
    }

    const message = result.data;
    switch (message.type) {
      case 'ping':
        this.send(ws, 'pong', {});
        return;
      case 'subscribe:company':
        if (ws.auth.role !== 'OWNER' && ws.auth.role !== 'MANAGER') {
          this.send(ws, 'error', { code: 'FORBIDDEN', message: 'Not authorized to subscribe' });
          return;
        }
        ws.rooms?.add(roomCompany(ws.auth.companyId));
        return;
      case 'subscribe:trip':
        if (ws.auth.role !== 'OWNER' && ws.auth.role !== 'MANAGER') {
          this.send(ws, 'error', { code: 'FORBIDDEN', message: 'Not authorized to subscribe' });
          return;
        }
        ws.rooms?.add(roomTrip(ws.auth.companyId, message.payload.tripId));
        return;
      case 'subscribe:admin-company':
        if (ws.auth.role !== 'SUPER_ADMIN') {
          this.send(ws, 'error', { code: 'FORBIDDEN', message: 'Super Admin required' });
          return;
        }
        ws.rooms?.add(roomAdminCompany(message.payload.companyId));
        return;
      case 'location:update': {
        if (ws.auth.role !== 'EMPLOYEE') {
          logTrackingLocationRejected({
            companyId: ws.auth.companyId,
            userId: ws.auth.userId,
            channel: 'websocket',
            code: 'FORBIDDEN',
            message: 'Employees only',
          });
          this.send(ws, 'error', { code: 'FORBIDDEN', message: 'Employees only' });
          return;
        }
        const now = Date.now();
        if (
          ws.lastLocationUpdateAt != null &&
          now - ws.lastLocationUpdateAt < WS_LOCATION_MIN_INTERVAL_MS
        ) {
          logTrackingLocationRejected({
            companyId: ws.auth.companyId,
            userId: ws.auth.userId,
            channel: 'websocket',
            code: 'RATE_LIMITED',
            message: 'Too many location updates',
          });
          this.send(ws, 'error', { code: 'RATE_LIMITED', message: 'Too many location updates' });
          return;
        }
        ws.lastLocationUpdateAt = now;
        try {
          await this.upsertCurrentLocationUseCase.execute(ws.auth, message.payload, {
            channel: 'websocket',
          });
        } catch (error: unknown) {
          const rejection = resolveTrackingRejection(error);
          logTrackingLocationRejected({
            companyId: ws.auth.companyId,
            userId: ws.auth.userId,
            channel: 'websocket',
            code: rejection.code,
            message: rejection.message,
          });
          this.send(ws, 'error', { code: rejection.code, message: rejection.message });
          return;
        }
        this.send(ws, 'location:ack', { success: true });
        return;
      }
      default:
        return;
    }
  }

  private fanOut(eventType: TrackingBroadcastEventType, payload: TrackingBroadcastPayload): void {
    const rooms = new Set<string>();
    if (payload.companyId) rooms.add(roomCompany(payload.companyId));
    if (payload.companyId && payload.tripId) {
      rooms.add(roomTrip(payload.companyId, payload.tripId));
      rooms.add(roomAdminCompany(payload.companyId));
    }

    for (const ws of this.sockets) {
      if (!ws.auth || ws.readyState !== WebSocket.OPEN) continue;
      const subscribed = ws.rooms ?? new Set<string>();
      const allowed = Array.from(rooms).some((room) => subscribed.has(room));
      if (!allowed) continue;
      this.send(ws, eventType, payload);
    }
  }

  private send(ws: WebSocket, type: string, payload: unknown): void {
    if (ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type, payload, occurredAt: new Date().toISOString() }));
  }
}

function resolveTrackingRejection(error: unknown): { code: string; message: string } {
  if (error instanceof AppError) {
    return { code: error.code, message: error.message };
  }
  return { code: 'INTERNAL_ERROR', message: 'Location update failed' };
}
