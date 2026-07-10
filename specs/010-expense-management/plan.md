# Implementation Plan: P007 - Expense Management

**Branch**: `010-expense-management` | **Date**: 2026-07-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/010-expense-management/spec.md`

**Note**: This plan is the definitive technical design for Expense Management — not implementation
code. It follows architecture, conventions, and engineering decisions from P001–P006 without
redefining them.

## Summary

Introduce a new `expense` module with `Expense` as aggregate root and `ExpenseAttachment` as child
entity. Expenses receive immutable `EXP-YYYYMMDD-000001` numbers via `ExpenseNumberSequence`.
Lifecycle use cases (create, update, record, cancel, archive, list/search, attachment CRUD) enforce
single mutually exclusive context (`COMPANY`, `BRANCH`, `WAREHOUSE`, `VEHICLE`, `TRIP`), timed-in
gate for Employee creators, and trip eligibility via `TripEligibilityService`. The `reports` and
`analytics` modules gain real Prisma queries replacing expense stubs. All endpoints use established
P001 patterns: JWT auth, Zod, DTOs, standard envelope, OpenAPI, Vitest/Supertest.

## Technical Context

**Language/Version**: TypeScript (strict mode) on Node.js LTS

**Primary Dependencies**: Express.js, Prisma ORM, PostgreSQL, Zod, JWT (P001), Pino, Swagger/OpenAPI,
Vitest, Supertest, Multer (photo upload — same as P004)

**Storage**: PostgreSQL; new `Expense`, `ExpenseAttachment`, `ExpenseNumberSequence` tables; optional
FK relations to Branch, Warehouse, Vehicle, Trip

**Testing**: Vitest (unit/integration), Supertest (API/workflow/authorization)

**Target Platform**: Linux server (Docker); local dev via docker-compose

**Project Type**: modular REST API — new `expense` module + targeted `reports` and `analytics`
extensions

**Performance Goals**: Expense Number allocation without duplicates under concurrent create; company
expense list with default `expenseDate desc` under 2s for typical volumes; indexed context filters
for reports/analytics

**Constraints**: Company tenant boundary; single context per expense; Employee timed-in for create;
trip reference Started/Completed only; Cancelled immutable; archive Recorded/Cancelled only;
Employees view/edit own drafts only

**Scale/Scope**: 1 new module (~12 use cases), 11 HTTP route groups, 3 attachment sub-routes, 3 status
actions; reports + analytics query extensions; ~3 Prisma models; seed data for sample expenses

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate                             | Pre-Design | Post-Design | Notes                                                    |
| -------------------------------- | ---------- | ----------- | -------------------------------------------------------- |
| Layer boundaries                 | ✅         | ✅          | New `expense` module; trip/org read via repository ports |
| No business logic in controllers | ✅         | ✅          | `expense.controller` delegates to use cases              |
| Repository pattern               | ✅         | ✅          | `ExpenseRepository`, `ExpenseNumberSequenceRepository`   |
| Dependency injection             | ✅         | ✅          | Wired in `src/config/container.ts`                       |
| Zod validation                   | ✅         | ✅          | `expense.schemas.ts` for all bodies/queries              |
| DTOs                             | ✅         | ✅          | Request/response DTOs; no entity leak                    |
| Standard response envelope       | ✅         | ✅          | Reuses P001 helpers                                      |
| Pagination conventions           | ✅         | ✅          | `page`, `limit`, `sortBy`, `sortOrder` on list           |
| Security                         | ✅         | ✅          | Role middleware + expense authorization policy           |
| No `any`                         | ✅         | ✅          | Strict TypeScript                                        |
| Error handling                   | ✅         | ✅          | Lifecycle/business rule errors for transitions           |
| Logging                          | ✅         | ✅          | `expense-audit.service` for lifecycle events             |
| Tests                            | ✅         | ✅          | Unit, integration, API, workflow, authorization          |
| OpenAPI                          | ✅         | ✅          | `expense.openapi.ts` + `common-schemas.ts`               |
| Simplicity                       | ✅         | ✅          | Sequence table justified (P005/P006 pattern)             |

## Project Structure

### Documentation (this feature)

```text
specs/010-expense-management/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/openapi.yaml
└── tasks.md              # Phase 2 — /speckit-tasks
```

### Source code (new + extensions)

```text
src/modules/expense/
├── domain/
│   ├── expense.entity.ts
│   ├── expense-attachment.entity.ts
│   ├── expense-status.ts
│   ├── expense-context-type.ts
│   ├── expense-attachment-type.ts
│   ├── expense-rules.ts
│   ├── expense-lifecycle.ts
│   ├── expense-number.ts
│   ├── expense.repository.ts
│   ├── expense-attachment.repository.ts
│   └── expense-number-sequence.repository.ts
├── application/
│   ├── dto/
│   │   ├── create-expense.request.ts
│   │   ├── update-expense.request.ts
│   │   ├── expense.response.ts
│   │   └── expense-attachment.response.ts
│   ├── use-cases/
│   │   ├── create-expense.use-case.ts
│   │   ├── update-expense.use-case.ts
│   │   ├── get-expense.use-case.ts
│   │   ├── get-expense-by-number.use-case.ts
│   │   ├── list-expenses.use-case.ts
│   │   ├── list-my-expenses.use-case.ts
│   │   ├── record-expense.use-case.ts
│   │   ├── cancel-expense.use-case.ts
│   │   ├── archive-expense.use-case.ts
│   │   ├── add-expense-attachment.use-case.ts
│   │   ├── list-expense-attachments.use-case.ts
│   │   ├── remove-expense-attachment.use-case.ts
│   │   └── get-expense-attachment-content.use-case.ts
│   ├── policies/
│   │   └── expense-authorization.policy.ts
│   └── services/
│       ├── expense-number.service.ts
│       ├── expense-audit.service.ts
│       └── expense-context-validation.service.ts
├── infrastructure/
│   ├── expense.prisma-repository.ts
│   ├── expense-attachment.prisma-repository.ts
│   ├── expense-number-sequence.prisma-repository.ts
│   └── mappers/
│       ├── expense.mapper.ts
│       └── expense-attachment.mapper.ts
├── presentation/
│   ├── expense.controller.ts
│   ├── expense.routes.ts
│   ├── expense.schemas.ts
│   ├── expense.openapi.ts
│   └── upload.middleware.ts
└── index.ts

