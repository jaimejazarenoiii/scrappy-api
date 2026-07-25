import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  logTrackingLocationAccepted,
  logTrackingLocationRejected,
} from '../../../src/modules/tracking/application/services/tracking-audit.service.js';

const info = vi.fn();
const debug = vi.fn();
const warn = vi.fn();

vi.mock('../../../src/config/logger.js', () => ({
  getLogger: () => ({ info, debug, warn }),
}));

describe('tracking audit logging', () => {
  beforeEach(() => {
    info.mockClear();
    debug.mockClear();
    warn.mockClear();
  });

  it('logs accepted locations at info without coordinates', () => {
    logTrackingLocationAccepted({
      companyId: 'c1',
      employeeId: 'e1',
      tripId: 't1',
      tripNumber: 'TRP-001',
      userId: 'u1',
      channel: 'rest',
      capturedAt: '2026-07-24T10:00:00.000Z',
      routePointCount: 3,
      historyAppended: true,
      latitude: 14.5,
      longitude: 120.9,
      accuracy: 10,
      batteryLevel: 80,
    });

    expect(info).toHaveBeenCalledWith(
      expect.objectContaining({
        tracking: expect.objectContaining({
          event: 'location.accepted',
          routePointCount: 3,
          historyAppended: true,
          channel: 'rest',
        }),
      }),
      'tracking location accepted',
    );
    expect(info.mock.calls[0]?.[0].tracking).not.toHaveProperty('latitude');
    expect(debug).toHaveBeenCalledWith(
      expect.objectContaining({
        tracking: expect.objectContaining({
          latitude: 14.5,
          longitude: 120.9,
        }),
      }),
      'tracking location coordinates',
    );
  });

  it('logs rejected locations at warn', () => {
    logTrackingLocationRejected({
      companyId: 'c1',
      userId: 'u1',
      channel: 'websocket',
      code: 'RATE_LIMITED',
      message: 'Too many location updates',
    });

    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({
        tracking: expect.objectContaining({
          event: 'location.rejected',
          code: 'RATE_LIMITED',
        }),
      }),
      'tracking location rejected',
    );
  });
});
