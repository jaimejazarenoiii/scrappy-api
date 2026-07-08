# Research: Trip Management (P006)

**Feature**: `007-trip-management`  
**Date**: 2026-07-08

## 1. Bounded context placement

**Decision**: Implement a new top-level `trip` module under `src/modules/trip/` following the same
Clean Architecture layout as `vehicle`, `attendance`, and `transaction`.

**Rationale**: Trip is an aggregate root with its own lifecycle, numbering, and member collection.
It coordinates but does not own Transactions or Expenses. A dedicated module keeps lifecycle
authority localized and matches P002/P003/P004 modular boundaries.

**Alternatives considered**:

- Embed trips inside `transaction` module — rejected; trips exist before transactions and govern
  vehicle/employee availability independently.
- Embed trips inside `vehicle` module — rejected; trips also coordinate employees and transactions.

## 2. Aggregate composition

**Decision**: `Trip` is the aggregate root; `TripMember` is a child entity within the same
aggregate. Members are created/updated/deleted only through Trip planning operations while status is
`DRAFT`. Members are immutable while `STARTED`, `COMPLETED`, or `CANCELLED`.

**Rationale**: Member roster is part of trip planning invariants (at least one member to start, no
duplicates). No independent lifecycle justifies a separate aggregate.

**Alternatives considered**:

- TripMember as separate aggregate — rejected; no standalone business meaning outside a Trip.

## 3. Trip Number generation

**Decision**: Mirror P005 `TransactionNumberSequence` with `TripNumberSequence` keyed by
`(companyId, sequenceDate)` where `sequenceDate` is UTC calendar date at trip creation.
Format: `TRIP-{YYYYMMDD}-{000001}`. Assign synchronously in `CreateTripUseCase` inside the same DB
transaction as trip insert.

**Rationale**: Established Scrappy pattern; atomic sequence prevents duplicates under concurrent
creates; date embedded in number aids operator readability.

**Alternatives considered**:

- UUID-based trip codes — rejected; product spec mandates `TRIP-YYYYMMDD-000001`.
- Application-level max+1 without lock — rejected; race under concurrency.

## 4. One active trip per vehicle and employee

**Decision**: Enforce at `StartTripUseCase` with:

1. Serializable transaction (Prisma `$transaction`) wrapping status transition.
2. Query for existing `STARTED` trip with same `vehicleId` in Company.
3. Query for existing `STARTED` trip sharing any member `employeeId`.
4. Supplement with PostgreSQL partial unique indexes in migration SQL:
   - `UNIQUE (company_id, vehicle_id) WHERE status = 'STARTED' AND deleted_at IS NULL`
   - Exclusion for employees via application check (join through `trip_members`); optional future
     denormalized `active_trip_id` on Employee deferred.

**Rationale**: Vehicle uniqueness maps cleanly to a partial unique index. Employee uniqueness spans
a join table; application check in the same DB transaction is sufficient for P006 scale; index on
`(employee_id)` + trip status via query uses `(trip_id, employee_id)` unique on members plus start
validation.

**Alternatives considered**:

- Persist `onTrip` flag on Employee — rejected; duplicate source of truth; derived from Started
  trips is authoritative.

## 5. Vehicle status coordination

**Decision**: `StartTripUseCase` sets vehicle `IN_USE` via `VehicleRepository.update`;
`CompleteTripUseCase` sets vehicle `AVAILABLE` when prior status was `IN_USE` due to this trip.
Trip module reads/writes vehicle status through repository interface only (no Prisma in application).

**Rationale**: P002 already defines `IN_USE`; trip start is the business event that consumes
vehicle availability.

**Guards**: Reject start if vehicle is `MAINTENANCE` or `INACTIVE` or archived.

## 6. Employee "On Trip" availability

**Decision**: **Derived state**, not a persisted Employee column. `TripRepository.findStartedByEmployeeId`
drives:

- Start-trip concurrency validation
- Optional `isOnTrip` flag in trip detail/list DTOs for assigned employees
- Workforce dashboard `tripsSummary` population (active Started trip for linked employee)