src/modules/reports/                           # EXTENSIONS
└── infrastructure/reports.prisma-query-repository.ts  # MOD — real expense queries

src/modules/analytics/                         # EXTENSIONS
└── infrastructure/analytics.prisma-query-repository.ts # MOD — real expense metrics

src/shared/expenses/
└── expense-number-format.ts                   # NEW — formatter/parser

src/validations/common-query.schemas.ts        # MOD — expenseListQuerySchema

src/config/container.ts                        # MOD — wire expense module

prisma/schema.prisma                           # MOD — Expense models
prisma/seed.ts                                 # MOD — sample expenses

tests/
├── unit/expense/
├── integration/expense/
└── api/expense/
```

**Structure Decision**: New bounded-context module per research; cross-module reads only (trip, branch,
warehouse, vehicle, attendance); reports/analytics read expense tables without write paths.

## Complexity Tracking

No constitution violations requiring justification.

---

## 1. Module Architecture

### Responsibilities

| Component                             | Responsibility                                                          |
| ------------------------------------- | ----------------------------------------------------------------------- |
| `expense` module                      | Expense aggregate lifecycle, numbering, context, attachments, discovery |
| `Expense` aggregate root              | Status transitions, header invariants, attachment collection authority  |
| `ExpenseAttachment` child             | Receipt photos; mutable per parent editability rules                    |
| `ExpenseNumberService`                | Format and allocate numbers via sequence repository                     |
| `ExpenseContextValidationService`     | Validate contextType + FK shape; resolve org/trip entities              |
| `expense-authorization.policy`        | Role + ownership matrix                                                 |
| `expense-rules` / `expense-lifecycle` | Transition validation, amount/context invariants                        |
| `reports` (extended)                  | Line-level expense report queries                                       |
| `analytics` (extended)                | Expense KPI aggregations                                                |
| `trip` (read-only)                    | `TripEligibilityService.assertTripAcceptsExpense`                       |
| `attendance` (read-only)              | Timed-in gate for Employee create                                       |

### Aggregate boundaries

```text
┌──────────────────────────────────────────────────┐
│              Expense Aggregate                     │
│  ┌──────────┐      ┌─────────────────────────┐   │
│  │ Expense  │ 1──* │   ExpenseAttachment     │   │
│  │  (root)  │      │ (child, same boundary)  │   │
│  └────┬─────┘      └─────────────────────────┘   │
└───────┼────────────────────────────────────────────┘
        │ references (no ownership)
        ▼
   Branch, Warehouse, Vehicle, Trip, Company (implicit)
