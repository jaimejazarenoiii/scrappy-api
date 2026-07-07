# Implementation Plan: P004 - Transaction Management (Foundation)

**Branch**: `005-transaction-management` | **Date**: 2026-07-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-transaction-management/spec.md`

**Note**: This plan extends P001 (Company & Identity Foundation), P002 (Organization Management), and
P003 (Workforce Management) with the core operational Transaction aggregate. It is the definitive
technical design for implementation — not implementation code.

## Summary

Implement Transaction Management as a single bounded-context module (`transaction`) under
`/api/v1/transactions`. The `Transaction` aggregate root owns Items, Attachments, and Employee
assignments. The module follows modular Clean Architecture with company tenant isolation,
role-and-assignment authorization, Zod validation, standard API envelopes, OpenAPI documentation,
local file storage for photo attachments, and Vitest/Supertest coverage. Transaction creation is
gated by P003 `isOperationallyReady()` (timed-in Employees only). Statuses are `DRAFT` and
`CANCELLED` only; payment and settlement are deferred to P005.

## Technical Context

**Language/Version**: TypeScript (strict mode) on Node.js LTS

**Primary Dependencies**: Express.js, Prisma ORM, PostgreSQL, Zod, JWT (from P001), Pino,
Swagger/OpenAPI, Vitest, Supertest, multer (multipart photo uploads)

**Storage**: PostgreSQL with Prisma repositories in infrastructure layer only; local filesystem for
attachment binaries via `FileStorage` interface

**Testing**: Vitest (unit/integration), Supertest (API/authorization/tenant isolation)

**Target Platform**: Linux server (Docker); local dev via docker-compose

**Project Type**: modular REST API backend extending P001/P002/P003

**Performance Goals**: Transaction create with items under 60 seconds for 95% of scenarios; list
endpoints paginated default 20 items; suggestion queries return within 1 second for typical Company
history; tenant filter on every query

**Constraints**: Company is hard tenant boundary; Employees edit only assigned Draft transactions;
Managers/Owners edit any Company Draft; auto-save is client-driven PATCH; max 20 photos × 5 MB each;
only timed-in Employees create transactions

**Scale/Scope**: 1 module, 16 protected endpoints, 4 Prisma models + join table, shared file storage
abstraction

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate                             | Pre-Design | Post-Design | Notes                                                                      |
| -------------------------------- | ---------- | ----------- | -------------------------------------------------------------------------- |
| Layer boundaries                 | ✅         | ✅          | Single module follows domain → application → infrastructure → presentation |
| No business logic in controllers | ✅         | ✅          | Controllers delegate to use cases only                                     |
| Repository pattern               | ✅         | ✅          | Transaction repositories behind interfaces                                 |
| Dependency injection             | ✅         | ✅          | Wired in `src/config/container.ts`                                         |
| Zod validation                   | ✅         | ✅          | Schemas for mutations, list queries, multipart metadata                    |
| DTOs                             | ✅         | ✅          | Request/response DTOs; aggregate detail composition                        |
| Standard response envelope       | ✅         | ✅          | Reuses P001 `success()` / `failure()` helpers                              |
| Pagination conventions           | ✅         | ✅          | `page`, `limit`, `sortBy`, `sortOrder`, date/search filters                |
| Security                         | ✅         | ✅          | JWT bearer auth, tenant middleware, role + assignment authorization        |
| No `any`                         | ✅         | ✅          | Strict TypeScript throughout                                               |
| Error handling                   | ✅         | ✅          | Reuses global error middleware and error codes                             |
| Logging                          | ✅         | ✅          | Audit events for transaction lifecycle and mutations                       |
| Tests                            | ✅         | ✅          | Unit, integration, API, auth, validation, tenant isolation                 |
| OpenAPI                          | ✅         | ✅          | Tags: Transactions, Transaction Items, Attachments, Suggestions            |
| Simplicity                       | ✅         | ✅          | Single aggregate module; multer justified for binary uploads               |

## 1. Module Architecture

### Module responsibilities

| Component                        | Responsibility                                                      |
| -------------------------------- | ------------------------------------------------------------------- |
| `transaction` (aggregate module) | Transaction lifecycle, items, attachments, assignments, suggestions |
| `Transaction` (aggregate root)   | Header invariants, status, location rules, editability              |
| `TransactionItem` (child entity) | Material lines, total computation                                   |
| `TransactionAttachment` (child)  | Photo metadata and file references                                  |
| `TransactionEmployeeAssignment`  | Many-to-many employee linkage and scoped access                     |
| Suggestion queries (read model)  | Material name and price history per Company                         |

### Why Transaction is the Aggregate Root

`Transaction` is the aggregate root because:

1. **Lifecycle authority** — Only the root carries `status` (`DRAFT` | `CANCELLED`); child entities
   inherit editability from root state.
2. **Invariant enforcement** — Rules such as "only Draft may be edited", "at least one item for
   completeness", and location conditional fields are transaction-level concerns.
3. **Consistency boundary** — Items and Attachments cannot exist without a Transaction; assignments
   are meaningless without the parent context.
4. **Authorization scope** — Employee assignment checks reference the root; cross-company isolation
   keys off `Transaction.companyId`.
5. **Future extensibility** — P005 payment status transitions and P006 Trip linkage attach to the
   root without restructuring children.

Child entities are accessed only through Transaction-scoped use cases, never via independent
top-level creation endpoints that skip root validation.

### Internal module organization

```text
src/modules/transaction/
├── domain/
│   ├── transaction.entity.ts
│   ├── transaction-item.entity.ts
│   ├── transaction-attachment.entity.ts
│   ├── transaction-direction.ts
│   ├── transaction-status.ts
│   ├── transaction-location-type.ts
│   ├── transaction-item-unit.ts
│   ├── transaction-attachment-type.ts
│   ├── transaction-rules.ts          # draft-only, location, total, readiness
│   ├── transaction.repository.ts
│   ├── transaction-item.repository.ts
│   └── transaction-attachment.repository.ts
├── application/
│   ├── dto/
│   ├── use-cases/
│   │   ├── create-transaction.use-case.ts
│   │   ├── update-transaction.use-case.ts
│   │   ├── get-transaction.use-case.ts
│   │   ├── list-transactions.use-case.ts
│   │   ├── list-assigned-transactions.use-case.ts
│   │   ├── cancel-transaction.use-case.ts
│   │   ├── archive-transaction.use-case.ts
│   │   ├── add-transaction-item.use-case.ts
│   │   ├── update-transaction-item.use-case.ts
│   │   ├── remove-transaction-item.use-case.ts
│   │   ├── list-transaction-items.use-case.ts
│   │   ├── add-transaction-attachment.use-case.ts
│   │   ├── remove-transaction-attachment.use-case.ts
│   │   ├── list-transaction-attachments.use-case.ts
│   │   ├── get-material-suggestions.use-case.ts
│   │   └── get-price-suggestions.use-case.ts
│   ├── policies/
│   │   └── transaction-authorization.policy.ts
│   └── services/
│       ├── transaction-audit.service.ts
│       └── transaction-total.service.ts
├── infrastructure/
│   ├── transaction.prisma-repository.ts
│   ├── transaction-item.prisma-repository.ts
│   ├── transaction-attachment.prisma-repository.ts
│   ├── transaction-suggestion.prisma-repository.ts
│   ├── file-storage/
│   │   ├── file-storage.interface.ts
│   │   └── local-file-storage.ts
│   └── mappers/
│       ├── transaction.mapper.ts
│       ├── transaction-item.mapper.ts
│       └── transaction-attachment.mapper.ts
└── presentation/
    ├── transaction.controller.ts
    ├── transaction.routes.ts
    ├── transaction.schemas.ts
    ├── transaction.openapi.ts
    └── upload.middleware.ts          # multer config
