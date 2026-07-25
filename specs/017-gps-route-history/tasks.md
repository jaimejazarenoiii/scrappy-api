---
description: 'Task list for GPS Route History (P013) feature'
---

# Tasks: P013 — GPS Route History

**Input**: Design documents from `/specs/017-gps-route-history/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md; **P012 (016-live-gps-tracking) implemented and passing**

**Tests**: Included — spec FR-001–FR-010 and success criteria require unit, integration, and API coverage (Vitest + Supertest).

**Organization**: Extends existing `tracking` module. Foundational schema/repo blocks all stories. US1 (append) before US2 (read) is natural but both are P1.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: `US1` = Route recorded during trip, `US2` = Owner views route, `US3` = Manager auth, `US4` = Retention purge

## Path Conventions

P013 extends P012 module layout:

- **Module**: `src/modules/tracking/{domain,application,infrastructure,presentation}/`
- **Cross-module**: `src/config/env.ts`, `src/server.ts`, `src/modules/tracking/index.ts`
- **Swagger**: `src/modules/tracking/presentation/tracking.openapi.ts`, `docs/api-reference.md`
- **Tests**: `tests/unit/tracking/`, `tests/integration/tracking/`, `tests/api/tracking/`, `tests/setup/`
- **Schema**: `prisma/schema.prisma`

---

## Phase 1: Setup (Extension Scaffolding)

**Purpose**: Domain/repository placeholders and test stubs for history feature.

- [x] T001 [P] Create `src/modules/tracking/domain/location-history.repository.ts` interface (append, findLatestByEmployeeTrip, findRoutePoints, deleteByTripIds)
- [x] T002 [P] Create `src/modules/tracking/domain/location-history-rules.ts` with `shouldAppendHistory(lastCapturedAt, now, sampleMs)` helper
- [x] T003 [P] Create application placeholders: `append-location-history.use-case.ts`, `get-trip-tracking-route.use-case.ts`, `location-history-retention.service.ts`, `dto/trip-route.response.ts`
- [x] T004 [P] Create `src/modules/tracking/infrastructure/location-history.prisma-repository.ts` stub and `tests/setup/in-memory-location-history-repository.ts`

**Checkpoint**: History extension files exist alongside P012 tracking module.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema, env, repository, DI wiring — required before any user story.

**⚠️ CRITICAL**: No user story work until this phase completes.

- [x] T005 Add `LocationHistory` model with relations to Company, Employee, Trip and indexes `(tripId, employeeId, capturedAt)`, `(companyId, tripId)`, `(tripId)` in `prisma/schema.prisma`
- [x] T006 Create Prisma migration for `LocationHistory` in `prisma/migrations/`
- [x] T007 [P] Add `LOCATION_HISTORY_SAMPLE_MS`, `LOCATION_HISTORY_RETENTION_DAYS`, `LOCATION_HISTORY_RETENTION_SWEEP_MS` to env schema in `src/config/env.ts` (defaults 15000, 90, 86400000)
- [x] T008 [P] Implement `LocationHistoryPrismaRepository` in `src/modules/tracking/infrastructure/location-history.prisma-repository.ts`
- [x] T009 [P] Implement in-memory `LocationHistoryRepository` in `tests/setup/in-memory-location-history-repository.ts` and register in test setup
- [x] T010 [P] Implement `location-history-rules.ts` unit tests in `tests/unit/tracking/location-history-rules.test.ts`
- [x] T011 Wire `LocationHistoryRepository` into `buildTrackingModule` / `src/modules/tracking/index.ts` and `src/config/container.ts`

**Checkpoint**: Schema migrated; repository injectable; sampling rules tested.

---

## Phase 3: User Story 1 — Route Recorded During Active Trip (Priority: P1) 🎯 MVP

**Goal**: Successful P012 upsert appends history point when sampling allows; rejected upserts do not.

**Independent Test**: Employee upserts on Started Trip → history count increases; rapid upserts within 15s → one history row; no trip / mock GPS → no history.

### Tests for User Story 1

- [x] T012 [P] [US1] Unit tests for `AppendLocationHistoryUseCase` (append, skip sampling, skip on failure path) in `tests/unit/tracking/append-location-history.use-case.test.ts`
- [x] T013 [P] [US1] Integration test for history persistence in `tests/integration/tracking/location-history.persistence.test.ts`
- [x] T014 [P] [US1] API test: upsert creates retrievable route point in `tests/api/tracking/tracking-route-append.api.test.ts`

### Implementation for User Story 1

- [x] T015 [US1] Implement `AppendLocationHistoryUseCase` in `src/modules/tracking/application/use-cases/append-location-history.use-case.ts`
- [x] T016 [US1] Hook append into `UpsertCurrentLocationUseCase` after successful upsert (non-blocking on append failure — log error) in `src/modules/tracking/application/use-cases/upsert-current-location.use-case.ts`
- [x] T017 [US1] Pass history repository + sample interval into upsert use case via `src/modules/tracking/index.ts`
- [x] T018 [P] [US1] Extend WS uplink path to use same upsert (verify history append via shared use case) — no duplicate append logic in `tracking-websocket.gateway.ts`

**Checkpoint**: Transmitting Employee builds history silently; P012 live behavior unchanged.

---

## Phase 4: User Story 2 — Owner Views Trip Route (Priority: P1)

**Goal**: `GET /trips/{tripId}/tracking/route` returns ordered `points[]` per employee with pagination.

**Independent Test**: After tracking on Started then Completed trip, Owner GET returns polyline-ready coordinates; empty employee has `points: []`.

### Tests for User Story 2

- [x] T019 [P] [US2] Unit tests for `GetTripTrackingRouteUseCase` in `tests/unit/tracking/get-trip-tracking-route.use-case.test.ts`
- [x] T020 [P] [US2] API tests: happy path, partial STARTED route, empty employee, pagination in `tests/api/tracking/tracking-route-read.api.test.ts`
- [x] T021 [P] [US2] API test: cross-tenant trip returns 403/404 in `tests/api/tracking/tracking-route-auth.api.test.ts`

### Implementation for User Story 2

- [x] T022 [P] [US2] Implement `TripRouteResponseDto` and mappers in `src/modules/tracking/application/dto/trip-route.response.ts`
- [x] T023 [P] [US2] Add route query Zod schema (`employeeId`, `page`, `limit`, `sortOrder`) in `src/modules/tracking/presentation/tracking.schemas.ts`
- [x] T024 [US2] Implement `GetTripTrackingRouteUseCase` (load trip, members, paginated points, tenant check) in `src/modules/tracking/application/use-cases/get-trip-tracking-route.use-case.ts`
- [x] T025 [US2] Add `getTripRoute` handler in `src/modules/tracking/presentation/tracking.controller.ts`
- [x] T026 [US2] Register `GET /trips/:tripId/tracking/route` with Owner/Manager auth in `src/modules/tracking/presentation/tracking.routes.ts`
- [x] T027 [P] [US2] Extend `tracking.openapi.ts` and `docs/api-reference.md` with route endpoint per `contracts/openapi.yaml`

**Checkpoint**: Owner can load route for map polyline; pagination works for long trips.

---

## Phase 5: User Story 3 — Manager Views Authorized Routes (Priority: P2)

**Goal**: Manager has same read access as Owner; Employee denied.

**Independent Test**: Manager GET succeeds; Employee GET returns 403.

### Tests for User Story 3

- [x] T028 [P] [US3] API tests: Manager read allowed, Employee read denied in `tests/api/tracking/tracking-route-roles.api.test.ts`

### Implementation for User Story 3

- [x] T029 [US3] Extend `tracking-authorization.policy.ts` with `assertCanReadRouteHistory(role)` and use in route use case + controller

**Checkpoint**: Authorization matches P012 read paths.

---

## Phase 6: User Story 4 — Retention and Storage Control (Priority: P2)

**Goal**: Daily sweep deletes history for Trips completed/cancelled > 90 days ago.

**Independent Test**: Old trip history removed; recent trip history retained.

### Tests for User Story 4

- [x] T030 [P] [US4] Unit tests for `LocationHistoryRetentionService` in `tests/unit/tracking/location-history-retention.service.test.ts`
- [x] T031 [P] [US4] Integration test: purge by trip completion date in `tests/integration/tracking/location-history-retention.test.ts`

### Implementation for User Story 4

- [x] T032 [US4] Implement `LocationHistoryRetentionService` (find eligible trips, batch delete history) in `src/modules/tracking/application/services/location-history-retention.service.ts`
- [x] T033 [US4] Start retention sweep on server bootstrap with configurable interval in `src/server.ts` (mirror P012 staleness sweep pattern)
- [x] T034 [US4] Wire retention service in `src/modules/tracking/index.ts`

**Checkpoint**: Storage bounded; 90-day default enforced.

---

## Phase 7: Polish & Cross-Cutting

**Purpose**: Docs, audit compliance, full regression.

- [x] T035 [P] Confirm tracking audit service does not log coordinates at info when appending history
- [x] T036 [P] Update `specs/017-gps-route-history/quickstart.md` scenarios if implementation deviates
- [x] T037 Run full test suite (`npm test`) and fix regressions
- [x] T038 Run quickstart validation checklist manually or via documented curl examples

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Immediate — minimal scaffolding
- **Phase 2 (Foundational)**: Blocks all user stories
- **Phase 3 (US1)**: Depends on Phase 2 — **MVP** (append only, verify via DB/integration)
- **Phase 4 (US2)**: Depends on Phase 2; practically needs US1 data to test read path
- **Phase 5 (US3)**: Depends on Phase 4 route endpoint
- **Phase 6 (US4)**: Depends on Phase 2; can parallelize with Phase 4–5 after T008
- **Phase 7 (Polish)**: After desired stories complete

### User Story Dependencies

| Story | Depends on                             | Delivers                     |
| ----- | -------------------------------------- | ---------------------------- |
| US1   | Foundational                           | History append on upsert     |
| US2   | Foundational (+ US1 for realistic E2E) | Route GET API                |
| US3   | US2                                    | Role matrix on same endpoint |
| US4   | Foundational                           | Retention purge              |

### Parallel Opportunities

- T001–T004 (Setup) all parallel
- T007–T010 (Foundational) parallel after T005–T006
- T012–T014 (US1 tests) parallel before implementation
- T019–T021 (US2 tests) parallel
- T030–T031 (US4 tests) parallel; US4 implementation can run while US2 API is in review

---

## Parallel Example: Foundational

```bash
# After migration (T005–T006), launch in parallel:
Task T007: env vars in src/config/env.ts
Task T008: LocationHistoryPrismaRepository
Task T009: in-memory test repository
Task T010: sampling rules unit tests
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Phase 1–2: Schema + repository
2. Phase 3: Append on upsert
3. Phase 4: Route GET for Owner
4. **STOP and VALIDATE**: quickstart Scenarios 1–4
5. Phase 5–6: Auth hardening + retention
6. Phase 7: Full regression

### Estimated Scope

~38 tasks; smaller than P012 because module/routing/DI already exist.

---

## Notes

- Do **not** change `CurrentLocation` schema or upsert semantics except post-success append hook
- Append failure must **not** fail live tracking (log + continue)
- Retention uses Trip `actualEnd` for COMPLETED/CANCELLED trips
- Super Admin cross-company route read is optional future work (out of scope unless added to spec)