```

- **Inside aggregate**: Expense header, expense number, status, context fields, lifecycle timestamps,
  audit actor IDs, attachments.
- **Outside aggregate**: Branch/Warehouse/Vehicle/Trip entities (referenced by FK); User/Employee
  (creator references); Analytics/Reports (read projections).

### Internal module organization

Standard Clean Architecture layers per P001:

```text
presentation → application (use cases) → domain ← infrastructure
```

Controllers parse/validate HTTP, call one use case, map DTO response. Use cases orchestrate
repositories, domain rules, and cross-module read ports. Domain has zero framework imports.

### Dependencies

| Dependency   | Direction | Usage                                           |
| ------------ | --------- | ----------------------------------------------- |
| `company`    | Read      | Tenant scope (implicit via auth)                |
| `branch`     | Read      | Context validation when `contextType=BRANCH`    |
| `warehouse`  | Read      | Context validation when `contextType=WAREHOUSE` |
| `vehicle`    | Read      | Context validation when `contextType=VEHICLE`   |
| `trip`       | Read      | Context validation + `TripEligibilityService`   |
| `employee`   | Read      | Creator employee id; enrichment on responses    |
| `user`       | Read      | Audit actor resolution                          |
| `attendance` | Read      | Open session check for Employee create          |

Expense module MUST NOT import reports/analytics use cases. Reports/analytics inject Prisma read
queries only.

### Shared services

| Service                                      | Location               | Purpose                              |
| -------------------------------------------- | ---------------------- | ------------------------------------ |
| `expense-number-format.ts`                   | `src/shared/expenses/` | Parse/validate `EXP-YYYYMMDD-NNNNNN` |
| `expense-context-validation.service.ts`      | expense application    | Context FK rules + entity existence  |
| `expense-audit.service.ts`                   | expense application    | Structured Pino audit events         |
| `FileStorage` (wired from transaction infra) | DI container           | Receipt photo persistence            |

### Integration with Trips

- Expense `tripId` FK → `Trip.id` (reference only; `onDelete: SetNull` or restrict per migration policy).
- `ExpenseContextValidationService` calls `TripRepository.findById` + `TripEligibilityService.assertTripAcceptsExpense`.
- Reject `DRAFT` and `CANCELLED` trips; accept `STARTED` and `COMPLETED`.
- Trip module unchanged; expense module consumes existing eligibility helper.

### Integration with Organization

- Branch/Warehouse/Vehicle repositories (or lightweight existence checkers) validate same-Company,
  non-archived entities at create/update.
- `COMPANY` context requires no FK; tenant `companyId` is implicit.

### Integration with Analytics (P008)

- Replace stub methods in `AnalyticsPrismaQueryRepository` for `getExpenseMetrics` / expense dashboard.
- Sum `amount` where `status = RECORDED` and `deletedAt IS NULL` within filter date range on `expenseDate`.
- Dimensional breakdowns group by `category`, `branchId`, `warehouseId`, `vehicleId`, `tripId`.
- Monthly trend buckets on `expenseDate`.

### Integration with Reports (P009)

- Replace `listExpenseReports`, `countExpenseReports`, `batchExpenseReports` stubs when `prisma.expense` exists.
- Map rows to `ExpenseReportRowProjection`: expenseId, category, amount, referenceType (contextType),
  reference (resolved label), addedBy (user email), date (`expenseDate`).
- Default filter: `status = RECORDED` unless report filter includes other statuses.

### Why Expense is an Aggregate Root

1. **Lifecycle authority** — `status` drives editability for employees and managers.
2. **Invariant locality** — single context, positive amount, attachment orphan rules are expense-level.
3. **Transactional consistency** — record/cancel must atomically update status and audit columns.
4. **Independent existence** — expenses may exist without trips or transactions.
5. **Reference, not ownership** — org entities and trips are not deleted when expense archives.

---

## 2. Entity Design

See [data-model.md](./data-model.md) for full field tables and Prisma sketch.

### Expense

| Concern        | Design                                                                 |
| -------------- | ---------------------------------------------------------------------- |
| Identity       | UUID PK; `expenseNumber` business key                                  |
| Money          | `Decimal(18,2)`; domain asserts `amount > 0`                           |
| Context        | `contextType` enum + conditional nullable FKs                          |
| Lifecycle      | `DRAFT` → `RECORDED` \| `CANCELLED`; no reopen                         |
| Audit          | `createdByUserId`, `recordedByUserId`, `cancelledByUserId`, timestamps |
| Creator filter | `createdByEmployeeId` denormalized at create                           |
| Soft delete    | `deletedAt` on archive                                                 |

### ExpenseAttachment

| Concern   | Design                                                        |
| --------- | ------------------------------------------------------------- |
| Type      | `PHOTO` MVP; enum extensible                                  |
| Storage   | `filePath` via `FileStorage` port                             |
| Lifecycle | Tied to parent expense editability                            |
| Cascade   | Hard delete cascades from expense (soft archive retains rows) |

### ExpenseNumberSequence

Mirror `TripNumberSequence`: `(companyId, sequenceDate)` → increment `lastValue` in transaction.

---

## 3. Relationship Design

```text
Company
  │
  └──* Expense
         │
         ├──* ExpenseAttachment
         │
         ├──? Branch      (contextType=BRANCH)
         ├──? Warehouse   (contextType=WAREHOUSE)
         ├──? Vehicle     (contextType=VEHICLE)
         └──? Trip        (contextType=TRIP)
