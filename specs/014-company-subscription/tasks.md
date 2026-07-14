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

**Status (2026-07-14)**: All tasks complete (T001–T087).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: `US1` = Login gate, `US2` = Create, `US3` = Renew, `US4` = Expire/Suspend,
  `US5` = History/status/update reads, `US6` = Reactivate company access

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

- [x] T021 [P] [US1] Unit tests for login subscription policy (allow/deny/bypass) in `tests/unit/auth/login-subscription-policy.test.ts`
- [x] T022 [P] [US1] API tests for expired/suspended login denial and allowed statuses in `tests/api/subscription/subscription-login-gate.api.test.ts`

### Implementation for User Story 1

- [x] T023 [US1] Extend `assertValidLoginCompany` / login policy in `src/modules/auth/application/services/login-policy.service.ts` to enforce subscription statuses
- [x] T024 [US1] Update `LoginUseCase` in `src/modules/auth/application/use-cases/login.use-case.ts` to apply gate and bypass for `SUPER_ADMIN`
- [x] T025 [US1] Ensure create-company / seed defaults `subscriptionStatus` to `TRIAL` in company create path and `prisma/seed.ts`
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

- [x] T029 [US2] Implement create request/response DTOs in `src/modules/subscription/application/dto/subscription.dto.ts`
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

- [x] T038 [US3] Implement renew DTO + Zod schema in `src/modules/subscription/application/dto/subscription.dto.ts` and `subscription.schemas.ts`
- [x] T039 [US3] Implement `RenewSubscriptionUseCase` in `src/modules/subscription/application/use-cases/renew-subscription.use-case.ts`
- [x] T040 [US3] Add `POST .../subscriptions/renew` route + controller method in `subscription.routes.ts` and `subscription.controller.ts`
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
- [x] T046 [US4] Add Zod schemas + controller/routes for expire and suspend endpoints in `subscription.schemas.ts`, `subscription.routes.ts`, `subscription.controller.ts`
- [x] T047 [US4] Update OpenAPI; emit `subscription.expired` / `subscription.suspended` Activity Logs

**Checkpoint**: Ops can cut off access; login gate from US1 enforces it.

---

## Phase 7: User Story 5 - View Status, History, and Update Open Periods (Priority: P3)

**Goal**: Super Admin lists history, gets subscription by id, updates open periods (PATCH),
and reads company status. Company users read-only `GET /companies/me/subscription-status`.
Closed periods immutable.

**Independent Test**: Create multiple periods → history returns all; PATCH open period succeeds;
PATCH closed period → 400; me-status returns current enum; wrong-company id → 404.

### Tests for User Story 5

- [x] T048 [P] [US5] Unit tests for list/get/status use cases in `tests/unit/subscription/list-subscription-history.use-case.test.ts` and related files
- [x] T049 [P] [US5] API tests for history, get-by-id, admin status, me-status, update in `tests/api/subscription/subscription-history-status.api.test.ts` and `subscription-update.api.test.ts`

### Implementation for User Story 5

- [x] T050 [US5] Implement `ListSubscriptionHistoryUseCase`, `GetSubscriptionUseCase`, `GetCompanySubscriptionStatusUseCase`, `GetMySubscriptionStatusUseCase` under `src/modules/subscription/application/use-cases/`
- [x] T051 [US5] Implement `UpdateSubscriptionUseCase` in `src/modules/subscription/application/use-cases/update-subscription.use-case.ts`
- [x] T052 [US5] Add Zod query/params + controller handlers for history, get-by-id, admin status, me-status, PATCH update in `subscription.controller.ts` and `subscription.routes.ts`
- [x] T053 [US5] Register me-status on company-facing routes in `src/modules/index.ts`
- [x] T054 [US5] Complete OpenAPI for read/update endpoints in `subscription.openapi.ts` and `common-schemas.ts`

**Checkpoint**: Full read/update surface matches core contracts (current + reactivate pending).

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Docs, seeds, quickstart validation, account cascade, regression.

