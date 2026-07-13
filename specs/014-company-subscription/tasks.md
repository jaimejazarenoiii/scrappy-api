---
description: 'Task list for P011 - Company Subscription Management'
---

# Tasks: P011 - Company Subscription Management

**Input**: Design documents from `/specs/014-company-subscription/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml,
quickstart.md; P001–P010 implemented and passing

**Tests**: Included — plan §12 and engineering acceptance criteria require Vitest unit tests and
Supertest API coverage for login entitlement, lifecycle, authorization, overlap, and tenant
isolation.

**Organization**: New `subscription` module (Super Admin admin APIs) + Company/auth extensions.
Foundational schema, `SUPER_ADMIN` role, repositories, and overlap rules block all stories.
US1 (login gate) can use seeded/repo-updated `subscriptionStatus` before create/renew APIs exist.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: `US1` = Login gate by subscription status, `US2` = Create subscription,
  `US3` = Renew, `US4` = Expire/Suspend, `US5` = History + status read

## Path Conventions

- **Module**: `src/modules/subscription/{domain,application,infrastructure,presentation}/`
- **DI / routes**: `src/config/container.ts`, `src/modules/index.ts`
- **Roles / auth**: `src/shared/policy/roles.ts`, `src/modules/auth/`
- **Company**: `src/modules/company/`
- **Schema**: `prisma/schema.prisma`, `prisma/migrations/`
- **Swagger**: `src/swagger/common-schemas.ts`, `src/swagger/openapi.builder.ts`
- **Docs**: `docs/api-reference.md`
- **Tests**: `tests/unit/subscription/`, `tests/api/subscription/`, `tests/setup/`

---

## Phase 1: Setup (Shared Scaffolding)

**Purpose**: Create module placeholders and test directories without changing runtime behavior.

- [x] T001 [P] Create domain placeholders in `src/modules/subscription/domain/company-subscription.entity.ts`, `company-subscription.repository.ts`, `company-subscription-status.ts`, `subscription-period-status.ts`, and `subscription-overlap.service.ts`
- [x] T002 [P] Create application placeholders for DTOs, audit service, authorization policy, and use-case stubs under `src/modules/subscription/application/`
- [x] T003 [P] Create presentation placeholders in `src/modules/subscription/presentation/subscription.controller.ts`, `subscription.routes.ts`, `subscription.schemas.ts`, and `subscription.openapi.ts`
- [x] T004 [P] Create infrastructure placeholders in `src/modules/subscription/infrastructure/company-subscription.prisma-repository.ts` and `mappers/company-subscription.mapper.ts`
- [x] T005 [P] Create test directories `tests/unit/subscription/` and `tests/api/subscription/`

**Checkpoint**: Scaffolding exists for implementation and testing.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema extensions, `SUPER_ADMIN` role, domain/repo, overlap rules, Company field,
errors, in-memory doubles — required before login gate and admin APIs.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [x] T006 Extend `UserRole` with `SUPER_ADMIN` in `src/shared/policy/roles.ts` and Prisma `UserRole` enum in `prisma/schema.prisma`
- [x] T007 Add `CompanySubscriptionStatus` enum + `subscriptionStatus` field (default `TRIAL`) on `Company` in `prisma/schema.prisma` and company domain entity/mapper/repository
- [x] T008 Add `SubscriptionPeriodStatus` enum + `CompanySubscription` model/indexes/constraints per `data-model.md` in `prisma/schema.prisma`
- [x] T009 Create Prisma migration for role + company status + CompanySubscription in `prisma/migrations/`
- [x] T010 [P] Implement company subscription status + period status constants in `src/modules/subscription/domain/company-subscription-status.ts` and `subscription-period-status.ts`
- [x] T011 Implement `CompanySubscriptionEntity` in `src/modules/subscription/domain/company-subscription.entity.ts`
- [x] T012 Implement `CompanySubscriptionRepository` interface (create, findById, listByCompany, findActiveByCompany, updateStatus) in `src/modules/subscription/domain/company-subscription.repository.ts`
- [x] T013 [P] Implement overlap helpers (inclusive range intersection) in `src/modules/subscription/domain/subscription-overlap.service.ts`
- [x] T014 Implement Prisma mapper + repository in `src/modules/subscription/infrastructure/mappers/company-subscription.mapper.ts` and `company-subscription.prisma-repository.ts`
- [x] T015 Extend `CompanyRepository` / Prisma company repo to read/update `subscriptionStatus` in `src/modules/company/`
- [x] T016 Implement `InMemoryCompanySubscriptionRepository` and extend in-memory company/user fixtures for `subscriptionStatus` + `SUPER_ADMIN` in `tests/setup/`
- [x] T017 [P] Add `SUBSCRIPTION_INACTIVE` (or equivalent LifecycleConflict) error path in `src/shared/errors/http-exceptions.ts`
- [x] T018 [P] Add subscription Activity Log action taxonomy entries in `src/modules/activity-log/domain/activity-actions.ts` and `src/shared/audit/activity-log-bridge.ts`
- [x] T019 Wire subscription repository (+ stubs) in `src/config/container.ts`; seed/helper path for Super Admin documented for tests
- [x] T020 [P] Unit tests for overlap service in `tests/unit/subscription/subscription-overlap.service.test.ts`

**Checkpoint**: Persistence, role, Company status field, and overlap rules ready.

---

## Phase 3: User Story 1 - Gate Login by Subscription Status (Priority: P1) 🎯 MVP

**Goal**: Tenant login allowed only for `TRIAL` / `ACTIVE` / `GRACE_PERIOD`; blocked for
`EXPIRED` / `SUSPENDED`. `SUPER_ADMIN` bypasses the subscription gate.

**Independent Test**: Set Company to ACTIVE → Owner login succeeds; set EXPIRED/SUSPENDED → Owner
login denied with `SUBSCRIPTION_INACTIVE`; Super Admin still logs in.

### Tests for User Story 1

- [x] T021 [P] [US1] Unit tests for login subscription policy (allow/deny/bypass) in `tests/unit/auth/login-subscription-policy.test.ts` (or extend login-policy tests)
- [x] T022 [P] [US1] API tests for expired/suspended login denial and allowed statuses in `tests/api/subscription/subscription-login-gate.api.test.ts`

### Implementation for User Story 1

- [x] T023 [US1] Extend `assertValidLoginCompany` / login policy in `src/modules/auth/application/services/login-policy.service.ts` to enforce subscription statuses
- [x] T024 [US1] Update `LoginUseCase` in `src/modules/auth/application/use-cases/login.use-case.ts` to apply gate and bypass for `SUPER_ADMIN`
- [x] T025 [US1] Ensure create-company / seed defaults `subscriptionStatus` to `TRIAL` in company create path and `prisma/seed.ts` (or seed helpers)
- [x] T026 [US1] Document login entitlement behavior in `src/modules/auth/presentation/auth.openapi.ts` (subscription inactive error)

**Checkpoint**: MVP access control works with repo/seeded status updates.

---

## Phase 4: User Story 2 - Create Subscription (Priority: P1)

**Goal**: Super Admin creates a non-overlapping subscription period and updates Company
`subscriptionStatus`. Owners/Managers/Employees denied.

**Independent Test**: Super Admin `POST /admin/companies/{id}/subscriptions` → 201 + history row +
company status updated; overlap / dual ACTIVE → 400; Owner → 403.

### Tests for User Story 2

- [x] T027 [P] [US2] Unit tests for create use case (overlap, dual ACTIVE, company status) in `tests/unit/subscription/create-subscription.use-case.test.ts`
- [x] T028 [P] [US2] API tests for create success/validation/authz in `tests/api/subscription/subscription-create.api.test.ts`

### Implementation for User Story 2

- [x] T029 [US2] Implement create request/response DTOs in `src/modules/subscription/application/dto/`
- [x] T030 [US2] Implement `CreateSubscriptionUseCase` (overlap + single ACTIVE + company status + audit) in `src/modules/subscription/application/use-cases/create-subscription.use-case.ts`
- [x] T031 [US2] Implement Zod schemas for create body + companyId params in `src/modules/subscription/presentation/subscription.schemas.ts`
- [x] T032 [US2] Implement controller create handler + admin routes with `authorize(['SUPER_ADMIN'])` in `subscription.controller.ts` and `subscription.routes.ts`
- [x] T033 [US2] Register admin subscription routes in `src/modules/index.ts` and wire controller in `src/config/container.ts`
- [x] T034 [US2] Add OpenAPI paths/schemas for create in `subscription.openapi.ts`, `common-schemas.ts`, `openapi.builder.ts`
- [x] T035 [US2] Emit Activity Log / structured audit `subscription.created` via subscription audit helper

**Checkpoint**: Super Admin can create entitlements; tenants cannot.

---

## Phase 5: User Story 3 - Renew Subscription (Priority: P2)

**Goal**: Super Admin renews by closing prior ACTIVE period (→ EXPIRED) and creating a new
non-overlapping period; history preserved.

**Independent Test**: With an ACTIVE period, renew with valid next window → new row + prior
EXPIRED + company ACTIVE; overlapping renew → 400.

### Tests for User Story 3

- [x] T036 [P] [US3] Unit tests for renew use case in `tests/unit/subscription/renew-subscription.use-case.test.ts`
- [x] T037 [P] [US3] API tests for renew success/overlap in `tests/api/subscription/subscription-renew.api.test.ts`

### Implementation for User Story 3

- [x] T038 [US3] Implement renew DTO + Zod schema in application dto / `subscription.schemas.ts`
- [x] T039 [US3] Implement `RenewSubscriptionUseCase` in `src/modules/subscription/application/use-cases/renew-subscription.use-case.ts`
- [x] T040 [US3] Add `POST .../subscriptions/renew` route + controller method
- [x] T041 [US3] Update OpenAPI for renew; emit `subscription.renewed` Activity Log

**Checkpoint**: Renewal extends entitlement without rewriting closed history beyond allowed ACTIVE→EXPIRED.

---

## Phase 6: User Story 4 - Expire or Suspend (Priority: P2)

**Goal**: Expire sets Company `EXPIRED` and transitions current ACTIVE period to EXPIRED.
Suspend sets Company `SUSPENDED` (period may stay ACTIVE). Both block tenant login. Owners denied.

**Independent Test**: Expire → Owner login fails; Suspend → Owner login fails; history still
lists periods; Owner cannot call expire/suspend.

### Tests for User Story 4

- [x] T042 [P] [US4] Unit tests for expire and suspend use cases in `tests/unit/subscription/expire-subscription.use-case.test.ts` and `suspend-company-subscription.use-case.test.ts`
- [x] T043 [P] [US4] API tests for expire/suspend + login denial in `tests/api/subscription/subscription-expire-suspend.api.test.ts`

### Implementation for User Story 4

- [x] T044 [US4] Implement `ExpireSubscriptionUseCase` in `src/modules/subscription/application/use-cases/expire-subscription.use-case.ts`
- [x] T045 [US4] Implement `SuspendCompanySubscriptionUseCase` in `src/modules/subscription/application/use-cases/suspend-company-subscription.use-case.ts`
- [x] T046 [US4] Add Zod schemas + controller/routes for expire and suspend endpoints
- [x] T047 [US4] Update OpenAPI; emit `subscription.expired` / `subscription.suspended` Activity Logs

**Checkpoint**: Ops can cut off access; login gate from US1 enforces it.

---

## Phase 7: User Story 5 - View Status and History (Priority: P3)

**Goal**: Super Admin lists history and gets subscription by id / company status. Company users
read-only `GET /companies/me/subscription-status`. No historical edit/delete HTTP methods.

**Independent Test**: Create multiple periods → history returns all; get-by-id works; me-status
returns current enum; PATCH/DELETE history → 404/405; wrong-company id → 404.

### Tests for User Story 5

- [x] T048 [P] [US5] Unit tests for list/get/status use cases in `tests/unit/subscription/list-subscription-history.use-case.test.ts` and related files
- [x] T049 [P] [US5] API tests for history, get-by-id, admin status, me-status, immutability in `tests/api/subscription/subscription-history-status.api.test.ts`

### Implementation for User Story 5

- [x] T050 [US5] Implement `ListSubscriptionHistoryUseCase`, `GetSubscriptionUseCase`, `GetCompanySubscriptionStatusUseCase`, `GetMySubscriptionStatusUseCase` under `src/modules/subscription/application/use-cases/`
- [x] T051 [US5] Add Zod query/params + controller handlers for history, get-by-id, admin status, me-status
- [x] T052 [US5] Register me-status on company-facing routes (authn + company resolution) in `src/modules/index.ts` / company or subscription routes
- [x] T053 [US5] Complete OpenAPI for all read endpoints in `subscription.openapi.ts` and common schemas

**Checkpoint**: Full read surface matches contracts.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Docs, seeds, quickstart validation, regression.

- [x] T054 [P] Update Activity Logs / subscription section in `docs/api-reference.md`
- [x] T055 Align Swagger with `specs/014-company-subscription/contracts/openapi.yaml`
- [x] T056 [P] Add Super Admin + trial company fixtures/helpers in `tests/setup/` and document seed in `prisma/seed.ts` (or dedicated seed script)
- [x] T057 [P] API tests for non–Super Admin 403 matrix and cross-company 404 in `tests/api/subscription/subscription-authz-tenant.api.test.ts`
- [x] T058 Run/confirm scenarios from `specs/014-company-subscription/quickstart.md`
- [x] T059 Smoke: password-change gate + subscription gate both apply for tenant users in `tests/api/subscription/subscription-login-gate.api.test.ts` (and password-gate regression if present)
- [x] T060 Implement shared entitlement cascade helper (allowed → Company+Users ACTIVE; blocked → Company+Users INACTIVE + revoke sessions) in `src/modules/subscription/application/services/subscription-account-cascade.service.ts`
- [x] T061 Wire cascade into create/renew use cases in `src/modules/subscription/application/use-cases/create-subscription.use-case.ts` and `renew-subscription.use-case.ts`
- [x] T062 Wire cascade into expire/suspend use cases in `src/modules/subscription/application/use-cases/expire-subscription.use-case.ts` and `suspend-company-subscription.use-case.ts`
- [x] T063 [P] Unit/API tests asserting Company+User ACTIVE↔INACTIVE cascade and session revoke in `tests/unit/subscription/subscription-account-cascade.test.ts` and `tests/api/subscription/subscription-expire-suspend.api.test.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Immediate
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories
- **US1 (Phase 3)**: After Foundational — MVP login gate
- **US2 (Phase 4)**: After Foundational (ideally after US1 so create→login can be e2e validated)
- **US3 (Phase 5)**: After US2 (needs create/ACTIVE period)
- **US4 (Phase 6)**: After US2 (needs entitlement to expire/suspend); validates US1 denial
- **US5 (Phase 7)**: After US2 (history needs rows); can parallelize reads with US3/US4 if staffed
- **Polish (Phase 8)**: After desired stories complete