```

**Ownership**: Expense aggregate owns attachments. Expense references but does not own Branch,
Warehouse, Vehicle, or Trip. Deleting/archiving an expense does not mutate referenced entities.

---

## 4. State Machine Design

### States

| State     | Editable by Employee (own) | Editable by M/O | Attachments      |
| --------- | -------------------------- | --------------- | ---------------- |
| DRAFT     | Yes                        | Yes             | Add/remove       |
| RECORDED  | No                         | Yes             | Add/remove (M/O) |
| CANCELLED | No                         | No              | None             |

### Transitions

```text
DRAFT ──record──► RECORDED ──cancel──► CANCELLED
  │
  └──cancel──► CANCELLED
```

### Invalid transitions

- RECORDED → DRAFT (no reopen in MVP)
- CANCELLED → any
- Any mutation on archived expense (`deletedAt` set)

### Locking behavior

- Optimistic concurrency via `updatedAt` check on PATCH (same pattern as transaction update).
- Status transitions use row-level update with status precondition in WHERE clause.

---

## 5. Expense Number Strategy

| Aspect       | Design                                                                               |
| ------------ | ------------------------------------------------------------------------------------ |
| Format       | `EXP-{YYYYMMDD}-{000001}`                                                            |
| Generation   | Synchronous in `CreateExpenseUseCase` within DB transaction                          |
| Uniqueness   | `(companyId, expenseNumber)` unique index                                            |
| Sequence key | `(companyId, sequenceDate)` on UTC creation date                                     |
| Search       | Exact via `/by-number/{expenseNumber}`; partial via list `expenseNumber` query param |
| After cancel | Number unchanged; expense remains searchable                                         |
| Immutability | `expenseNumber` never updated                                                        |

**Example**: `EXP-20260709-000001`, `EXP-20260709-000002`, next day `EXP-20260710-000001`.

---

## 6. Business Workflow

### Employee workflow

1. Time in (P003 attendance).
2. `POST /expenses` → Draft + Expense Number.
3. Optional: upload receipt photos.
4. `PATCH /expenses/{id}` while Draft.
5. `POST /expenses/{id}/record` → Recorded (read-only for employee).
6. `GET /expenses/mine` and `GET /expenses/{id}` for own expenses.
7. May `POST /expenses/{id}/cancel` on own Draft with reason.

### Manager workflow

1. `GET /expenses` with filters/sort (frontend default: `sortBy=expenseDate&sortOrder=desc`).
2. Review Draft and Recorded expenses.
3. Create on behalf of company (`recordImmediately` optional).
4. Edit any Draft; edit Recorded headers/context/attachments.
5. `POST /record` on employee drafts if needed.
6. `POST /cancel` on Draft or Recorded with reason.
7. `POST /archive` on Recorded or Cancelled.

### Owner workflow

Same as Manager with unrestricted Company access (no additional rules in MVP).

---

## 7. API Design

Full contract: [contracts/openapi.yaml](./contracts/openapi.yaml)

### Expenses

| Endpoint                                     | Method | Purpose                                  | Roles    |
| -------------------------------------------- | ------ | ---------------------------------------- | -------- |
| `/api/v1/expenses`                           | POST   | Create Draft (or Recorded if M/O + flag) | E*, M, O |
| `/api/v1/expenses`                           | GET    | Company list + search/filter             | M, O     |
| `/api/v1/expenses/mine`                      | GET    | Employee own list                        | E        |
| `/api/v1/expenses/by-number/{expenseNumber}` | GET    | Lookup by number                         | E†, M, O |
| `/api/v1/expenses/{expenseId}`               | GET    | Detail + attachments                     | E†, M, O |
| `/api/v1/expenses/{expenseId}`               | PATCH  | Update header/context                    | E‡, M, O |
| `/api/v1/expenses/{expenseId}/archive`       | POST   | Soft archive                             | M, O     |

\* Employee requires timed in. † Employee own expense only. ‡ Employee own Draft only.

**List query parameters**: `page`, `limit`, `sortBy` (`expenseDate`, `createdAt`, `expenseNumber`,
`amount`), `sortOrder`, `status`, `category`, `contextType`, `branchId`, `warehouseId`, `vehicleId`,
`tripId`, `employeeId`, `fromDate`, `toDate`, `expenseNumber`, `search` (min 2 chars on
category/description/number), `includeArchived`.

**List response**: `{ success, data: ExpenseSummary[], meta: { page, limit, total, totalPages } }`.

### Expense attachments

| Endpoint                                                          | Method | Purpose                           |
| ----------------------------------------------------------------- | ------ | --------------------------------- |
| `/api/v1/expenses/{expenseId}/attachments`                        | POST   | Upload receipt (multipart `file`) |
| `/api/v1/expenses/{expenseId}/attachments`                        | GET    | List metadata                     |
| `/api/v1/expenses/{expenseId}/attachments/{attachmentId}`         | DELETE | Remove                            |
| `/api/v1/expenses/{expenseId}/attachments/{attachmentId}/content` | GET    | Download binary                   |

### Expense status

| Endpoint                              | Method | Purpose                    | Roles    |
| ------------------------------------- | ------ | -------------------------- | -------- |
| `/api/v1/expenses/{expenseId}/record` | POST   | Draft → Recorded           | E‡, M, O |
| `/api/v1/expenses/{expenseId}/cancel` | POST   | Draft/Recorded → Cancelled | E§, M, O |

§ Employee may cancel own Draft only.

### Error responses (representative)

| HTTP | Code                      | When                                               |
| ---- | ------------------------- | -------------------------------------------------- |
| 400  | `VALIDATION_ERROR`        | Zod/context shape failures                         |
| 401  | `UNAUTHENTICATED`         | Missing/invalid token                              |
| 403  | `FORBIDDEN`               | Role/ownership violation                           |
| 404  | `RESOURCE_NOT_FOUND`      | Unknown id or cross-tenant                         |
| 409  | `LIFECYCLE_CONFLICT`      | Invalid status transition / edit on locked expense |
| 409  | `BUSINESS_RULE_VIOLATION` | Not timed in, invalid trip, archived reference     |
| 409  | `DUPLICATE_RESOURCE`      | Sequence collision (rare; retry)                   |

---

## 8. Validation Design

Zod schemas in `expense.schemas.ts`; shared list query in `common-query.schemas.ts`.

### Expense validation

- `expenseDate`: `z.coerce.date()`
- `category`: `z.string().trim().min(1).max(200)`
- `amount`: positive decimal schema (reuse `positiveAmountSchema` from workforce)
- `description`: `z.string().trim().min(1).max(2000)`
- `recordImmediately`: `z.boolean().optional()` — only honored for M/O in use case

### Context validation

- `contextType`: native enum schema
- Discriminated union or `.superRefine`:
  - `COMPANY` → all FK fields absent/null
  - `BRANCH` → `branchId` uuid required; others null
  - `WAREHOUSE` → `warehouseId` required
  - `VEHICLE` → `vehicleId` required
  - `TRIP` → `tripId` required
- Business layer re-validates entity existence and trip status.

### Attachment validation

- Multer: max file size (match transaction photos, e.g. 5MB)
- Allowed mime types: `image/jpeg`, `image/png`, `image/webp`
- `attachmentType` defaults to `PHOTO` server-side in MVP

### Status transition validation

- `recordExpenseSchema`: optional `note`
- `cancelExpenseSchema`: `reason` required, max 500
- `archiveExpenseSchema`: optional `reason`

### Shared validators

- Reuse `paginationQuerySchema`, `sortOrderSchema`
- Reuse `positiveAmountSchema`
- Reuse attendance operational readiness helpers from transaction module

---

## 9. Authorization Matrix

| Action             | Owner | Manager | Employee                  |
| ------------------ | ----- | ------- | ------------------------- |
| Create expense     | ✅    | ✅      | ✅ (timed in)             |
| View company list  | ✅    | ✅      | ❌                        |
| View own (`/mine`) | ✅*   | ✅*     | ✅                        |
| View detail        | ✅    | ✅      | ✅ own only               |
| Edit Draft         | ✅    | ✅      | ✅ own only               |
| Edit Recorded      | ✅    | ✅      | ❌                        |
| Record expense     | ✅    | ✅      | ✅ own Draft only         |
| Cancel Draft       | ✅    | ✅      | ✅ own only               |
| Cancel Recorded    | ✅    | ✅      | ❌                        |
| Manage attachments | ✅    | ✅      | ✅ own Draft; ❌ Recorded |
| Archive            | ✅    | ✅      | ❌                        |

\*If linked employee profile exists.

Implementation: `authorize(['OWNER', 'MANAGER'])` on company list/archive; `authorize(['OWNER',
'MANAGER', 'EMPLOYEE'])` on create/read with `expense-authorization.policy.ts` in use cases.

---

## 10. Business Rules

Encoded in `expense-rules.ts` and enforced in use cases:

1. Every expense belongs to exactly one Company.
2. Expense Number is immutable.
3. Only one context per expense; types mutually exclusive.
4. Only timed-in Employees may create expenses.
5. Managers/Owners may create without timed-in.
6. Completed and Started trips accept expenses; Draft and Cancelled trips reject.
7. Attachments cannot exist without expense parent.
8. Only Draft expenses editable by Employees (own).
9. Recorded expenses read-only for Employees.
10. Managers/Owners may edit Recorded expenses (not Cancelled/archived).
11. Cancelled expenses immutable.
12. Archive only Recorded or Cancelled.
13. Amount must be greater than zero.
14. Referenced org/trip entities must exist in Company and not be archived.

---

## 11. Error Scenarios

| Scenario                           | HTTP | Code                      |
| ---------------------------------- | ---- | ------------------------- |
| Invalid context shape              | 400  | `VALIDATION_ERROR`        |
| Multiple context FKs set           | 400  | `VALIDATION_ERROR`        |
| Invalid/zero amount                | 400  | `VALIDATION_ERROR`        |
| Missing required reference         | 400  | `VALIDATION_ERROR`        |
| Trip not found                     | 404  | `RESOURCE_NOT_FOUND`      |
| Trip cancelled/draft               | 409  | `BUSINESS_RULE_VIOLATION` |
| Branch/warehouse/vehicle not found | 404  | `RESOURCE_NOT_FOUND`      |
| Not timed in (Employee)            | 409  | `BUSINESS_RULE_VIOLATION` |
| Unauthorized access                | 403  | `FORBIDDEN`               |
| Cross-company access               | 404  | `RESOURCE_NOT_FOUND`      |
| Edit Recorded as Employee          | 409  | `LIFECYCLE_CONFLICT`      |
| Edit Cancelled                     | 409  | `LIFECYCLE_CONFLICT`      |
| Duplicate expense number           | 409  | `DUPLICATE_RESOURCE`      |
| Archive Draft                      | 409  | `LIFECYCLE_CONFLICT`      |

---

## 12. Swagger Design

### Tags

- `Expenses` — CRUD, list, archive, lookup
- `Expense Attachments` — upload, list, remove, content
- `Expense Status` — record, cancel

### Schemas (`common-schemas.ts`)

- `ExpenseStatus`, `ExpenseContextType`, `ExpenseAttachmentType`, `ExpenseNumber`
- `ExpenseSummary`, `ExpenseDetail`, `ExpenseAttachment`
- `CreateExpenseRequest`, `UpdateExpenseRequest`, `RecordExpenseRequest`, `CancelExpenseRequest`

### Reusable bodies

Mirror Zod schemas in OpenAPI components (same pattern as P006 trips).

### Examples

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "expenseNumber": "EXP-20260709-000001",
    "status": "DRAFT",
    "contextType": "TRIP",
    "tripId": "uuid",
    "amount": 1500.0,
    "category": "Fuel",
    "expenseDate": "2026-07-09T08:00:00.000Z"
  },
  "meta": {},
  "error": null
}
```

