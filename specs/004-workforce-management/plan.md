# Implementation Plan: P003 - Workforce Management

**Branch**: `004-workforce-management` | **Date**: 2026-07-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-workforce-management/spec.md`

**Note**: This plan extends P001 (Company & Identity Foundation) and P002 (Organization Management)
with workforce operational controls. It is the definitive technical design for implementation — not
implementation code.

## Summary

Implement Workforce Management as five domain modules (`attendance`, `leave`, `cash-advance`,
`payroll`, `workforce-dashboard`) under the `/api/v1/workforce` route namespace. Each module follows
modular Clean Architecture with company tenant isolation, role-based authorization, Zod validation,
standard API envelopes, OpenAPI documentation, and Vitest/Supertest coverage. Attendance sessions
gate operational readiness via shared `isOperationallyReady()` primitives for future Transaction
and Expense modules.

## Technical Context

**Language/Version**: TypeScript (strict mode) on Node.js LTS

**Primary Dependencies**: Express.js, Prisma ORM, PostgreSQL, Zod, JWT (from P001), Pino,
Swagger/OpenAPI, Vitest, Supertest

**Storage**: PostgreSQL with Prisma repositories in infrastructure layer only

**Testing**: Vitest (unit/integration), Supertest (API/authorization/tenant isolation)

**Target Platform**: Linux server (Docker); local dev via docker-compose

**Project Type**: modular REST API backend extending P001/P002

**Performance Goals**: attendance Time In/Out under 30 seconds for 95% of scenarios; list endpoints
paginated with default 20 items; tenant filter on every query

**Constraints**: Company is hard tenant boundary; Employees access own records unless
Manager/Owner; one open attendance session per Employee; weekly pay periods span exactly seven days;
no negative net pay; archived Employees cannot Time In

**Scale/Scope**: 5 modules, 18 protected endpoints, shared workforce readiness primitives

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate                             | Pre-Design | Post-Design | Notes                                                                    |
| -------------------------------- | ---------- | ----------- | ------------------------------------------------------------------------ |
| Layer boundaries                 | ✅         | ✅          | Each module follows domain → application → infrastructure → presentation |
| No business logic in controllers | ✅         | ✅          | Controllers delegate to use cases only                                   |
| Repository pattern               | ✅         | ✅          | Workforce repositories behind interfaces                                 |
| Dependency injection             | ✅         | ✅          | Wired in `src/config/container.ts`                                       |
| Zod validation                   | ✅         | ✅          | Per-module schemas for mutations and list queries                        |
| DTOs                             | ✅         | ✅          | Request/response DTOs per module; dashboard read model                   |
| Standard response envelope       | ✅         | ✅          | Reuses P001 `success()` / `failure()` helpers                            |
| Pagination conventions           | ✅         | ✅          | `page`, `limit`, `sortBy`, `sortOrder`, date filters on list endpoints   |
| Security                         | ✅         | ✅          | JWT bearer auth, tenant middleware, role authorization                   |
| No `any`                         | ✅         | ✅          | Strict TypeScript throughout                                             |
| Error handling                   | ✅         | ✅          | Reuses global error middleware and error codes                           |
| Logging                          | ✅         | ✅          | Audit events for attendance, leave, cash advance, payroll mutations      |
| Tests                            | ✅         | ✅          | Unit, integration, API, auth, validation, tenant isolation               |
| OpenAPI                          | ✅         | ✅          | Tags: Attendance, Leave, Cash Advances, Payroll, Dashboard               |
| Simplicity                       | ✅         | ✅          | Five focused modules; dashboard is read-only composition                 |

## 1. Module Architecture

### Module responsibilities

| Module                | Responsibility                                                       |
| --------------------- | -------------------------------------------------------------------- |
| `attendance`          | Time In/Out, status, history, company list, manager corrections      |
| `leave`               | Leave requests, history, company list, manager status updates        |
| `cash-advance`        | Create advances (Manager/Owner), scoped history lists                |
| `payroll`             | Weekly generation, history, detail, mark-paid, deduction application |
| `workforce-dashboard` | Read model composing attendance, summaries, and visibility flags     |

### Dependencies on P001/P002

- `company` module: tenant boundary validation
- `employee` module: Employee lookup, `weeklySalary`, archived status checks
- `auth` module: JWT authentication middleware
- `shared/tenant`: `TenantContext`, company resolution middleware
- `shared/policy`: role enums, `authorize()` middleware
- `shared/errors`: `AppError` hierarchy, error codes
- `shared/http`: API envelope helpers
- `shared/pagination`: pagination types and query schema
- `shared/audit`: audit event contracts
- `middleware/*`: authentication, authorization, validation, error handling

### Internal module organization

Each workforce module follows P001/P002 structure:

```text
src/modules/{module}/
├── domain/
│   ├── {entity}.entity.ts
│   ├── {entity}-status.ts
│   ├── {entity}-rules.ts
│   └── {entity}.repository.ts
├── application/
│   ├── dto/
│   ├── use-cases/
│   ├── policies/
│   │   └── {module}-authorization.policy.ts
│   └── services/
│       └── {module}-audit.service.ts
├── infrastructure/
│   ├── {entity}.prisma-repository.ts
│   └── mappers/
│       └── {entity}.mapper.ts
└── presentation/
    ├── {module}.controller.ts
    ├── {module}.routes.ts
    ├── {module}.schemas.ts
    └── {module}.openapi.ts
```

### Service boundaries

- **Presentation**: HTTP routing under `/api/v1/workforce`, Zod validation, controller mapping
- **Application**: use case orchestration, DTO mapping, payroll deduction logic, audit emission
- **Domain**: entity behavior, business rules, repository interfaces
- **Infrastructure**: Prisma persistence, record-to-entity mapping

No module may import Prisma types into domain or application layers.

### Shared components (new for P003)

```text
src/shared/workforce/
├── operational-readiness.ts   # isOperationallyReady(openSession)
├── employee-context.ts        # resolve acting employeeId from auth context
└── pay-period.ts              # validate weekly pay period boundaries
```

## 2. Entity Design

See [data-model.md](./data-model.md) for full field tables. Summary below.

### AttendanceSession

**Purpose**: Timed work period gating operational readiness.

| Field      | Type     | Notes                   |
| ---------- | -------- | ----------------------- |
| id         | UUID     | PK                      |
| companyId  | UUID     | FK → Company            |
| employeeId | UUID     | FK → Employee           |
| status     | enum     | `OPEN`, `CLOSED`        |
| timeInAt   | datetime | Session start           |
| timeOutAt  | datetime | Nullable until Time Out |
| note       | string   | Optional employee note  |

**Indexes**: `(companyId, employeeId, status)`; `(companyId, employeeId, timeInAt)`

### LeaveRecord

**Purpose**: Half Day or Full Day leave for workforce planning.

| Field     | Type   | Notes                                          |
| --------- | ------ | ---------------------------------------------- |
| leaveType | enum   | `HALF_DAY`, `FULL_DAY`                         |
| leaveDate | date   | Calendar date                                  |
| status    | enum   | `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED` |
| reason    | string | Optional                                       |

### CashAdvance

**Purpose**: Advance tracked for payroll deduction.

| Field           | Type    | Notes                    |
| --------------- | ------- | ------------------------ |
| amount          | decimal | Original advance         |
| deductedAmount  | decimal | Already deducted         |
| remainingAmount | decimal | Balance remaining        |
| status          | enum    | `OUTSTANDING`, `SETTLED` |

### PayrollRecord

**Purpose**: Weekly payroll line per Employee.

| Field                 | Type    | Notes                      |
| --------------------- | ------- | -------------------------- |
| payPeriodStart/End    | date    | Inclusive seven-day period |
| grossSalary           | decimal | From Employee.weeklySalary |
| cashAdvanceDeductions | decimal | Applied this period        |
| netPay                | decimal | gross - deductions         |
| status                | enum    | `PAYABLE`, `PAID`          |

**Unique**: `(companyId, employeeId, payPeriodStart)`

## 3. Relationship Design

```text
Company (P001)
│
├── 1:N → Employees (P001)
│         │
│         ├── 1:N → AttendanceSessions
│         ├── 1:N → LeaveRecords
│         ├── 1:N → CashAdvances
│         └── 1:N → PayrollRecords
```

**Ownership**: Every workforce row carries `companyId`. Employee-scoped records also carry
`employeeId`. All repository queries MUST include `companyId` from authenticated tenant context.

**Employee context resolution**: Self-service endpoints resolve `employeeId` from
`User.employeeId` link. Manager/Owner endpoints accept explicit `employeeId` filters or targets.

**Future relationships** (not implemented in P003):

| Future Module | Relationship                                            |
| ------------- | ------------------------------------------------------- |
| Transactions  | Requires `isOperationallyReady()` from attendance       |
| Expenses      | Requires `isOperationallyReady()` from attendance       |
| Trips         | Dashboard tripsSummary populated from Trip module       |
| Analytics     | Aggregations over attendance, payroll, leave by company |

P003 exports `isOperationallyReady()` for downstream modules.

## 4. API Design

All endpoints require authentication. All responses use standard envelope. List endpoints include
pagination metadata in `meta`. Base path: `/api/v1/workforce`.

### Attendance

| Method | URI                                    | Purpose        | Auth Roles                |
| ------ | -------------------------------------- | -------------- | ------------------------- |
| POST   | `/workforce/attendance/time-in`        | Time In        | EMPLOYEE (linked profile) |
| POST   | `/workforce/attendance/time-out`       | Time Out       | EMPLOYEE (linked profile) |
| GET    | `/workforce/attendance/status`         | Current status | EMPLOYEE                  |
| GET    | `/workforce/attendance`                | My history     | EMPLOYEE                  |
| GET    | `/workforce/attendance/company`        | Company list   | OWNER, MANAGER            |
| PATCH  | `/workforce/attendance/{attendanceId}` | Manage/correct | OWNER, MANAGER            |

### Leave

| Method | URI                          | Purpose       | Auth Roles     |
| ------ | ---------------------------- | ------------- | -------------- |
| POST   | `/workforce/leave`           | Request leave | EMPLOYEE       |
| GET    | `/workforce/leave`           | My history    | EMPLOYEE       |
| GET    | `/workforce/leave/company`   | Company list  | OWNER, MANAGER |
| PATCH  | `/workforce/leave/{leaveId}` | Manage leave  | OWNER, MANAGER |

### Cash Advances

| Method | URI                                | Purpose      | Auth Roles     |
| ------ | ---------------------------------- | ------------ | -------------- |
| POST   | `/workforce/cash-advances`         | Create       | OWNER, MANAGER |
| GET    | `/workforce/cash-advances`         | My history   | EMPLOYEE       |
| GET    | `/workforce/cash-advances/company` | Company list | OWNER, MANAGER |

### Payroll

| Method | URI                                        | Purpose         | Auth Roles           |
| ------ | ------------------------------------------ | --------------- | -------------------- |
| POST   | `/workforce/payroll`                       | Generate weekly | OWNER, MANAGER       |
| GET    | `/workforce/payroll`                       | History         | ALL (scoped by role) |
| GET    | `/workforce/payroll/{payrollId}`           | Detail          | ALL (scoped by role) |
| POST   | `/workforce/payroll/{payrollId}/mark-paid` | Mark paid       | OWNER, MANAGER       |

### Dashboard

| Method | URI                    | Purpose   | Auth Roles |
| ------ | ---------------------- | --------- | ---------- |
| GET    | `/workforce/dashboard` | Dashboard | EMPLOYEE   |

Full OpenAPI contract: [contracts/openapi.yaml](./contracts/openapi.yaml)

## 5. Validation Design

### Zod schema organization

```text
src/modules/attendance/presentation/attendance.schemas.ts
src/modules/leave/presentation/leave.schemas.ts
src/modules/cash-advance/presentation/cash-advance.schemas.ts
src/modules/payroll/presentation/payroll.schemas.ts
src/validations/common-query.schemas.ts  # extended workforce list queries
```

### Attendance validation

- Time In: reject if open session exists; reject archived Employee
- Time Out: reject if no open session
- Manage PATCH: at least one of `correctionNote`, `adjustedTimeInAt`, `adjustedTimeOutAt`
- Adjusted times must remain chronologically consistent

### Leave validation

- `leaveType`: `HALF_DAY` | `FULL_DAY`
- `leaveDate`: valid date, not in distant past per policy
- Overlap: reject duplicate non-cancelled leave on same date for same Employee
- `reason`: optional, max 500 chars

### Cash advance validation

- `amount`: positive decimal
- `employeeId`: must belong to same Company
- Employees cannot POST create

### Payroll validation

- Pay period: exactly seven days inclusive
- Duplicate `(companyId, employeeId, payPeriodStart)` → 409
- Employee must have `weeklySalary`
- Deductions capped at gross; negative net → 409 with details
- Mark-paid: reject if already `PAID`

### List/search validation

- Reuse `paginationQuerySchema` from P001
- Date range filters: `fromDate`, `toDate` with `toDate >= fromDate`
- Allowlisted `sortBy` per resource
- Optional `employeeId`, `status` filters on company endpoints

### Business validation (application layer)

- Employee context resolution from auth for self-service
- Tenant scope assertion on every read/write
- Payroll generation applies outstanding cash advances in FIFO order
- Mark-paid updates cash advance `deductedAmount` and `remainingAmount`

## 6. Authorization Matrix

| Action              | Attendance | Leave | Cash Adv | Payroll | OWNER | MANAGER | EMPLOYEE |
| ------------------- | ---------- | ----- | -------- | ------- | ----- | ------- | -------- |
| Time In/Out (self)  | ✅         | —     | —        | —       | ✅*   | ✅*     | ✅       |
| My history          | ✅         | ✅    | ✅       | ✅      | ✅*   | ✅*     | ✅       |
| Company list/manage | ✅         | ✅    | ✅       | ✅      | ✅    | ✅      | ❌       |
| Create cash advance | —          | —     | ✅       | —       | ✅    | ✅      | ❌       |
| Generate/mark paid  | —          | —     | —        | ✅      | ✅    | ✅      | ❌       |
| Dashboard           | —          | —     | —        | —       | ✅*   | ✅*     | ✅       |

\* When acting on own linked Employee profile.

Enforcement:

- `createAuthenticationMiddleware` → `companyResolutionMiddleware` → `authorize(roles)` per route
- Tenant isolation: repository always filters by `req.auth.companyId`
- Employee self-service requires `User.employeeId` linked; otherwise 403

## 7. Business Rules

1. Every workforce record belongs to exactly one Company.
2. Employee-scoped records belong to exactly one Employee in that Company.
3. At most one open attendance session per Employee.
4. Archived Employees cannot Time In.
5. Timed-in Employee is operationally active until Time Out.
6. Leave overlap on same date rejected for non-cancelled records.
7. Cash advance amount must be positive; deducted across payroll until settled.
8. Weekly payroll uses Employee `weeklySalary` as gross.
9. Net pay cannot be negative; generation fails with conflict details.
10. Paid payroll cannot be marked paid again.
11. Employees access only own records unless Manager/Owner on company endpoints.
12. Cross-company access forbidden on all operations.
13. Dashboard visibility flags reflect attendance readiness.
14. Trip and transaction summaries return empty arrays until future modules.

## 8. Error Scenarios

| Scenario                   | HTTP | Error Code              | When                                       |
| -------------------------- | ---- | ----------------------- | ------------------------------------------ |
| Validation failure         | 400  | VALIDATION_ERROR        | Zod or business validation fails           |
| Unauthenticated            | 401  | UNAUTHENTICATED         | Missing/invalid bearer token               |
| Forbidden role             | 403  | FORBIDDEN               | Employee attempts company-scoped action    |
| No linked employee profile | 403  | FORBIDDEN               | Self-service without User.employeeId       |
| Cross-company access       | 403  | COMPANY_SCOPE_VIOLATION | Resource companyId ≠ auth companyId        |
| Resource not found         | 404  | RESOURCE_NOT_FOUND      | ID not found in tenant scope               |
| Already timed in           | 409  | LIFECYCLE_CONFLICT      | Time In with open session                  |
| Not timed in               | 409  | LIFECYCLE_CONFLICT      | Time Out without open session              |
| Leave overlap              | 409  | LIFECYCLE_CONFLICT      | Duplicate leave on same date               |
| Duplicate pay period       | 409  | DUPLICATE_RESOURCE      | Payroll exists for employee/period         |
| Already paid               | 409  | LIFECYCLE_CONFLICT      | Mark-paid on PAID record                   |
| Negative net pay           | 409  | BUSINESS_RULE_VIOLATION | Deductions exceed gross salary             |
| Missing weekly salary      | 409  | BUSINESS_RULE_VIOLATION | Payroll generation for employee w/o salary |
| Archived employee Time In  | 409  | LIFECYCLE_CONFLICT      | Employee not active                        |

## 9. Swagger Design

### Tags

- `Attendance`
- `Leave`
- `Cash Advances`
- `Payroll`
- `Dashboard`

### Schemas (reusable)

- `AttendanceSession`, `AttendanceStatus`, `LeaveRecord`, `CashAdvance`, `PayrollRecord`
- `WorkforceDashboard`, visibility flags object
- Request bodies per endpoint (see contracts)
- `ApiSuccessEnvelope`, `ApiErrorEnvelope`, `PaginationMeta` (from P001 common schemas)

### Module OpenAPI files

- `src/modules/attendance/presentation/attendance.openapi.ts`
- `src/modules/leave/presentation/leave.openapi.ts`
- `src/modules/cash-advance/presentation/cash-advance.openapi.ts`
- `src/modules/payroll/presentation/payroll.openapi.ts`
- `src/modules/workforce-dashboard/presentation/dashboard.openapi.ts`

Assembled in `src/swagger/openapi.builder.ts` alongside P001/P002 paths.

## 10. Testing Strategy

### Unit tests (Vitest)

- Domain: attendance session open/close rules, leave overlap, payroll deduction math
- Use cases: Time In/Out conflicts, payroll generation, mark-paid balance updates
- `isOperationallyReady()` and dashboard visibility flag logic

### Integration tests

- Prisma repositories: CRUD, tenant scoping, unique pay period constraint
- Open session lookup per employee
- Cash advance balance updates on mark-paid

### API tests (Supertest)

- Attendance lifecycle and conflict scenarios
- Leave request, overlap rejection, manager approval
- Cash advance create and scoped lists
- Payroll generate, deduction math, mark-paid idempotency
- Dashboard visibility before/after Time In
- Cross-company access rejection
- Archived employee Time In rejection
- Role-based authorization matrix

### Test file layout

```text
tests/unit/attendance/
tests/unit/leave/
tests/unit/cash-advance/
tests/unit/payroll/
tests/unit/workforce-dashboard/
tests/integration/attendance/
tests/integration/leave/
tests/integration/cash-advance/
tests/integration/payroll/
tests/api/attendance/
tests/api/leave/
tests/api/cash-advance/
tests/api/payroll/
tests/api/workforce-dashboard/
tests/factories/attendance.factory.ts
tests/factories/leave.factory.ts
tests/factories/cash-advance.factory.ts
tests/factories/payroll.factory.ts
```

## 11. Acceptance Criteria

- [ ] All 18 workforce endpoints implemented and documented in OpenAPI
- [ ] AttendanceSession, LeaveRecord, CashAdvance, PayrollRecord Prisma models and migration applied
- [ ] Domain entities with operational readiness helpers
- [ ] Repository interfaces and Prisma implementations with tenant scoping
- [ ] Zod validation on all endpoints
- [ ] Authorization matrix enforced per route
- [ ] Attendance readiness gates dashboard visibility (100% test coverage)
- [ ] Payroll deduction math correct (100% test coverage)
- [ ] Cross-company access rejected (100% test coverage)
- [ ] `pnpm run build`, `pnpm test`, `pnpm run lint` pass
- [ ] Quickstart scenarios validated end-to-end

## 12. Future Extensibility

| Future Feature | How P003 Supports It                                                |
| -------------- | ------------------------------------------------------------------- |
| Transactions   | `isOperationallyReady()` exported; dashboard visibility flags ready |
| Expenses       | Same readiness gate; dashboard `canCreateExpense` flag              |
| Trips          | Dashboard `tripsSummary` placeholder; attendance for availability   |
| Analytics      | Query by companyId, pay period, attendance dates                    |
| Branch linkage | Optional `branchId` on AttendanceSession (additive migration)       |

No redesign required — only additive migrations and new modules referencing workforce records.

## Project Structure

### Documentation (this feature)

```text
specs/004-workforce-management/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/openapi.yaml
└── tasks.md              # Phase 2 (/speckit-tasks)
```

### Source Code (additions)

```text
src/modules/
├── attendance/
├── leave/
├── cash-advance/
├── payroll/
└── workforce-dashboard/
src/shared/workforce/
prisma/schema.prisma        # add workforce models and enums
tests/unit|integration|api/{attendance,leave,cash-advance,payroll,workforce-dashboard}/
```

## Complexity Tracking

No constitution violations. Five sibling modules are justified by distinct lifecycles (attendance
sessions vs payroll deduction vs leave approval) while sharing tenant and employee linkage patterns.

## Artifacts Generated

| Artifact                    | Path                                                    |
| --------------------------- | ------------------------------------------------------- |
| Implementation plan         | `specs/004-workforce-management/plan.md`                |
| Research decisions          | `specs/004-workforce-management/research.md`            |
| Data model                  | `specs/004-workforce-management/data-model.md`          |
| OpenAPI contracts           | `specs/004-workforce-management/contracts/openapi.yaml` |
| Quickstart validation guide | `specs/004-workforce-management/quickstart.md`          |