- [x] T055 [P] Update subscription section in `docs/api-reference.md`
- [x] T056 Align Swagger with `specs/014-company-subscription/contracts/openapi.yaml` (core endpoints)
- [x] T057 [P] Add Super Admin + trial company fixtures/helpers in `tests/setup/` and `prisma/seed.ts`
- [x] T058 [P] API tests for non–Super Admin 403 matrix and cross-company 404 in `tests/api/subscription/subscription-authz-tenant.api.test.ts`
- [x] T059 Run/confirm quickstart scenarios A, B, D, E, F from `specs/014-company-subscription/quickstart.md`
- [x] T060 Smoke: password-change gate + subscription gate both apply for tenant users in `tests/api/subscription/subscription-login-gate.api.test.ts`
- [x] T061 Implement shared entitlement cascade helper in `src/modules/subscription/application/services/subscription-account-cascade.service.ts`
- [x] T062 Wire cascade into create/renew use cases in `create-subscription.use-case.ts` and `renew-subscription.use-case.ts`
- [x] T063 Wire cascade into expire/suspend use cases in `expire-subscription.use-case.ts` and `suspend-company-subscription.use-case.ts`
- [x] T064 [P] Unit/API tests asserting Company+User ACTIVE↔INACTIVE cascade and session revoke in `tests/unit/subscription/subscription-account-cascade.test.ts` and `tests/api/subscription/subscription-expire-suspend.api.test.ts`

**Checkpoint**: Core P011 MVP shipped; plan-delta items remain in Phases 9–10.

---

## Phase 9: User Story 6 - Reactivate Company Access (Priority: P2)

**Goal**: Super Admin restores tenant access from `SUSPENDED` without creating a new commercial
period when an ACTIVE period still exists. Distinct from renew (commercial extension after expire).

**Independent Test**: Suspend company → Owner login denied; `POST .../subscriptions/reactivate` →
Company `ACTIVE`, Users `ACTIVE`, Owner login succeeds; no new history row when period unchanged.

### Tests for User Story 6

- [x] T065 [P] [US6] Unit tests for reactivate use case (from SUSPENDED, reject EXPIRED without period) in `tests/unit/subscription/reactivate-company-subscription.use-case.test.ts`
- [x] T066 [P] [US6] API tests for reactivate success, authz, cascade, login restore in `tests/api/subscription/subscription-reactivate.api.test.ts`

### Implementation for User Story 6

- [x] T067 [US6] Add `subscription.reactivated` to `SUBSCRIPTION_AUDIT_ACTIONS` in `src/modules/subscription/application/services/subscription-audit.service.ts` and Activity Log bridge
- [x] T068 [US6] Implement `ReactivateCompanySubscriptionUseCase` in `src/modules/subscription/application/use-cases/reactivate-company-subscription.use-case.ts` (validate SUSPENDED, set allowed status, cascade ACTIVE, optional notes)
- [x] T069 [US6] Add `reactivateCompanySchema` in `src/modules/subscription/presentation/subscription.schemas.ts`
- [x] T070 [US6] Add `POST .../subscriptions/reactivate` route + controller handler in `subscription.routes.ts` and `subscription.controller.ts`
- [x] T071 [US6] Wire use case in `src/modules/subscription/index.ts` and `src/config/container.ts`
- [x] T072 [US6] Add OpenAPI path/schema for reactivate in `subscription.openapi.ts` and `src/swagger/common-schemas.ts`

**Checkpoint**: Suspend/resume ops cycle complete without forcing renew.

---

## Phase 10: Extensions - Current Subscription & Audit Fields (Priority: P3)

**Goal**: Align persistence and API with updated plan/data-model: `activatedAt`, `updatedBy`,
and `GET .../subscriptions/current` for the ACTIVE period.

**Independent Test**: Create ACTIVE period → current endpoint returns it; after expire → 404;
responses include `activatedAt`/`updatedBy` where applicable.

### Schema & domain

- [x] T073 Add `activatedAt` (nullable) and `updatedBy` (nullable) to `CompanySubscription` in `prisma/schema.prisma` per `data-model.md`
- [x] T074 Create Prisma migration in `prisma/migrations/` for audit fields
- [x] T075 [P] Extend `CompanySubscriptionEntity`, repository interface, mapper, and Prisma repo in `src/modules/subscription/domain/` and `src/modules/subscription/infrastructure/`
- [x] T076 [P] Extend in-memory subscription repository in `tests/setup/` for new fields

### Use-case wiring

- [x] T077 [US5] Set `activatedAt` when period becomes ACTIVE in `create-subscription.use-case.ts`, `renew-subscription.use-case.ts`, and `update-subscription.use-case.ts`
- [x] T078 [US5] Set `updatedBy` on allowed mutations in create/renew/update/expire use cases in `src/modules/subscription/application/use-cases/`
- [x] T079 [US5] Expose `activatedAt` and `updatedBy` in `src/modules/subscription/application/dto/subscription.dto.ts` response mappers