Register paths in `openapi.builder.ts` from `expense.openapi.ts`.

---

## 13. Testing Strategy

### Unit tests (`tests/unit/expense/`)

- `expense-rules.test.ts` — context mutual exclusion, amount, lifecycle transitions
- `expense-lifecycle.test.ts` — allowed/forbidden transitions
- `expense-number-format.test.ts` — format parse/validate
- `expense-authorization.test.ts` — policy matrix
- `expense-context-validation.test.ts` — trip/org eligibility (mocked repos)

### Integration tests (`tests/integration/expense/`)

- `expense.persistence.test.ts` — repository CRUD, sequence allocation, soft archive
- `expense-number-sequence.test.ts` — concurrent create uniqueness

### API tests (`tests/api/expense/`)

- `expense-create.api.test.ts` — create, timed-in gate, number assignment
- `expense-list.api.test.ts` — pagination, sort `expenseDate desc`, filters
- `expense-record-cancel.api.test.ts` — lifecycle workflow
- `expense-authorization.api.test.ts` — role matrix
- `expense-context.api.test.ts` — trip/branch validation errors
- `expense-attachments.api.test.ts` — upload/list/remove
- `expense-by-number.api.test.ts` — lookup

### Cross-module tests

- `reports/expense-report.api.test.ts` — update to expect seeded rows
- `analytics/expense-analytics.api.test.ts` — non-zero totals after seed

