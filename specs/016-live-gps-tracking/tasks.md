---
description: 'Task list for Live GPS Tracking (P012) feature'
---

# Tasks: P012 — Live GPS Tracking

**Input**: Design documents from `/specs/016-live-gps-tracking/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, contracts/websocket-events.md, quickstart.md; P001–P011 implemented and passing

**Tests**: Included — the specification, plan (§14), and constitution require unit, integration, API, WebSocket, authentication, authorization, trip validation, and company isolation coverage using Vitest and Supertest.

**Organization**: Tasks introduce a new `tracking` module, `ws` WebSocket support, targeted extensions to `trip` (complete hook), `activity-log` (tracking actions), Prisma schema, Swagger, and test support. Foundational work blocks all stories.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: `US1` = Employee transmits location, `US2` = Owner monitors live, `US3` = Manager monitors, `US4` = Tracking App auth/identity, `US5` = Trip complete stops tracking, `US6` = Super Admin observability

## Path Conventions

P012 follows Scrappy API Clean Architecture:

- **Module**: `src/modules/tracking/{domain,application,infrastructure,presentation}/`
- **Cross-module extensions**: `src/modules/trip/`, `src/modules/activity-log/`, `src/modules/index.ts`, `src/config/container.ts`, `src/server.ts`
- **Shared**: `src/shared/geo/`, `src/shared/workforce/acting-employee.ts`
- **Swagger**: `src/swagger/common-schemas.ts`, `src/modules/tracking/presentation/tracking.openapi.ts`, `docs/api-reference.md`
- **Tests**: `tests/unit/tracking/`, `tests/integration/tracking/`, `tests/api/tracking/`, `tests/factories/`, `tests/setup/`
- **Schema**: `prisma/schema.prisma`

---

## Phase 1: Setup (Shared Scaffolding)

**Purpose**: Add WebSocket dependency, create tracking module skeleton, shared geo helpers, and test directories.

- [x] T001 Add `ws` and `@types/ws` dependencies in `package.json`
- [x] T002 Create tracking module directory structure and `src/modules/tracking/index.ts`
- [x] T003 [P] Create domain file placeholders in `src/modules/tracking/domain/current-location.entity.ts`, `src/modules/tracking/domain/tracking-status.ts`, `src/modules/tracking/domain/coordinates.vo.ts`, `src/modules/tracking/domain/tracking-rules.ts`, `src/modules/tracking/domain/current-location.repository.ts`, `src/modules/tracking/domain/ports/tracking-broadcast.port.ts`, and `src/modules/tracking/domain/ports/tracking-lifecycle.port.ts`
- [x] T004 [P] Create application file placeholders in `src/modules/tracking/application/dto/`, `src/modules/tracking/application/use-cases/`, `src/modules/tracking/application/policies/tracking-authorization.policy.ts`, and `src/modules/tracking/application/services/`
- [x] T005 [P] Create infrastructure and presentation placeholders in `src/modules/tracking/infrastructure/current-location.prisma-repository.ts`, `src/modules/tracking/infrastructure/tracking-broadcast.ws-adapter.ts`, `src/modules/tracking/infrastructure/tracking-lifecycle.adapter.ts`, `src/modules/tracking/infrastructure/mappers/current-location.mapper.ts`, `src/modules/tracking/presentation/tracking.controller.ts`, `src/modules/tracking/presentation/tracking.routes.ts`, `src/modules/tracking/presentation/tracking.schemas.ts`, `src/modules/tracking/presentation/tracking.openapi.ts`, and `src/modules/tracking/presentation/tracking-websocket.gateway.ts`
- [x] T006 [P] Create shared geo and staleness helpers in `src/shared/geo/latitude-longitude.schema.ts` and `src/shared/geo/tracking-staleness.ts`
- [x] T007 [P] Create tracking test directories and stub paths under `tests/unit/tracking/`, `tests/integration/tracking/`, `tests/api/tracking/`, and `tests/factories/tracking.factory.ts`

**Checkpoint**: Module scaffolding and shared helpers exist for implementation.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema, domain model, repositories, ports, DI wiring, env config, OpenAPI base, activity-log actions, and test infrastructure required by all user stories.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [x] T008 Add `CurrentLocation` model with relations to Company, Employee, and Trip plus UNIQUE(`employeeId`) in `prisma/schema.prisma`
- [x] T009 Create Prisma migration for `CurrentLocation` table and indexes in `prisma/migrations/`
- [x] T010 [P] Add `TRACKING_STALENESS_MS`, `TRACKING_SWEEP_MS`, and `WS_PATH` to env schema in `src/config/env.ts`
- [x] T011 [P] Implement `TrackingStatus` enum and staleness helpers in `src/modules/tracking/domain/tracking-status.ts`
- [x] T012 [P] Implement `Coordinates` value object and bounds validation in `src/modules/tracking/domain/coordinates.vo.ts`
- [x] T013 [P] Implement `CurrentLocationEntity` with `isOnline()`, `assertNewerThan()`, and `clearTripAssociation()` in `src/modules/tracking/domain/current-location.entity.ts`
- [x] T014 Implement tracking business rules (mock reject, monotonic timestamp, trip membership assertions) in `src/modules/tracking/domain/tracking-rules.ts`
- [x] T015 [P] Define `CurrentLocationRepository` upsert/find/clear-by-trip contract in `src/modules/tracking/domain/current-location.repository.ts`
- [x] T016 [P] Define `TrackingBroadcastPort` and `TrackingLifecyclePort` interfaces in `src/modules/tracking/domain/ports/tracking-broadcast.port.ts` and `src/modules/tracking/domain/ports/tracking-lifecycle.port.ts`
- [x] T017 Implement `CurrentLocationPrismaRepository` with upsert-on-employee-id in `src/modules/tracking/infrastructure/current-location.prisma-repository.ts`
- [x] T018 [P] Implement `current-location.mapper.ts` between Prisma rows and domain entity in `src/modules/tracking/infrastructure/mappers/current-location.mapper.ts`
- [x] T019 [P] Implement shared Zod geo schemas in `src/shared/geo/latitude-longitude.schema.ts` (reuse in tracking schemas)
- [x] T020 [P] Extract or reuse `resolveActingEmployeeIdForUser` via `src/shared/workforce/acting-employee.ts` (wrap existing transaction helper to avoid tracking→transaction coupling in use cases)
- [x] T021 Implement `TrackingContextService` (resolve employeeId from JWT, resolve Started Trip via `TripRepository.findStartedTripByEmployee`) in `src/modules/tracking/application/services/tracking-context.service.ts`
- [x] T022 [P] Implement `TrackingStatusService` for ONLINE/OFFLINE derivation in `src/modules/tracking/application/services/tracking-status.service.ts`
- [x] T023 [P] Implement `tracking-audit.service.ts` structured Pino helpers (no coordinate logging at info) in `src/modules/tracking/application/services/tracking-audit.service.ts`
- [x] T024 [P] Implement base `tracking-authorization.policy.ts` role assertions in `src/modules/tracking/application/policies/tracking-authorization.policy.ts`
- [x] T025 [P] Implement request/response DTOs in `src/modules/tracking/application/dto/upsert-location.request.ts`, `current-location.response.ts`, `trip-tracking.response.ts`, and `tracking-status.response.ts`
- [x] T026 [P] Implement Zod schemas for REST bodies, params, and WS message payloads in `src/modules/tracking/presentation/tracking.schemas.ts`
- [x] T027 [P] Add Tracking schemas/components to `src/swagger/common-schemas.ts`
- [x] T028 [P] Implement base Tracking OpenAPI path declarations in `src/modules/tracking/presentation/tracking.openapi.ts`
- [x] T029 Implement `TrackingController` method signatures in `src/modules/tracking/presentation/tracking.controller.ts`
- [x] T030 Implement `createTrackingRoutes()` with auth middleware in `src/modules/tracking/presentation/tracking.routes.ts`
- [x] T031 Register tracking routes in `src/modules/index.ts` and `src/app.ts`
- [x] T032 Wire tracking module dependencies in `src/modules/tracking/index.ts` and `src/config/container.ts`
- [x] T033 [P] Extend `ACTIVITY_MODULES`, `ACTIVITY_EVENT_TYPES`, and `ACTIVITY_ACTIONS` with tracking started/stopped in `src/modules/activity-log/domain/activity-actions.ts` and `src/shared/audit/activity-log-bridge.ts`
- [x] T034 [P] Extend in-memory repositories with `CurrentLocation` support in `tests/setup/in-memory-repositories.ts`
- [x] T035 [P] Create tracking payload factory helpers in `tests/factories/tracking.factory.ts`
- [x] T036 [P] Add foundational unit tests for `coordinates.vo.ts`, `tracking-rules.ts`, and `tracking-status.service.ts` in `tests/unit/tracking/coordinates.test.ts`, `tests/unit/tracking/tracking-rules.test.ts`, and `tests/unit/tracking/tracking-status.service.test.ts`
- [x] T037 [P] Add foundational integration test for CurrentLocation upsert replace semantics in `tests/integration/tracking/current-location.persistence.test.ts`

**Checkpoint**: Schema, domain, repository, DTOs, routes skeleton, DI, and test infrastructure are ready.

---

## Phase 3: User Story 1 — Employee Transmits Location (Priority: P1) 🎯 MVP

**Goal**: Authenticated Employee on a Started Trip submits GPS via REST; system upserts one current location row per Employee.

**Independent Test**: Employee on Started Trip `PUT /tracking/location` succeeds; repeat replaces prior point; Employee not on Started Trip receives 409; unauthenticated receives 401.

### Tests for User Story 1

- [x] T038 [P] [US1] Create API tests for location upsert happy path and replace semantics in `tests/api/tracking/tracking-upsert.api.test.ts`
- [x] T039 [P] [US1] Create API tests for no-active-trip and not-trip-member rejection in `tests/api/tracking/tracking-upsert-validation.api.test.ts`
- [x] T040 [P] [US1] Create unit tests for `UpsertCurrentLocationUseCase` in `tests/unit/tracking/upsert-current-location.use-case.test.ts`

### Implementation for User Story 1

- [x] T041 [US1] Implement `UpsertCurrentLocationUseCase` with trip validation, mock-location reject, stale timestamp reject, and upsert in `src/modules/tracking/application/use-cases/upsert-current-location.use-case.ts`
- [x] T042 [US1] Implement `assertCanTransmitLocation` and employee-only gate in `src/modules/tracking/application/policies/tracking-authorization.policy.ts`
- [x] T043 [US1] Complete `PUT /tracking/location` controller handler and route binding in `src/modules/tracking/presentation/tracking.controller.ts` and `src/modules/tracking/presentation/tracking.routes.ts`
- [x] T044 [US1] Update OpenAPI for upsert endpoint in `src/modules/tracking/presentation/tracking.openapi.ts` and `src/swagger/common-schemas.ts`
- [x] T045 [US1] Record `tracking.started` Activity Log on first location for trip via `ActivityLogRecorder` in `src/modules/tracking/application/use-cases/upsert-current-location.use-case.ts`

**Checkpoint**: Employees can transmit and replace current location during Started Trips via REST.

---

## Phase 4: User Story 2 — Owner Monitors Active Trip Locations (Priority: P1)

**Goal**: Owner loads trip/employee location snapshots via REST and receives real-time updates via WebSocket without manual refresh.

**Independent Test**: Owner `GET /trips/{tripId}/tracking/locations` shows assigned Employees with coordinates; WebSocket subscriber receives `location:updated` within 5s of Employee upsert.

### Tests for User Story 2

- [x] T046 [P] [US2] Create API tests for trip tracking locations and employee location GET in `tests/api/tracking/tracking-read-owner.api.test.ts`
- [x] T047 [P] [US2] Create API tests for active trips list pagination and filters in `tests/api/tracking/tracking-active-list.api.test.ts`
- [x] T048 [P] [US2] Create WebSocket integration tests for subscribe and `location:updated` broadcast in `tests/api/tracking/tracking-websocket.api.test.ts`
- [x] T049 [P] [US2] Create unit tests for `GetTripTrackingLocationsUseCase` and `ListActiveTripLocationsUseCase` in `tests/unit/tracking/get-trip-tracking-locations.use-case.test.ts` and `tests/unit/tracking/list-active-trip-locations.use-case.test.ts`

### Implementation for User Story 2

- [x] T050 [US2] Implement `GetEmployeeLocationUseCase` and `GetEmployeeTrackingStatusUseCase` in `src/modules/tracking/application/use-cases/get-employee-location.use-case.ts` and `get-employee-tracking-status.use-case.ts`
- [x] T051 [US2] Implement `GetTripTrackingLocationsUseCase` (all members + location/status) in `src/modules/tracking/application/use-cases/get-trip-tracking-locations.use-case.ts`
- [x] T052 [US2] Implement `ListActiveTripLocationsUseCase` with pagination in `src/modules/tracking/application/use-cases/list-active-trip-locations.use-case.ts`
- [x] T053 [US2] Implement read-side authorization (`assertCanViewEmployeeLocation`, `assertCanViewTripTracking`) in `src/modules/tracking/application/policies/tracking-authorization.policy.ts`
- [x] T054 [US2] Complete REST handlers for `GET /tracking/employees/{employeeId}/location`, `GET /tracking/employees/{employeeId}/status`, `GET /trips/{tripId}/tracking/locations`, and `GET /tracking/trips/active/locations` in `src/modules/tracking/presentation/tracking.controller.ts` and `src/modules/tracking/presentation/tracking.routes.ts`
- [x] T055 [US2] Implement `TrackingBroadcastService` and `tracking-broadcast.ws-adapter.ts` room fan-out in `src/modules/tracking/application/services/tracking-broadcast.service.ts` and `src/modules/tracking/infrastructure/tracking-broadcast.ws-adapter.ts`
- [x] T056 [US2] Implement `TrackingWebSocketGateway` with JWT auth, `subscribe:company`, `subscribe:trip`, and downlink events in `src/modules/tracking/presentation/tracking-websocket.gateway.ts`
- [x] T057 [US2] Attach WebSocket server upgrade to HTTP server in `src/server.ts` and wire gateway from `src/config/container.ts`
- [x] T058 [US2] Emit `location:updated` and `tracking:started` from `UpsertCurrentLocationUseCase` via broadcast port in `src/modules/tracking/application/use-cases/upsert-current-location.use-case.ts`
- [x] T059 [US2] Update OpenAPI for read endpoints in `src/modules/tracking/presentation/tracking.openapi.ts`

**Checkpoint**: Owners can REST-load and WebSocket-subscribe to live trip tracking.

---

## Phase 5: User Story 3 — Manager Monitors Authorized Trips (Priority: P2)

**Goal**: Managers have same live visibility as Owners within company scope; unauthorized reads rejected.

**Independent Test**: Manager accesses same endpoints as Owner for company Started Trips; Employee attempting peer location read receives 403.

### Tests for User Story 3

- [x] T060 [P] [US3] Create API authorization tests for Manager read access and Employee forbidden reads in `tests/api/tracking/tracking-authz-manager.api.test.ts`

### Implementation for User Story 3

- [x] T061 [US3] Extend `tracking-authorization.policy.ts` to allow MANAGER on all company read/subscribe paths in `src/modules/tracking/application/policies/tracking-authorization.policy.ts`
- [x] T062 [US3] Apply OWNER/MANAGER role middleware on tracking read routes in `src/modules/tracking/presentation/tracking.routes.ts`
- [x] T063 [US3] Verify WebSocket subscribe authorization for Manager role in `src/modules/tracking/presentation/tracking-websocket.gateway.ts`

**Checkpoint**: Manager monitoring and Employee read denial enforced.

---

## Phase 6: User Story 4 — Tracking Application Auth & Identity (Priority: P2)

**Goal**: Tracking App uses existing JWT; Company and Employee derived from session; impersonation rejected; subscription/account gates apply.

**Independent Test**: Location body cannot override identity; invalid/revoked JWT rejected on REST and WS; blocked subscription cannot transmit.

### Tests for User Story 4

- [x] T064 [P] [US4] Create authentication tests for JWT, missing employee link, and impersonation rejection in `tests/api/tracking/tracking-auth-identity.api.test.ts`
- [x] T065 [P] [US4] Create WebSocket auth rejection tests in `tests/api/tracking/tracking-websocket-auth.api.test.ts`

### Implementation for User Story 4

- [x] T066 [US4] Strip/ignore any client-supplied `employeeId` or `companyId` in request bodies and WS payloads in `src/modules/tracking/presentation/tracking.schemas.ts` and `src/modules/tracking/presentation/tracking-websocket.gateway.ts`
- [x] T067 [US4] Reuse existing account/subscription gates in transmit path via auth context checks in `src/modules/tracking/application/services/tracking-context.service.ts`
- [x] T068 [US4] Implement `tracking:connected` and `tracking:disconnected` server events in `src/modules/tracking/presentation/tracking-websocket.gateway.ts`
- [x] T069 [US4] Add WS uplink `location:update` routing to `UpsertCurrentLocationUseCase` in `src/modules/tracking/presentation/tracking-websocket.gateway.ts`

**Checkpoint**: Tracking App identity binding is secure and non-spoofable.

---

## Phase 7: User Story 5 — Tracking Stops When Trip Ends (Priority: P2)

**Goal**: Completing a Started Trip immediately stops tracking, broadcasts `tracking:stopped`, and rejects further location upserts for that trip.

**Independent Test**: Complete trip while tracking active → WS subscribers receive `tracking:stopped`; Employee location PUT returns 409 afterward.

### Tests for User Story 5

- [x] T070 [P] [US5] Create API workflow test for trip complete stopping tracking in `tests/api/tracking/tracking-trip-complete.api.test.ts`
- [x] T071 [P] [US5] Create unit tests for `StopTrackingForTripUseCase` in `tests/unit/tracking/stop-tracking-for-trip.use-case.test.ts`

### Implementation for User Story 5

- [x] T072 [US5] Implement `StopTrackingForTripUseCase` (clear tripId on affected rows, broadcast stopped) in `src/modules/tracking/application/use-cases/stop-tracking-for-trip.use-case.ts`
- [x] T073 [US5] Implement `TrackingLifecycleAdapter` implementing `TrackingLifecyclePort` in `src/modules/tracking/infrastructure/tracking-lifecycle.adapter.ts`
- [x] T074 [US5] Inject `TrackingLifecyclePort` into `CompleteTripUseCase` and call `stopTrackingForTrip` after complete in `src/modules/trip/application/use-cases/complete-trip.use-case.ts`
- [x] T075 [US5] Record `tracking.stopped` Activity Log per affected employee in `src/modules/tracking/application/use-cases/stop-tracking-for-trip.use-case.ts`
- [x] T076 [US5] Wire lifecycle port in `src/modules/tracking/index.ts` and `src/config/container.ts`

**Checkpoint**: Trip completion halts live tracking immediately.

---

## Phase 8: User Story 6 — Super Admin Observability (Priority: P3)

**Goal**: Super Admin can view active trip locations for any Company; cannot transmit GPS as Employee.

**Independent Test**: Super Admin `GET /admin/companies/{companyId}/tracking/trips/active/locations` returns data; Super Admin `PUT /tracking/location` returns 403.

### Tests for User Story 6

- [x] T077 [P] [US6] Create API tests for Super Admin company tracking list and transmit denial in `tests/api/tracking/tracking-admin.api.test.ts`

### Implementation for User Story 6

- [x] T078 [US6] Implement `AdminListCompanyTripLocationsUseCase` in `src/modules/tracking/application/use-cases/admin-list-company-trip-locations.use-case.ts`
- [x] T079 [US6] Add admin route `GET /admin/companies/:companyId/tracking/trips/active/locations` in `src/modules/tracking/presentation/tracking.routes.ts` and controller handler in `src/modules/tracking/presentation/tracking.controller.ts`
- [x] T080 [US6] Implement `subscribe:admin-company` WebSocket handler for Super Admin in `src/modules/tracking/presentation/tracking-websocket.gateway.ts`
- [x] T081 [US6] Update OpenAPI admin tracking paths in `src/modules/tracking/presentation/tracking.openapi.ts`

**Checkpoint**: Platform support can observe cross-company tracking without transmit privileges.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Offline detection sweep, company isolation hardening, documentation, and quickstart validation.

- [x] T082 [P] Implement `TrackingStalenessSweepService` with periodic offline event emission in `src/modules/tracking/application/services/tracking-staleness-sweep.service.ts`
- [x] T083 Start staleness sweep on server bootstrap in `src/server.ts`
- [x] T084 [P] Create company isolation API tests in `tests/api/tracking/tracking-company-isolation.api.test.ts`
- [x] T085 [P] Create mock-location and coordinate validation API tests in `tests/api/tracking/tracking-validation.api.test.ts`
- [x] T086 [P] Emit `employee:online` and `employee:offline` events from status transitions in `src/modules/tracking/application/services/tracking-status.service.ts` and broadcast port
- [x] T087 Update `docs/api-reference.md` with Live GPS Tracking REST endpoints and WebSocket reference to `specs/016-live-gps-tracking/contracts/websocket-events.md`
- [x] T088 [P] Add rate limiting for location PUT and WS message throttling in `src/modules/tracking/presentation/tracking.routes.ts` and `src/modules/tracking/presentation/tracking-websocket.gateway.ts`
- [x] T089 Run quickstart scenarios from `specs/016-live-gps-tracking/quickstart.md` and fix gaps

**Checkpoint**: Feature complete, documented, and quickstart-validated.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Foundational — MVP transmit path
- **US2 (Phase 4)**: Depends on US1 (needs upsert + broadcast trigger) — Owner read + WS
- **US3 (Phase 5)**: Depends on US2 read/WS routes — authz verification
- **US4 (Phase 6)**: Depends on US1 + US2 — hardens auth on existing paths
- **US5 (Phase 7)**: Depends on US1 — trip complete hook
- **US6 (Phase 8)**: Depends on US2 list use case — admin variant
- **Polish (Phase 9)**: Depends on US1–US6 desired scope

### User Story Dependencies

```text
Foundational → US1 → US2 → US3
                ↓      ↓
               US4    US6
                ↓
               US5
                ↓
              Polish