### User Story Dependencies

```text
Foundational
    ├── US1 Login gate (MVP)
    ├── US2 Create ────────┬── US3 Renew
    │                      ├── US4 Expire/Suspend
    │                      └── US5 History/Status
    └── (US1 validates US4 outcomes)
```

### Parallel Opportunities

- Phase 1: T001–T005 all [P]
- Phase 2: T010, T013, T017, T018, T020 [P] after schema decisions land
- Within each story: unit + API test tasks [P]; OpenAPI can trail implementation slightly
- US5 read endpoints can start once create exists, parallel to renew/expire workstreams

---

## Parallel Example: User Story 2

```bash
# Tests in parallel:
Task: "Unit tests for create use case in tests/unit/subscription/create-subscription.use-case.test.ts"
Task: "API tests for create in tests/api/subscription/subscription-create.api.test.ts"

# After use case exists:
Task: "Zod schemas in subscription.schemas.ts"
Task: "OpenAPI create paths in subscription.openapi.ts"
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Phase 1 Setup
2. Phase 2 Foundational
3. Phase 3 US1 login gate
4. **STOP and VALIDATE** with status toggled via seed/repo
5. Demo: Expired company cannot log in

### Incremental Delivery

1. US1 → access control live
2. US2 → Super Admin can entitle Companies
3. US3 → renewals
4. US4 → expire/suspend ops
5. US5 → history + status UX
6. Polish → docs + quickstart

### Suggested MVP Scope

**US1 (login gate) + Foundational** is the minimum shippable control plane.
**US2** should follow immediately so ops can manage status without DB edits.

---

## Notes

- [P] = different files, no incomplete-task dependencies
- Do not emit Prisma schema blocks in design docs; migrations happen in T006–T009
- Closed periods (`EXPIRED`/`CANCELLED`) must reject updates in application layer
- Suspend must not require cancelling the ACTIVE period (per plan/research)
- Commit after each task or logical group