### Concurrency tests

- Parallel `POST /expenses` → unique Expense Numbers per company/day

---

## 14. Acceptance Criteria (Engineering)

- `GET /api/v1/expenses?page=1&limit=10&sortBy=expenseDate&sortOrder=desc` returns 200 for Manager
  with paginated `ExpenseSummary` rows (unblocks frontend).
- Employee create rejected when not timed in; succeeds when timed in.
- Expense Number unique per company; format `EXP-YYYYMMDD-000001`.
- Context mutual exclusion enforced at validation and persistence layers.
- Trip expenses accepted for Started/Completed; rejected for Draft/Cancelled.
- Record transition sets `recordedAt` and `recordedByUserId`; employee cannot PATCH afterward.
- Manager can PATCH Recorded expense.
- Cancelled expense rejects all mutations except GET.
- Archive sets `deletedAt`; excluded from default list.
- Reports and analytics return non-empty/zero respectively when Recorded expenses exist.
- OpenAPI documents all expense endpoints; CI build passes.
- All new tests pass; no regression in existing suites.

---

## 15. Future Extensibility

| Future feature            | Extension approach                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------ |
| Approval workflow         | Add `approvalStatus` + transition endpoints; Draft → Submitted → Approved → Recorded |
| Recurring expenses        | `recurrenceRuleId` FK; scheduler creates Draft expenses                              |
| Budget management         | `budgetId` FK; read-side checks in application service                               |
| Vendor directory          | `vendorId` FK optional on Expense                                                    |
| Accounting integration    | `externalAccountingId`; export job reads Expense + attachments                       |
| Master expense categories | `categoryId` FK; migrate free-text `category` gradually                              |

Core aggregate (Expense Number, status enum, single context model, attachment child collection)
remains stable. Analytics and Reports projections extend with new dimensions without breaking
existing API consumers.

---

## Phase 0 & Phase 1 Artifacts

| Artifact         | Path                                               | Status   |
| ---------------- | -------------------------------------------------- | -------- |
| Research         | [research.md](./research.md)                       | Complete |
| Data model       | [data-model.md](./data-model.md)                   | Complete |
| OpenAPI contract | [contracts/openapi.yaml](./contracts/openapi.yaml) | Complete |
| Quickstart       | [quickstart.md](./quickstart.md)                   | Complete |

**Next command**: `/speckit-tasks` to generate dependency-ordered `tasks.md`.