```

### Dependencies on P001/P002/P003

| Dependency                                  | Usage                                          |
| ------------------------------------------- | ---------------------------------------------- |
| `company` module                            | Tenant boundary validation                     |
| `employee` module                           | Assignment validation, employee-scoped lists   |
| `branch` module                             | BRANCH location FK validation                  |
| `warehouse` module                          | WAREHOUSE location FK validation               |
| `auth` module                               | JWT authentication middleware                  |
| `attendance` module                         | Open session lookup for operational readiness  |
| `shared/workforce/operational-readiness.ts` | `isOperationallyReady()` on create             |
| `shared/workforce/employee-context.ts`      | `resolveActingEmployeeId()` for self-service   |
| `shared/tenant`                             | `TenantContext`, company resolution middleware |
| `shared/policy`                             | role enums, `authorize()` middleware           |
| `shared/errors`                             | `AppError` hierarchy, error codes              |
| `shared/http`                               | API envelope helpers                           |
| `shared/pagination`                         | pagination types and query schema              |
| `shared/audit`                              | audit event contracts                          |

### Shared services (new for P004)

```text
src/shared/transactions/
├── direction-mapper.ts       # BUY/SELL ↔ INBOUND/OUTBOUND
└── item-total.ts             # round(weight * price, 2)
```

### Module interactions

```text
[Client] --> [transaction.routes]
              --> authn + companyResolution + authorize
              --> transaction.controller
              --> use cases
                    --> transaction.repository
                    --> attendance.repository (readiness check)
                    --> branch/warehouse repositories (location validation)
                    --> file-storage (attachments)
                    --> audit service
