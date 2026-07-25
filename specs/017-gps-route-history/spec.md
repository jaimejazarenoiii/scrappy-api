# Feature Specification: P013 — GPS Route History

**Feature Branch**: `[017-gps-route-history]`

**Created**: 2026-07-24

**Status**: Draft

**Input**: Extend P012 Live GPS Tracking with append-only route history so Owners and Managers can
view an Employee's travel path on a map as a sequence of coordinates. Store points during Started
Trips; retain for 90 days after trip completion; server-side sampling minimum 15 seconds between
stored points. Live `CurrentLocation` (P012) remains unchanged.

## Vision

Field supervisors need to see not only where Employees are **now**, but the **path they traveled**
during a Started or recently Completed Trip—for dispatch review, dispute resolution, and operational
awareness.

Route history is **additive** to P012: live tracking continues to use a single upserted current
location; history captures accepted GPS points over time without replacing live behavior.

## Objectives

- Persist GPS points transmitted during Started Trips as an ordered trail per Employee and Trip.
- Allow Owners and Managers to retrieve route coordinates as an array suitable for map polylines.
- Control storage growth via server-side sampling and automatic retention purge.
- Preserve tenant isolation and existing P012 authorization rules.

## Scope

**Included**:

- Append-only storage of accepted GPS points during Started Trips
- Route retrieval for Owner/Manager (and Super Admin support view where applicable)
- Paginated or bounded coordinate arrays ordered by capture time
- Retention purge 90 days after Trip completion
- Server-side minimum interval between stored points (15 seconds default)
- Integration with existing P012 location upsert (REST and WebSocket uplink)

**Not included**:

- Real-time route streaming over WebSocket (live point updates remain P012 `location:updated`)
- Route playback UI, speed analytics, geofencing, ETA, heat maps
- Editing or deleting individual history points (append-only; purge is retention-only)
- GPS history when no Started Trip (same rule as P012 transmit)
- Export to GPX/KML (future)

**Dependencies**: P012 (Live GPS Tracking), P006 (Trip Management), P001 (auth/tenant).

**Terminology**: **Route** = ordered list of GPS points for one Employee on one Trip. **Active
recording** = Trip status is STARTED and location upsert succeeded.

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Route Recorded During Active Trip (Priority: P1)

While an Employee on a Started Trip transmits GPS, each accepted location (subject to sampling) is
appended to route history linked to Company, Employee, and Trip.

**Why this priority**: Without persistence, no route feature exists.

**Independent Test**: Employee upserts locations on Started Trip; history row count increases;
`CurrentLocation` still shows only latest point (P012 unchanged).

**Acceptance Scenarios**:

1. **Given** an Employee on a Started Trip transmits a valid location, **When** the upsert
   succeeds, **Then** a history point is stored with coordinates and capture timestamp.
2. **Given** two upserts within the minimum sampling interval, **When** the second arrives,
   **Then** `CurrentLocation` updates but a new history point is not stored.
3. **Given** an Employee not on a Started Trip, **When** they attempt transmit, **Then** no
   history point is stored (same rejection as P012).
4. **Given** mock GPS, **When** transmit is attempted, **Then** no history point is stored.

---

### User Story 2 — Owner Views Trip Route on Map (Priority: P1)

An Owner retrieves the coordinate array for a Trip (all members or one Employee) to draw a polyline
on the frontend map.

**Why this priority**: Primary user-visible value for route history.

**Independent Test**: After Employee tracked on Started Trip then Trip completed, Owner requests
route and receives ordered `points[]` with lat/lng and timestamps.

**Acceptance Scenarios**:

1. **Given** a Completed Trip with stored history, **When** Owner requests route for that Trip,
   **Then** they receive ordered points per assigned Employee who transmitted GPS.
2. **Given** a Started Trip with ongoing tracking, **When** Owner requests route, **Then** they
   receive points recorded so far (partial route).
3. **Given** an Employee on the Trip with no transmissions, **When** Owner requests route,
   **Then** that Employee has an empty `points` array.
