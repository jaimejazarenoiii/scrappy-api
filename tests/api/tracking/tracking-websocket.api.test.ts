import { createServer, type AddressInfo } from 'node:http';
import request from 'supertest';
import WebSocket from 'ws';
import { afterEach, describe, expect, it } from 'vitest';
import { getTrackingWsPath } from '../../../src/shared/geo/tracking-staleness.js';
import { makeVehiclePayload } from '../../factories/vehicle.factory.js';
import { createCompanyAndLogin, createLinkedEmployeeUser } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

function bearerToken(auth: { Authorization: string }): string {
  return auth.Authorization.replace('Bearer ', '');
}

function waitForWsMessage(
  ws: WebSocket,
  type: string,
  timeoutMs = 5000,
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Timed out waiting for ${type}`)), timeoutMs);

    ws.on('message', (raw) => {
      const message = JSON.parse(raw.toString()) as { type: string; payload: unknown };
      if (message.type === type) {
        clearTimeout(timeout);
        resolve(message as Record<string, unknown>);
      }
    });
  });
}

async function createStartedTripWithEmployee(
  app: ReturnType<typeof createTestContext>['app'],
  ownerAuth: { Authorization: string },
  employeeId: string,
) {
  const vehicle = await request(app)
    .post('/api/v1/vehicles')
    .set(ownerAuth)
    .send(makeVehiclePayload());
  const trip = await request(app)
    .post('/api/v1/trips')
    .set(ownerAuth)
    .send({
      vehicleId: vehicle.body.data.id,
      scheduledStart: new Date(Date.now() + 60_000).toISOString(),
      origin: 'Warehouse',
      destination: 'Site',
      members: [{ employeeId, role: 'DRIVER' }],
    });
  expect(trip.status).toBe(201);

  const started = await request(app)
    .post(`/api/v1/trips/${trip.body.data.id}/start`)
    .set(ownerAuth)
    .send({});
  expect(started.status).toBe(200);
  return trip.body.data.id as string;
}

describe('tracking websocket api', () => {
  const servers: ReturnType<typeof createServer>[] = [];

  afterEach(async () => {
    await Promise.all(
      servers.splice(0).map(
        (server) =>
          new Promise<void>((resolve) => {
            server.close(() => resolve());
          }),
      ),
    );
  });

  async function startWsServer() {
    const ctx = createTestContext();
    const server = createServer(ctx.app);
    servers.push(server);
    ctx.container.trackingWebSocketGateway.attach(server, getTrackingWsPath());
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as AddressInfo).port;
    const wsPath = getTrackingWsPath();
    return {
      ...ctx,
      wsUrl: `ws://127.0.0.1:${port}${wsPath}`,
    };
  }

  it('broadcasts location:updated to subscribed owner', async () => {
    const { app, wsUrl, userRepository, employeeRepository } = await startWsServer();
    const owner = await createCompanyAndLogin(app);
    const employee = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
    );
    const tripId = await createStartedTripWithEmployee(app, owner.auth, employee.employeeId);

    const ws = new WebSocket(`${wsUrl}?access_token=${bearerToken(owner.auth)}`);
    const connectedPromise = waitForWsMessage(ws, 'tracking:connected');
    await new Promise<void>((resolve, reject) => {
      ws.once('open', () => resolve());
      ws.once('error', reject);
    });
    await connectedPromise;

    const updatePromise = waitForWsMessage(ws, 'location:updated');
    ws.send(JSON.stringify({ type: 'subscribe:trip', payload: { tripId } }));

    const upsert = await request(app).put('/api/v1/tracking/location').set(employee.auth).send({
      latitude: 14.5995,
      longitude: 120.9842,
      capturedAt: new Date().toISOString(),
    });
    expect(upsert.status).toBe(200);

    const event = await updatePromise;
    expect(event.type).toBe('location:updated');
    const payload = event.payload as { location?: { latitude?: number } };
    expect(payload.location?.latitude).toBe(14.5995);

    ws.close();
  });

  it('rejects websocket connection without token', async () => {
    const { wsUrl } = await startWsServer();
    const ws = new WebSocket(wsUrl);

    await new Promise<void>((resolve, reject) => {
      ws.once('close', () => resolve());
      ws.once('open', () => reject(new Error('Expected connection to be rejected')));
      ws.once('error', () => resolve());
    });
  });
});