```

**Route registration order**: Mount suggestion routes (`/transactions/suggestions/*`) and
`/transactions/assigned` before `/:transactionId` to prevent path conflicts.

## 2. Entity Design

See [data-model.md](./data-model.md) for full field tables. Summary below.

### Transaction (Aggregate Root)

**Purpose**: Core operational buying/selling record.

| Field               | Type     | Notes                            |
| ------------------- | -------- | -------------------------------- |
| id                  | UUID     | PK                               |
| companyId           | UUID     | FK → Company                     |
| createdByUserId     | UUID     | FK → User                        |
| updatedByUserId     | UUID     | Nullable audit                   |
| direction           | enum     | `INBOUND`, `OUTBOUND`            |
| status              | enum     | `DRAFT`, `CANCELLED`             |
| partyName           | string   | Required                         |
| partyContactNumber  | string   | Optional                         |
| transactionDate     | datetime | Business date/time               |
| locationType        | enum     | `BRANCH`, `WAREHOUSE`, `OUTSIDE` |
| branchId            | UUID     | Conditional                      |
| warehouseId         | UUID     | Conditional                      |
| outsideLocationName | string   | Conditional                      |
| outsideAddress      | string   | Conditional                      |
| tripId              | UUID     | Optional (P006)                  |
| notes               | string   | Optional                         |
| cancellationReason  | string   | Set on cancel                    |
| cancelledAt         | datetime | Set on cancel                    |
| deletedAt           | datetime | Soft delete (archive)            |

**Indexes**: `(companyId, status, deletedAt)`, `(companyId, transactionDate)`,
`(companyId, direction, status)`, `(companyId, branchId)`, `(companyId, warehouseId)`

### TransactionItem

**Purpose**: Material line with weight, unit, price, computed total.

| Field         | Type    | Notes                 |
| ------------- | ------- | --------------------- |
| id            | UUID    | PK                    |
| transactionId | UUID    | FK → Transaction      |
| materialName  | string  | Required              |
| weight        | decimal | > 0                   |
| unit          | enum    | KG, G, TON, LB, etc.  |
| price         | decimal | >= 0                  |
| total         | decimal | weight × price (2 dp) |
| notes         | string  | Optional              |

**Indexes**: `(transactionId)`, `(transactionId, materialName)`

### TransactionAttachment

**Purpose**: File evidence; P004 supports `PHOTO` type with future document extensibility.

| Field            | Type    | Notes                 |
| ---------------- | ------- | --------------------- |
| id               | UUID    | PK                    |
| transactionId    | UUID    | FK → Transaction      |
| attachmentType   | enum    | `PHOTO`               |
| fileName         | string  | Original name         |
| filePath         | string  | Storage path          |
| mimeType         | string  | image/jpeg, png, webp |
| fileSize         | integer | Max 5 MB              |
| uploadedByUserId | UUID    | FK → User             |

**Indexes**: `(transactionId)`, `(transactionId, attachmentType)`

### TransactionEmployeeAssignment

**Purpose**: Links assigned Employees to a Transaction.

| Field         | Type     | Notes                           |
| ------------- | -------- | ------------------------------- |
| transactionId | UUID     | FK → Transaction (composite PK) |
| employeeId    | UUID     | FK → Employee (composite PK)    |
| assignedAt    | datetime | Assignment timestamp            |

**Indexes**: `(employeeId, transactionId)`, `(employeeId)`

## 3. Relationship Design

```text
Company (P001)
│
├── 1:N → Branch (P002) ────────────────┐
├── 1:N → Warehouse (P002) ─────────────┤
├── 1:N → Employee (P001) ──────────────┼──┐
│                                       │  │
└── 1:N → Transaction ◄─────────────────┘  │
         │                                  │
         ├── N:1 → Branch (optional)        │
         ├── N:1 → Warehouse (optional)    │
         ├── 1:N → TransactionItem        │
         ├── 1:N → TransactionAttachment  │
         └── N:M → Employee                │
              (TransactionEmployeeAssignment)
```

**Ownership**:

- Company owns all Transactions via `companyId`.
- Transaction owns Items and Attachments (cascade on hard delete; soft archive on root).
- User is creator (`createdByUserId`); assignments are operational, not ownership.
- Branch/Warehouse are references, not owners.

**Aggregate boundaries**: Mutations to Items, Attachments, and Assignments MUST load the parent
Transaction, assert `status === DRAFT` and `deletedAt IS NULL`, then persist. Cancelled and archived
transactions reject all mutations.

## 4. Business Workflow

### Transaction lifecycle

```text
                    ┌─────────────┐
                    │   CREATE    │
                    │ (timed in)  │
                    └──────┬──────┘
                           ▼
                    ┌─────────────┐
         ┌─────────│    DRAFT    │─────────┐
         │         │  (editable) │         │
         │         │  auto-save│         │
         │         └──────┬──────┘         │
         │    PATCH items/attachments      │
         │                │                │
         │ cancel         │ archive        │
         ▼                ▼                ▼
  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
  │  CANCELLED  │  │  ARCHIVED   │  │  (hidden    │
  │ (read-only) │  │ deletedAt   │  │  from lists)│
  └─────────────┘  └─────────────┘  └─────────────┘
```

### Draft behavior

- Created with `status = DRAFT` on POST.
- PATCH updates header fields, assignments, and supports client-driven auto-save.
- Items and Attachments add/update/delete allowed.
- Employee edit requires assignment; Manager/Owner edit any Company Draft.

### Cancelled behavior

- `POST /transactions/{id}/cancel` sets `status = CANCELLED`, `cancelledAt`, optional reason.
- All PATCH, item, and attachment mutations return 409.
- GET still allowed within authorization scope (audit/history).

### Archive behavior

- `POST /transactions/{id}/archive` sets `deletedAt` (Manager/Owner).
- Excluded from default list queries.
- Retrievable with `includeArchived=true` on company list.

## 5. API Design

All endpoints require authentication. All responses use standard envelope. List endpoints include
pagination metadata in `meta`. Base path: `/api/v1/transactions`.

### Transactions

| Method | URI                             | Purpose                  | Auth Roles                       |
| ------ | ------------------------------- | ------------------------ | -------------------------------- |
| POST   | `/transactions`                 | Create Draft             | EMPLOYEE+ (timed in), MGR, OWNER |
| PATCH  | `/transactions/{transactionId}` | Update Draft / auto-save | Assigned EMPLOYEE, MGR, OWNER    |
| GET    | `/transactions/{transactionId}` | View detail              | Assigned EMPLOYEE, MGR, OWNER    |
| GET    | `/transactions`                 | Company list             | OWNER, MANAGER                   |
| GET    | `/transactions/assigned`        | Assigned list            | EMPLOYEE (linked profile)        |
| POST   | `/transactions/{id}/cancel`     | Cancel Draft             | Assigned EMPLOYEE, MGR, OWNER    |
| POST   | `/transactions/{id}/archive`    | Archive                  | OWNER, MANAGER                   |

### Transaction Items

| Method | URI                                            | Purpose     | Auth Roles         |
| ------ | ---------------------------------------------- | ----------- | ------------------ |
| GET    | `/transactions/{transactionId}/items`          | List items  | Scoped view access |
| POST   | `/transactions/{transactionId}/items`          | Add item    | Draft edit access  |
| PATCH  | `/transactions/{transactionId}/items/{itemId}` | Update item | Draft edit access  |
| DELETE | `/transactions/{transactionId}/items/{itemId}` | Remove item | Draft edit access  |

### Transaction Attachments

| Method | URI                                                        | Purpose      | Auth Roles         |
| ------ | ---------------------------------------------------------- | ------------ | ------------------ |
| GET    | `/transactions/{transactionId}/attachments`                | List photos  | Scoped view access |
| POST   | `/transactions/{transactionId}/attachments`                | Upload photo | Draft edit access  |
| DELETE | `/transactions/{transactionId}/attachments/{attachmentId}` | Remove photo | Draft edit access  |

### Suggestions

| Method | URI                                   | Purpose              | Auth Roles        |
| ------ | ------------------------------------- | -------------------- | ----------------- |
| GET    | `/transactions/suggestions/materials` | Material suggestions | ALL authenticated |
| GET    | `/transactions/suggestions/prices`    | Price suggestions    | ALL authenticated |

Full OpenAPI contract: [contracts/openapi.yaml](./contracts/openapi.yaml)

### List query parameters

| Parameter          | Type    | Notes                                                 |
| ------------------ | ------- | ----------------------------------------------------- |
| page               | int     | Default 1                                             |
| limit              | int     | Default 20, max 100                                   |
| sortBy             | string  | `transactionDate`, `createdAt`, `partyName`, `status` |
| sortOrder          | string  | `asc`, `desc`                                         |
| direction          | enum    | INBOUND, OUTBOUND                                     |
| status             | enum    | DRAFT, CANCELLED                                      |
| locationType       | enum    | BRANCH, WAREHOUSE, OUTSIDE                            |
| branchId           | uuid    | Filter by branch                                      |
| warehouseId        | uuid    | Filter by warehouse                                   |
| assignedEmployeeId | uuid    | Manager list filter                                   |
| fromDate / toDate  | date    | Transaction date range                                |
| search             | string  | partyName, notes, materialName (subquery)             |
| includeArchived    | boolean | Manager/Owner only; default false                     |

## 6. Validation Design

### Zod schema organization

```text
src/modules/transaction/presentation/transaction.schemas.ts
src/shared/transactions/direction-mapper.ts   # preprocess BUY/SELL
```

### Transaction validation

- `direction`: `INBOUND` | `OUTBOUND` | `BUY` | `SELL` (preprocess to canonical)
- `partyName`: non-empty, max 200
- `partyContactNumber`: optional, max 50
- `transactionDate`: valid datetime, not > 24h future
- `locationType`: conditional branchId / warehouseId / outside fields (discriminated union)
- `assignedEmployeeIds`: min 1, all UUIDs, same Company
- `notes`: max 2000
- `tripId`: optional UUID
- Update PATCH: `minProperties: 1`

### Item validation

- `materialName`: non-empty, max 200
- `weight`: positive decimal
- `unit`: enum allowlist
- `price`: non-negative decimal
- `total`: computed server-side; reject client mismatch if provided
- `notes`: max 500

### Attachment validation

- Multipart `file` required
- `mimeType` in `image/jpeg`, `image/png`, `image/webp`
- `fileSize` <= 5_242_880 bytes
- Max 20 photos per transaction (business validation in use case)

### Business validation (application layer)

- `assertOperationallyReady(openAttendanceSession)` on create
- `assertDraftEditable(transaction)` before mutations
- `assertEmployeeAssigned(actorEmployeeId, transaction)` for Employee role edits
- `assertLocationReferences(companyId, locationType, branchId, warehouseId)`
- `assertNotArchived(transaction)` before mutations
- Cross-company access rejected on all operations

### Shared validators

- Reuse `paginationQuerySchema` from P001
- Reuse `dateRangeQuerySchema` pattern from workforce modules
- `directionSchema` with preprocess in `src/shared/transactions/direction-mapper.ts`

## 7. Authorization Matrix

| Action                           | OWNER | MANAGER | EMPLOYEE (assigned) | EMPLOYEE (not assigned) |
| -------------------------------- | ----- | ------- | ------------------- | ----------------------- |
| Create Draft (timed in)          | ✅    | ✅      | ✅                  | ✅ (if timed in)        |
| View transaction                 | ✅    | ✅      | ✅                  | ❌                      |
| Edit Draft (header/items/photos) | ✅    | ✅      | ✅                  | ❌                      |
| List company transactions        | ✅    | ✅      | ❌                  | ❌                      |
| List assigned transactions       | ✅*   | ✅*     | ✅                  | ✅                      |
| Cancel Draft                     | ✅    | ✅      | ✅                  | ❌                      |
| Archive                          | ✅    | ✅      | ❌                  | ❌                      |
| Material/price suggestions       | ✅    | ✅      | ✅                  | ✅                      |

\* When acting with linked Employee profile on assigned list endpoint.

Enforcement:

- `createAuthenticationMiddleware` → `companyResolutionMiddleware` → `authorize(roles)` per route
- `transaction-authorization.policy.ts` for assignment checks on Employee mutations
- Tenant isolation: repository always filters by `req.auth.companyId`

## 8. Business Rules

1. Every Transaction belongs to exactly one Company.
2. Every Transaction is created by exactly one User (`createdByUserId`).
3. Transactions may have multiple assigned Employees via join table.
4. Transactions contain one or more Items before operational completeness (P005 handoff).
5. Items cannot exist without a Transaction.
6. Attachments cannot exist without a Transaction.
7. Only `DRAFT` transactions may be edited.
8. `CANCELLED` transactions are immutable.
9. Only timed-in Employees may create transactions (`isOperationallyReady()`).
10. Employees may edit only Draft transactions they are assigned to.
11. Managers and Owners may edit any Company Draft transaction.
12. Material suggestions query prior `materialName` values within the same Company.
13. Price suggestions query prior `price` values for a `materialName` within the same Company.
14. Archived transactions (`deletedAt` set) are excluded from default lists.
15. Cross-company access forbidden on all operations.

## 9. Error Scenarios

| Scenario                   | HTTP | Error Code              | When                                        |
| -------------------------- | ---- | ----------------------- | ------------------------------------------- |
| Validation failure         | 400  | VALIDATION_ERROR        | Zod or field rule fails                     |
| Invalid file upload        | 400  | VALIDATION_ERROR        | MIME/size/count exceeded                    |
| Unauthenticated            | 401  | UNAUTHENTICATED         | Missing/invalid bearer token                |
| Forbidden role             | 403  | FORBIDDEN               | Employee on company list or unassigned edit |
| No linked employee profile | 403  | FORBIDDEN               | Assigned list without User.employeeId       |
| Cross-company access       | 403  | COMPANY_SCOPE_VIOLATION | Resource companyId ≠ auth companyId         |
| Resource not found         | 404  | RESOURCE_NOT_FOUND      | ID not found in tenant scope                |
| Not timed in               | 409  | BUSINESS_RULE_VIOLATION | Create without open attendance session      |
| Not draft                  | 409  | LIFECYCLE_CONFLICT      | Mutate cancelled/archived transaction       |
| Already cancelled          | 409  | LIFECYCLE_CONFLICT      | Cancel on cancelled transaction             |
| Already archived           | 409  | LIFECYCLE_CONFLICT      | Archive on archived transaction             |
| Invalid location           | 409  | BUSINESS_RULE_VIOLATION | Branch/Warehouse not in company or inactive |
| No items (completeness)    | 409  | BUSINESS_RULE_VIOLATION | Future handoff validation                   |
| Max photos exceeded        | 409  | BUSINESS_RULE_VIOLATION | > 20 photos on transaction                  |
| Total mismatch             | 400  | VALIDATION_ERROR        | Client total ≠ weight × price               |

## 10. Swagger Design

### Tags

- `Transactions`
- `Transaction Items`
- `Transaction Attachments`
- `Transaction Suggestions`

### Schemas (reusable)

- `TransactionSummary`, `TransactionDetail`, `TransactionItem`, `TransactionAttachment`
- `AssignedEmployeeSummary`, `MaterialSuggestion`, `PriceSuggestion`
- Enums: `TransactionDirection`, `TransactionStatus`, `TransactionLocationType`, `TransactionItemUnit`
- Request bodies: `CreateTransactionRequest`, `UpdateTransactionRequest`, `CancelTransactionRequest`,
  item create/update bodies
- `ApiSuccessEnvelope`, `ApiErrorEnvelope`, `PaginationMeta` (from P001 common schemas)

### Module OpenAPI file

- `src/modules/transaction/presentation/transaction.openapi.ts`

Assembled in `src/swagger/openapi.builder.ts` alongside P001/P002/P003 paths.

### Examples

- Create BUY transaction at Branch with one copper item
- PATCH auto-save partial header update
- Cancel with reason
- Multipart photo upload

### Error responses

- Document 400, 401, 403, 404, 409 per endpoint using `ErrorBody` schema

## 11. Testing Strategy

### Unit tests (Vitest)

- Domain: `transaction-rules.ts` — draft-only, location conditionals, total computation
- Domain: direction mapping BUY/SELL ↔ INBOUND/OUTBOUND
- Use cases: create with readiness gate, assignment authorization, cancel immutability
- `item-total.ts` rounding edge cases

### Integration tests

- Prisma repositories: CRUD, tenant scoping, assignment join, suggestion queries
- File storage: save/delete attachment files
- List filters: direction, status, date range, search

### API tests (Supertest)

- Full create → add item → upload photo → PATCH → cancel lifecycle
- Auto-save PATCH idempotency
- Employee assigned vs unassigned edit (403)
- Manager company-wide Draft edit
- Not timed in create rejection
- Cancelled transaction mutation rejection
- Archive exclusion from default list
- Material and price suggestions from seeded history
- Cross-company access rejection
- Invalid location (wrong company branch)
- Multipart validation (oversized file, wrong MIME)
- Role-based authorization matrix

### Test file layout

```text
tests/unit/transaction/
tests/integration/transaction/
tests/api/transaction/
tests/factories/transaction.factory.ts
```

Extend `tests/setup/in-memory-repositories.ts` with transaction repos for API tests (mirror P003).

## 12. Acceptance Criteria

- [ ] All 16 transaction endpoints implemented and documented in OpenAPI
- [ ] Transaction, TransactionItem, TransactionAttachment, TransactionEmployeeAssignment Prisma
      models and migration applied
- [ ] Domain entities with draft/cancel/archive rules
- [ ] Repository interfaces and Prisma implementations with tenant scoping
- [ ] FileStorage abstraction with LocalFileStorage implementation
- [ ] Zod validation on all endpoints including multipart
- [ ] Authorization matrix enforced (assignment + role)
- [ ] Operational readiness gate on create (100% test coverage)
- [ ] Cancelled immutability enforced (100% test coverage)
- [ ] Cross-company access rejected (100% test coverage)
- [ ] Material and price suggestions return Company-scoped history
- [ ] `pnpm run build`, `pnpm test`, `pnpm run lint` pass
- [ ] Quickstart scenarios validated end-to-end

## 13. Future Extensibility

| Future Feature (Spec) | How P004 Supports It                                                                 |
| --------------------- | ------------------------------------------------------------------------------------ |
| P005 Payment Workflow | Add `READY_FOR_PAYMENT`, `PAID` to `TransactionStatus` enum; payment columns on root |
| P005 Settlement       | `settledAt`, `paymentReference` additive on Transaction                              |
| P005 Receipts         | `TransactionAttachmentType.RECEIPT` enum value + generator service                   |
| P006 Trips            | `tripId` FK on Transaction; Outside+Trip required rule in P006                       |
| P007 Expenses         | Optional `expenseId` FK; link expense lines to transaction                           |
| P008 Analytics        | Query aggregates by companyId, direction, materialName, date                         |
| P009 Reports          | Export list/detail queries; attachment download endpoints                            |

No aggregate redesign required — only additive migrations, enum extensions, and new modules
referencing `Transaction.id`.

## Project Structure

### Documentation (this feature)

```text
specs/005-transaction-management/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/openapi.yaml
└── tasks.md              # Phase 2 (/speckit-tasks)
```

### Source Code (additions)

```text
src/modules/transaction/
src/shared/transactions/
prisma/schema.prisma        # add transaction models and enums
tests/unit|integration|api/transaction/
uploads/                    # gitignored; local attachment storage
```

## Complexity Tracking

| Addition                   | Why Needed                         | Simpler Alternative Rejected Because              |
| -------------------------- | ---------------------------------- | ------------------------------------------------- |
| multer dependency          | Binary multipart photo uploads     | Base64 JSON bloats payloads and hurts performance |
| FileStorage interface      | Decouple domain from filesystem    | Direct fs in use cases violates layer boundaries  |
| Join table for assignments | Multiple employees per transaction | JSON array not indexable for assigned lists       |

## Artifacts Generated

| Artifact                    | Path                                                      |
| --------------------------- | --------------------------------------------------------- |
| Implementation plan         | `specs/005-transaction-management/plan.md`                |
| Research decisions          | `specs/005-transaction-management/research.md`            |
| Data model                  | `specs/005-transaction-management/data-model.md`          |
| OpenAPI contracts           | `specs/005-transaction-management/contracts/openapi.yaml` |
| Quickstart validation guide | `specs/005-transaction-management/quickstart.md`          |
