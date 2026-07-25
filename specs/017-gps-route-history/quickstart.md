# Quickstart: GPS Route History (P013)

**Feature**: `017-gps-route-history`  
**Purpose**: Validate P013 route history end-to-end after implementation.

See also: [spec.md](./spec.md) | [plan.md](./plan.md) | [data-model.md](./data-model.md) |
[contracts/openapi.yaml](./contracts/openapi.yaml)

**Prerequisite**: P012 Live GPS Tracking deployed and working.

## Prerequisites

- P012 migration applied (`CurrentLocation` table)
- P013 migration applied (`LocationHistory` table)
- Seed data: Owner, Manager, Employee with linked profiles
- At least one **Started** Trip with assigned Employee(s)
- Env defaults (optional override):
  - `LOCATION_HISTORY_SAMPLE_MS=15000`
  - `LOCATION_HISTORY_RETENTION_DAYS=90`
  - `LOCATION_HISTORY_RETENTION_SWEEP_MS=86400000`

## Scenario 1: History appended on successful upsert

1. Authenticate as assigned Employee on a Started Trip.
2. `PUT /api/v1/tracking/location` with valid coordinates and `capturedAt`.
3. Confirm `200` (P012 live location updated).
4. As Owner, `GET /api/v1/trips/{tripId}/tracking/route`.
5. Confirm one point in `employees[].points[]` for that Employee.

**Expected**: First upsert creates one history point; live `CurrentLocation` unchanged in behavior.

## Scenario 2: Sampling interval (15s default)

1. Employee sends two location upserts **within 15 seconds** (different coordinates, newer `capturedAt`).
2. As Owner, `GET .../tracking/route`.
3. Confirm **one** history point (second upsert updated live location only).

4. Wait ≥ 15 seconds; Employee sends third upsert.
5. Repeat GET — confirm **two** history points, ordered by `capturedAt` asc.

**Expected**: Sampling reduces storage; live updates are not throttled.

## Scenario 3: No history without Started Trip

1. Use Employee **not** on any Started Trip.
2. Attempt `PUT /api/v1/tracking/location` — expect `409`.
3. Query route for any trip — no new points from that attempt.

**Expected**: Same gating as P012; rejected upserts do not append history.

## Scenario 4: Owner views partial route (Started Trip)

1. Employee transmits 5+ spaced upserts on Started Trip.
2. As Owner, `GET /api/v1/trips/{tripId}/tracking/route`.
3. Confirm ordered `points[]` with `tripStatus: STARTED`.
4. Complete trip; repeat GET — same points retained, status `COMPLETED`.

**Expected**: Partial route while active; full route after complete.

## Scenario 5: Filter by employeeId

1. Trip with two assigned Employees both transmitting.
2. Owner `GET .../tracking/route?employeeId={uuid}` for one Employee.
3. Confirm `employees` array has one entry with that Employee's points only.

**Expected**: Optional filter for single-driver map view.

## Scenario 6: Pagination for long routes

1. Simulate or transmit many points (e.g., 600+ with reduced sample interval in dev).
2. `GET .../tracking/route?page=1&limit=500` — 500 points, `meta.total` ≥ 600.
3. `GET .../tracking/route?page=2&limit=500` — remaining points.

**Expected**: No single unbounded payload; stable time ordering.

## Scenario 7: Authorization

1. As **Employee**, `GET .../tracking/route` — expect `403`.
2. As Owner of **Company A**, request route for **Company B** trip — expect `403` or `404`.
3. As **Manager**, same trip in own company — expect `200`.

**Expected**: Read denied for Employee; tenant isolation enforced.

## Scenario 8: Cancelled trip partial route

1. Employee transmits on Started Trip; Manager cancels mid-route.
2. Owner requests route — points recorded **before** cancel remain.
3. Employee attempts further upserts — `409`; no new history points.

**Expected**: History frozen at cancel; existing trail preserved.

## Scenario 9: Retention purge (manual or time-travel test)

1. In test DB, set Trip `actualEnd` to > 90 days ago with history rows.
2. Trigger retention sweep (restart server or wait for daily interval).
3. Owner requests route — empty `points[]` or trip not found per product rules.
4. Trip completed 30 days ago — points still returned.

**Expected**: 90-day cap bounds storage.

## Scenario 10: P012 regression check

1. Run P012 quickstart Scenarios 1–5 (live upsert, WS, offline, trip complete).
2. Confirm `CurrentLocation` still one row per Employee; WS events unchanged.

**Expected**: P013 is additive; P012 behavior intact.

## Verification checklist

- [ ] History rows increase only on successful upsert + sampling elapsed
- [ ] Route API returns ordered lat/lng arrays suitable for map polyline
- [ ] Employee cannot read routes
- [ ] Retention job deletes old trip history
- [ ] No coordinates logged at info level in server logs
- [ ] All existing P012 tests still pass
