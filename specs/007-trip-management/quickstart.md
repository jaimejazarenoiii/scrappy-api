# Quickstart: Trip Management (P006)

**Feature**: `007-trip-management`  
**Purpose**: Validate P006 trip workflow end-to-end after implementation.

See also: [spec.md](./spec.md) | [plan.md](./plan.md) | [data-model.md](./data-model.md) | [contracts/openapi.yaml](./contracts/openapi.yaml)

## Prerequisites

- P001–P005 implemented and migrated
- Seed data: `pnpm run db:seed` (owner, manager, employee accounts)
- At least one `AVAILABLE` vehicle and two active employees
- Employee timed in for Outside transaction scenarios

## Scenario 1: Plan a Draft Trip

1. Authenticate as Manager or Owner.
2. `POST /api/v1/trips` with `vehicleId`, `scheduledStart`, `origin`, `destination`, and `members`
   (Driver + Helper).
3. Confirm `status: DRAFT`, `tripNumber` matches `TRIP-{YYYYMMDD}-{sequence}`.
4. Authenticate as assigned Employee — `GET /api/v1/trips/mine` — trip appears.
5. Attempt `POST /api/v1/transactions` with `locationType: OUTSIDE` and this `tripId` — expect 409
   (trip not Started).

**Expected**: Trip Number assigned at creation; Employee sees assignment; no transactions while Draft.

## Scenario 2: Start Trip

1. As Manager, `POST /api/v1/trips/{tripId}/start`.
2. Confirm `status: STARTED`, `actualStart` set.
3. `GET /api/v1/vehicles/{vehicleId}` — status `IN_USE`.
4. Attempt second start — expect 409 LIFECYCLE_CONFLICT.
5. Attempt start on another Draft trip with same vehicle — expect 409 (vehicle busy).

**Expected**: Vehicle In Use; concurrency enforced.

## Scenario 3: Outside Transaction on Started Trip

1. Authenticate as timed-in Employee who is a trip member.
2. `POST /api/v1/transactions` with `locationType: OUTSIDE`, outside name/address, and `tripId`.
3. Confirm transaction created with `tripId` populated.
4. Attempt same without `tripId` — expect 400 validation error.
5. Attempt with Completed trip `tripId` — expect 409.

**Expected**: Outside transactions require Started trip.

## Scenario 4: Complete Trip

1. As Manager, `POST /api/v1/trips/{tripId}/complete`.
2. Confirm `status: COMPLETED`, `actualEnd` set.
3. `GET /api/v1/vehicles/{vehicleId}` — status `AVAILABLE`.
4. Attempt new Outside transaction with this `tripId` — expect 409.
5. Assigned Employee `GET /api/v1/trips/mine?status=COMPLETED` — trip in history.

**Expected**: Vehicle released; no new transactions after complete.

## Scenario 5: Cancel Draft Trip

1. Create another Draft trip.
2. `POST /api/v1/trips/{tripId}/cancel` with `{ "reason": "Weather" }`.
3. Confirm `status: CANCELLED`.
4. Attempt `PATCH /api/v1/trips/{tripId}` — expect 409.
5. Attempt start — expect 409.

**Expected**: Cancelled trips immutable.

## Scenario 6: Search by Trip Number

1. `GET /api/v1/trips/by-number/{tripNumber}` — exact match.
2. `GET /api/v1/trips?tripNumber=TRIP-2026` — prefix filter as Manager.
3. Cross-company token — expect 404.

**Expected**: Lookup within tenant scope.

## Scenario 7: Authorization

1. Employee `POST /api/v1/trips` — expect 403.
2. Employee `GET /api/v1/trips/{tripId}` for unassigned trip — expect 403.
3. Employee `GET /api/v1/trips` (company list) — expect 403.

**Expected**: Employees read assigned trips only.

## Scenario 8: Archive

1. `POST /api/v1/trips/{tripId}/archive` on Completed trip — success.
2. Default list excludes archived; `includeArchived=true` includes it.
3. Archive Draft trip — expect 409.

**Expected**: Archive terminal states only.

## Run tests

```bash
pnpm test:api -- tests/api/trip
pnpm test:integration -- tests/integration/trip
pnpm test:unit -- tests/unit/trip
```