4. **Given** a Trip in another Company, **When** Owner requests route, **Then** access is denied.

---

### User Story 3 — Manager Views Authorized Routes (Priority: P2)

A Manager has the same route read access as Owner within their Company.

**Independent Test**: Manager retrieves route for company Trip; Employee role receives 403.

**Acceptance Scenarios**:

1. **Given** a company Started or Completed Trip, **When** Manager requests route, **Then** they
   receive the same shape as Owner.
2. **Given** an Employee, **When** they request another Employee's route, **Then** access is denied.

---

### User Story 4 — Retention and Storage Control (Priority: P2)

Old route data is purged automatically to bound storage; Companies are not required to manage
history manually.

**Independent Test**: Points older than 90 days after Trip completion are removed by scheduled job;
recent routes remain queryable.

**Acceptance Scenarios**:

1. **Given** a Trip completed more than 90 days ago, **When** retention job runs, **Then** history
   points for that Trip are deleted.
2. **Given** a Trip completed 30 days ago, **When** Owner requests route, **Then** points are
   still returned.

---

### Edge Cases

- Trip cancelled mid-route: history recorded up to cancel remains; no new points after cancel.
- Trip completed while device offline: points stored before complete remain; no points after.
- Very long Trip (8+ hours): pagination returns points in time order without single huge payload.
- Duplicate timestamps: ordering uses capture time then insert order.
- Employee removed from Trip mid-route: points already stored remain tied to Trip and Employee.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST append a history point when P012 location upsert succeeds on a Started
  Trip, subject to minimum sampling interval.
- **FR-002**: System MUST NOT append history when upsert is rejected (no trip, mock GPS, stale
  timestamp, subscription inactive, etc.).
- **FR-003**: System MUST store Company, Employee, Trip, latitude, longitude, capture timestamp,
  and optional accuracy/speed/heading/battery on each history point.
- **FR-004**: System MUST expose route retrieval returning ordered coordinate arrays for Owner and
  Manager within tenant scope.
- **FR-005**: Route retrieval MUST support filtering by `employeeId` and paginating by time or
  cursor to avoid unbounded responses.
- **FR-006**: System MUST allow route read for Started and Completed Trips; Cancelled Trips return
  history recorded before cancellation.
- **FR-007**: System MUST purge history points 90 days after parent Trip `actualEnd` (or equivalent
  completion timestamp).
- **FR-008**: System MUST NOT expose route history to Employee role (read denied).
- **FR-009**: System MUST NOT log raw coordinates at info level in audit logs (align with P012).
- **FR-010**: P012 `CurrentLocation` behavior MUST remain unchanged (one row per Employee, upsert).

### Key Entities

- **LocationHistoryPoint**: One GPS sample on a Trip; append-only; belongs to Company, Employee,
  Trip; ordered by capture time.
- **TripRoute (derived)**: Ordered collection of points for one Employee on one Trip (API view, not
  necessarily a stored aggregate).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Owner can load a Completed Trip route with at least 50 points and render a continuous
  polyline on a map without client-side buffering.
- **SC-002**: Under typical load (100 Employees, 2–3 Started Trips/day, 15s sampling), route
  retrieval for one Employee on one Trip returns within 2 seconds for trips up to 8 hours.
- **SC-003**: Storage for route history remains bounded: retention purge prevents indefinite growth
  (90-day cap per completed Trip).
- **SC-004**: 100% of route read attempts by unauthorized roles (Employee cross-peer, cross-tenant)
  are rejected.

## Assumptions

- Minimum sampling interval defaults to **15 seconds** (configurable via env).
- Retention defaults to **90 days** after Trip completion (configurable via env).
- Target scale: ~100 tracking Employees, 1–5 Trips/day each (~180k history rows/day at 15s/3hr
  trip — acceptable with retention).
- Frontend draws polylines from REST; WebSocket remains for live single-point updates (P012).
- Super Admin cross-company route read follows same pattern as P012 admin tracking list (optional P3).