**Rationale**: Spec states timing out does not clear On Trip until trip completes; a derived check
against Started trip membership avoids sync bugs with attendance.

## 7. Transaction integration (Outside only)

**Decision**: Extend `transaction` module only:

- `create-transaction.use-case` and `update-transaction.use-case` inject `TripRepository` (read-only).
- New domain rule `assertTripLinkForOutside(locationType, tripId)`:
  - `OUTSIDE` → `tripId` required
  - Non-OUTSIDE → `tripId` must be null
- New rule `assertTripAcceptsTransaction(trip)`:
  - Trip status must be `STARTED`
  - Trip `companyId` matches transaction
  - Creating/updating user’s linked employee should be a trip member (assigned Employee policy)

**Rationale**: P004 already has nullable `tripId` column and FK-ready field; P006 activates
enforcement without schema redesign on Transaction root.

**Alternatives considered**:

- Trip module owns transaction creation — rejected; violates P004 aggregate boundaries.

## 8. Expense integration (future)

**Decision**: No Expense tables in P006. Document eligibility helper
`assertTripAcceptsExpense(trip)` in trip domain rules returning true for `STARTED` and `COMPLETED`
only. Future Expense module calls this via shared interface or trip repository read.

**Rationale**: Spec defers Expense implementation; trip model stays stable.

## 9. Audit strategy

**Decision**: Root-level audit columns on Trip:

- `createdByUserId`, `updatedByUserId`
- `startedAt` (same as `actualStart`), `startedByUserId`
- `completedAt` (same as `actualEnd`), `completedByUserId`
- `cancelledAt`, `cancelledByUserId`, `cancellationReason`
- `archivedAt` via `deletedAt` soft delete pattern consistent with P002 resources

Emit `trip-audit.service` events: `trip.created`, `trip.started`, `trip.completed`, `trip.cancelled`,
`trip.archived`, `trip.member.added`, etc.

**Rationale**: Matches P004/P005 audit patterns; supports future reporting without event store.

## 10. API route registration order

**Decision**: Register static paths before parameterized routes:

```text
GET  /trips/mine
GET  /trips/by-number/:tripNumber
GET  /trips
POST /trips
GET  /trips/:tripId
PATCH /trips/:tripId
POST /trips/:tripId/start|complete|cancel|archive
POST /trips/:tripId/members
PATCH /trips/:tripId/members/:memberId
DELETE /trips/:tripId/members/:memberId
```

**Rationale**: Prevents Express capturing `mine` or `by-number` as `:tripId`.

## 11. Authorization

**Decision**: Reuse `authorize(['OWNER', 'MANAGER'])` middleware for mutating company trip endpoints;
`authorize(['OWNER', 'MANAGER', 'EMPLOYEE'])` for read endpoints with use-case-level scope check
for Employees (member-only). Dedicated `trip-authorization.policy.ts` mirrors
`vehicle-authorization.policy.ts`.

**Rationale**: Consistent with P002/P003/P004 role patterns; Employee read scope cannot be expressed
by route role alone.

## 12. Workforce dashboard

**Decision**: Extend `GetWorkforceDashboardUseCase` to load Started trip for linked employee via
`TripRepository` and populate `tripsSummary` with trip number, status, origin, destination,
scheduled/actual start. Owners receive empty or summary of company Started trips per dashboard
visibility rules (Managers/Employees: personal active trip only).

**Rationale**: Fulfills FR-053; placeholder already exists in P003.

## 13. List/search performance

**Decision**: Indexes on `(companyId, status, deletedAt)`, `(companyId, tripNumber)` UNIQUE,
`(companyId, scheduledStart)`, `(companyId, vehicleId)`, and `trip_members(employeeId)` for member
filter and active-trip lookups.

**Rationale**: Supports list filters and concurrency checks within spec SC-005 (<2s lookup goal).

## 14. Backfill / migration

**Decision**: Greenfield tables only; no backfill. Add optional FK from `Transaction.tripId` →
`Trip.id` in Prisma schema (nullable, onDelete SetNull) to enforce referential integrity going
forward.

**Rationale**: No legacy trip data exists pre-P006.
