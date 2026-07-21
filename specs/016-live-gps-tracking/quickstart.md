# Quickstart: Live GPS Tracking (P012)

**Feature**: `016-live-gps-tracking`  
**Purpose**: Validate P012 live tracking end-to-end after implementation.

See also: [spec.md](./spec.md) | [plan.md](./plan.md) | [data-model.md](./data-model.md) |
[contracts/openapi.yaml](./contracts/openapi.yaml) |
[contracts/websocket-events.md](./contracts/websocket-events.md)

## Prerequisites

- P001–P011 implemented and migrated
- P012 migration applied (`CurrentLocation` table)
- Seed data: Owner, Manager, Employee accounts with linked Employee profiles
- At least one **Started** Trip with assigned Employee(s)
- `ws` WebSocket endpoint available at `/ws/v1/tracking`
- Optional: WebSocket client (e.g., `wscat`) for manual event verification

## Scenario 1: Employee transmits location (REST)

1. Authenticate as assigned Employee (`POST /api/v1/auth/login`).
2. Confirm Employee is on a Started Trip (`GET /api/v1/trips/mine?status=STARTED`).
3. `PUT /api/v1/tracking/location` with valid `latitude`, `longitude`, `capturedAt`.
4. Confirm `200`, `trackingStatus: ONLINE`, `tripId` matches Started Trip.
5. Repeat with newer `capturedAt` — coordinates update (same `employeeId`, one logical row).
6. Send older `capturedAt` — expect `422` stale update rejection.

**Expected**: Upsert semantics; trip association automatic; no client-supplied employee/company ids.

## Scenario 2: Reject transmission without Started Trip

1. Use Employee **not** on any Started Trip.
2. `PUT /api/v1/tracking/location` — expect `409` (no active trip).
3. Complete the Employee's Started Trip as Manager.
4. Employee retries location PUT — expect `409`.

**Expected**: Tracking gated on Started Trip lifecycle.

## Scenario 3: Owner monitors trip (REST snapshot)

1. Authenticate as Owner.
2. `GET /api/v1/trips/{tripId}/tracking/locations`.
3. Confirm assigned Employees listed with locations and `trackingActive: true`.
4. Complete trip; repeat GET — `trackingActive: false`.

**Expected**: REST provides initial map state per spec.

## Scenario 4: Company-wide active tracking list

1. As Owner, `GET /api/v1/tracking/trips/active/locations`.
2. Confirm paginated Started Trips with employee location summaries.
3. Filter `?tripId={uuid}` — single trip result.
4. As Employee, same endpoint — expect `403`.

**Expected**: Owner/Manager read access; Employee denied.

## Scenario 5: Real-time WebSocket updates

1. As Owner, open WebSocket with Owner JWT; send `subscribe:trip` for Started `tripId`.
2. As assigned Employee, open WebSocket (or REST PUT) and send location update.
3. Owner connection receives `location:updated` within 5 seconds without page refresh.
4. First location on trip also emits `tracking:started` (if not already tracking).

**Expected**: Real-time fan-out to authorized subscribers only.

## Scenario 6: Offline detection

1. Employee sends location; Owner sees `ONLINE`.
2. Stop Employee transmissions for > 5 minutes (default staleness).
3. Owner receives `employee:offline` event OR `GET .../status` shows `OFFLINE`.

**Expected**: System-derived offline status.

## Scenario 7: Trip complete stops tracking

1. With active tracking, Manager `POST /api/v1/trips/{tripId}/complete`.
2. Subscribed Owner receives `tracking:stopped` with affected `employeeIds`.
3. Employee location PUT — expect `409`.
4. Activity Log (optional): `tracking.stopped` entries present; no per-GPS-point logs.

**Expected**: Immediate tracking halt on trip completion.

## Scenario 8: Authorization and isolation

1. Employee A attempts `GET /tracking/employees/{employeeBId}/location` — `403`.
2. Owner Company A attempts trip tracking for Company B trip — `404` or `403`.
3. Super Admin `GET /admin/companies/{companyId}/tracking/trips/active/locations` — `200`.
4. Super Admin attempts `PUT /tracking/location` — `403`.
5. `isMockLocation: true` on PUT — `403` or `422` rejection.

**Expected**: Strict tenant and role boundaries.

## Scenario 9: Mock / validation failures

1. `PUT` with `latitude: 999` — `422`.
2. Unauthenticated PUT — `401`.
3. Invalid/expired JWT on WebSocket — connection rejected with `tracking:disconnected` or close code.

**Expected**: Zod and business validators enforced at boundary.

## Automated test commands (after implementation)

```bash
pnpm run test:unit -- tests/unit/tracking
pnpm run test:integration -- tests/integration/tracking
pnpm run test:api -- tests/api/tracking
```

All tests must pass before merge per constitution.