```

- **US1**: Independent after Foundational (MVP)
- **US2**: Requires US1 upsert use case
- **US3**: Requires US2 read/WS endpoints
- **US4**: Requires US1 + US2 transport paths
- **US5**: Requires US1; integrates with trip complete
- **US6**: Requires US2 list implementation

### Parallel Opportunities

- Phase 1: T003, T004, T005, T006, T007 in parallel
- Phase 2: T010–T019, T022–T028, T033–T037 in parallel after T008–T009 migration
- Within each story: all `[P]` test tasks can run in parallel
- US3 and US5 can proceed in parallel after US2/US1 respectively (different files)

### Parallel Example: User Story 2

```bash
# Tests in parallel:
tests/api/tracking/tracking-read-owner.api.test.ts
tests/api/tracking/tracking-active-list.api.test.ts
tests/api/tracking/tracking-websocket.api.test.ts

# Use cases in parallel (after shared policy):
get-employee-location.use-case.ts
get-trip-tracking-locations.use-case.ts
list-active-trip-locations.use-case.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Employee REST location upsert on Started Trip
5. Demo Tracking App integration with REST-only before WebSocket

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 → Employee transmit (REST MVP)
3. US2 → Owner REST + WebSocket live map
4. US3 + US4 → Manager authz + identity hardening
5. US5 → Trip complete stops tracking
6. US6 → Super Admin support view
7. Polish → offline sweep, docs, quickstart

### Suggested MVP Scope

**Phases 1–3 (T001–T045)**: Employee location transmission via REST on Started Trips — smallest shippable increment.

**Production-ready live map**: Through Phase 4 (US2) for WebSocket real-time updates.

---

## Notes

- Total tasks: **89**
- Use `TripRepository.findStartedTripByEmployee` (existing P006) — no new trip query unless member-list enrichment needed
- WebSocket events documented in `specs/016-live-gps-tracking/contracts/websocket-events.md`, not Swagger
- Do not log raw GPS coordinates at info level in Pino
- Commit after each phase checkpoint