### Current subscription endpoint

- [x] T080 [P] [US5] Unit tests for `GetCurrentSubscriptionUseCase` in `tests/unit/subscription/get-current-subscription.use-case.test.ts`
- [x] T081 [P] [US5] API tests for `GET .../subscriptions/current` in `tests/api/subscription/subscription-current.api.test.ts`
- [x] T082 [US5] Implement `GetCurrentSubscriptionUseCase` in `src/modules/subscription/application/use-cases/get-current-subscription.use-case.ts` (delegate to `findActiveByCompany`)
- [x] T083 [US5] Add route + controller handler for `GET /admin/companies/:companyId/subscriptions/current` in `subscription.routes.ts` and `subscription.controller.ts`
- [x] T084 [US5] Wire use case in `src/modules/subscription/index.ts` and `src/config/container.ts`
- [x] T085 [US5] Add OpenAPI for current subscription in `subscription.openapi.ts` and `specs/014-company-subscription/contracts/openapi.yaml`

### Polish

- [x] T086 [P] Update `docs/api-reference.md` for reactivate, current subscription, and audit fields
- [x] T087 Run quickstart scenarios C, C2, and G from `specs/014-company-subscription/quickstart.md`

**Checkpoint**: Plan-delta complete; feature matches updated plan §6 and data-model.md.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Immediate
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories
- **US1 (Phase 3)**: After Foundational — MVP login gate ✅
- **US2 (Phase 4)**: After Foundational ✅
- **US3 (Phase 5)**: After US2 ✅
- **US4 (Phase 6)**: After US2 ✅
- **US5 (Phase 7)**: After US2 ✅
- **Polish (Phase 8)**: After core stories ✅
- **US6 (Phase 9)**: After US4 (needs suspend) — ✅
- **Extensions (Phase 10)**: After US2 — ✅

### User Story Dependencies

```text
Foundational ✅
    ├── US1 Login gate (MVP) ✅
    ├── US2 Create ✅ ──┬── US3 Renew ✅
    │                   ├── US4 Expire/Suspend ✅
    │                   ├── US5 History/Status/Update ✅
    │                   ├── US6 Reactivate ✅
    │                   └── Extensions: current + audit fields ✅
    └── (US1 validates US4/US6 outcomes)
```

### Parallel Opportunities

- Phase 9: T065, T066 [P] (tests); T067–T072 sequential per file
- Phase 10: T075, T076, T080, T081, T086 [P]; T073→T074 before domain/repo tasks
- Phases 9 and 10 can run in parallel by different developers after Phase 8

---

## Parallel Example: User Story 6

```bash
# Tests in parallel:
Task: "Unit tests in tests/unit/subscription/reactivate-company-subscription.use-case.test.ts"
Task: "API tests in tests/api/subscription/subscription-reactivate.api.test.ts"

# After use case:
Task: "Zod schema in subscription.schemas.ts"
Task: "OpenAPI reactivate path in subscription.openapi.ts"
```

---

## Implementation Strategy

### MVP First (US1 only) — ✅ DONE

1. Phase 1 Setup
2. Phase 2 Foundational
3. Phase 3 US1 login gate

### Incremental Delivery — current state

1. US1 → access control live ✅
2. US2 → Super Admin can entitle Companies ✅
3. US3 → renewals ✅
4. US4 → expire/suspend ops ✅
5. US5 → history + status + update ✅
6. Polish → docs + cascade ✅
7. US6 → reactivate ✅
8. Extensions → current + audit fields ✅

### Suggested MVP Scope

**US1 + US2 + Foundational** was minimum shippable control plane — **delivered**.
**Next slice**: Phase 9 (reactivate) then Phase 10 (current + audit fields).

---

## Notes

- [P] = different files, no incomplete-task dependencies
- Closed periods (`EXPIRED`/`CANCELLED`) must reject updates in application layer
- Suspend must not require cancelling the ACTIVE period (per plan/research)
- Reactivate from `EXPIRED` without ACTIVE period must reject — use renew instead
- `activatedAt` set once on first transition to ACTIVE; `updatedBy` on each allowed mutation
- Commit after each task or logical group
