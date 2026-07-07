# Implementation Plan: P002 - Organization Management

**Branch**: `003-organization-management` | **Date**: 2026-07-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-organization-management/spec.md`

**Note**: This plan extends P001 (Company & Identity Foundation) with operational resource
management for Branches, Warehouses, and Vehicles. It is the definitive technical design for
implementation — not implementation code.

## Summary

Implement Organization Management as three tenant-scoped resource modules (`branch`, `warehouse`,
`vehicle`) under the existing modular Clean Architecture. Each module provides full CRUD + archive
lifecycle with company isolation, role-based authorization, Zod validation, standard API envelopes,
OpenAPI documentation, and Vitest/Supertest coverage. Resources use soft-delete via `deletedAt` and
are excluded from default operational lists when archived.

## Technical Context

**Language/Version**: TypeScript (strict mode) on Node.js LTS

**Primary Dependencies**: Express.js, Prisma ORM, PostgreSQL, Zod, JWT (from P001), Pino,
Swagger/OpenAPI, Vitest, Supertest

**Storage**: PostgreSQL with Prisma repositories in infrastructure layer only

**Testing**: Vitest (unit/integration), Supertest (API/authorization/tenant isolation)

**Target Platform**: Linux server (Docker); local dev via docker-compose

**Project Type**: modular REST API backend extending P001

**Performance Goals**: list and detail endpoints support interactive operational use; tenant filter
applied on every query; pagination defaults to 20 items per page

**Constraints**: Company is hard tenant boundary; no cross-company access; archived resources
excluded from default lists; no hard deletes; P001 auth/role middleware reused

**Scale/Scope**: 3 new modules, 15 protected endpoints (5 per resource), shared operational
eligibility primitives for future modules

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate                             | Pre-Design | Post-Design | Notes                                                                    |
| -------------------------------- | ---------- | ----------- | ------------------------------------------------------------------------ |
| Layer boundaries                 | ✅         | ✅          | Each module follows domain → application → infrastructure → presentation |
| No business logic in controllers | ✅         | ✅          | Controllers delegate to use cases only                                   |
| Repository pattern               | ✅         | ✅          | Branch/Warehouse/Vehicle repositories behind interfaces                  |
| Dependency injection             | ✅         | ✅          | Wired in `src/config/container.ts`                                       |
| Zod validation                   | ✅         | ✅          | Per-resource schemas for create/update/list/archive                      |
| DTOs                             | ✅         | ✅          | Request/response DTOs per resource                                       |
| Standard response envelope       | ✅         | ✅          | Reuses P001 `success()` / `failure()` helpers                            |
| Pagination conventions           | ✅         | ✅          | `page`, `limit`, `sortBy`, `sortOrder`, `search` on list endpoints       |
| Security                         | ✅         | ✅          | JWT bearer auth, tenant middleware, role authorization                   |
| No `any`                         | ✅         | ✅          | Strict TypeScript throughout                                             |
| Error handling                   | ✅         | ✅          | Reuses global error middleware and error codes                           |
| Logging                          | ✅         | ✅          | Audit events for create/update/archive per resource                      |
| Tests                            | ✅         | ✅          | Unit, integration, API, auth, validation, tenant isolation               |
| OpenAPI                          | ✅         | ✅          | Tags: Branches, Warehouses, Vehicles                                     |
| Simplicity                       | ✅         | ✅          | Three focused modules; no premature assignment/join tables               |

## 1. Module Architecture

### Module responsibilities

| Module      | Responsibility                                                                  |
| ----------- | ------------------------------------------------------------------------------- |
| `branch`    | Branch CRUD, archive, list, tenant scoping, uniqueness enforcement              |
| `warehouse` | Warehouse CRUD, archive, list, tenant scoping, uniqueness enforcement           |
| `vehicle`   | Vehicle CRUD, archive, list, tenant scoping, plate uniqueness, status lifecycle |

### Dependencies on P001

- `company` module: tenant boundary validation (Company must exist and be active)
- `auth` module: JWT authentication middleware
- `shared/tenant`: `TenantContext`, company resolution middleware
- `shared/policy`: role enums, `authorize()` middleware
- `shared/errors`: `AppError` hierarchy, error codes
- `shared/http`: API envelope helpers
- `shared/pagination`: pagination types and query schema
- `shared/audit`: audit event contracts
- `middleware/*`: authentication, authorization, validation, error handling

### Internal module organization

Each module (`branch`, `warehouse`, `vehicle`) follows P001 structure:

```text
src/modules/{resource}/
├── domain/
│   ├── {resource}.entity.ts
│   ├── {resource}-status.ts
│   ├── {resource}-rules.ts
│   └── {resource}.repository.ts
├── application/
│   ├── dto/
│   ├── use-cases/
│   │   ├── create-{resource}.use-case.ts
│   │   ├── get-{resource}.use-case.ts
│   │   ├── update-{resource}.use-case.ts
│   │   ├── archive-{resource}.use-case.ts
│   │   └── list-{resource}s.use-case.ts
│   ├── policies/
│   │   └── {resource}-authorization.policy.ts
│   └── services/
│       └── {resource}-audit.service.ts
├── infrastructure/
│   ├── {resource}.prisma-repository.ts
│   └── mappers/
│       └── {resource}.mapper.ts
└── presentation/
    ├── {resource}.controller.ts
    ├── {resource}.routes.ts
    ├── {resource}.schemas.ts
    └── {resource}.openapi.ts
```

### Service boundaries

- **Presentation**: HTTP routing, Zod validation, controller mapping
- **Application**: use case orchestration, DTO mapping, audit emission
- **Domain**: entity behavior, business rules, repository interfaces
- **Infrastructure**: Prisma persistence, record-to-entity mapping

No module may import Prisma types into domain or application layers.

### Shared components (new for P002)

```text
src/shared/organization/
├── operational-eligibility.ts   # isOperationallyEligible(resource)
└── resource-status.ts         # shared status helpers if needed
```

## 2. Entity Design

See [data-model.md](./data-model.md) for full field tables. Summary below.

### Branch

**Purpose**: Operational Company location.

| Field           | Type     | Nullable | Default   | Notes                       |
| --------------- | -------- | -------- | --------- | --------------------------- |
| id              | UUID     | No       | generated | PK                          |
| companyId       | UUID     | No       | —         | FK → Company                |
| name            | string   | No       | —         | Unique per company (active) |
| address         | string   | No       | —         | Required                    |
| contactNumber   | string   | No       | —         | Required                    |
| status          | enum     | No       | ACTIVE    | ACTIVE, INACTIVE            |
| createdAt       | datetime | No       | now       | Audit                       |
| updatedAt       | datetime | No       | now       | Audit                       |
| deletedAt       | datetime | Yes      | null      | Soft-delete/archive         |
| createdByUserId | UUID     | Yes      | null      | Audit (optional P002)       |
| updatedByUserId | UUID     | Yes      | null      | Audit (optional P002)       |

**Indexes**: PK `id`; unique `(companyId, name)` WHERE `deletedAt IS NULL`; index `(companyId, status)`

### Warehouse

Same structure as Branch with warehouse-specific semantics. Unique `(companyId, name)` among active
records.

### Vehicle

**Purpose**: Company-owned vehicle for logistics.

| Field           | Type     | Nullable | Default   | Notes                       |
| --------------- | -------- | -------- | --------- | --------------------------- |
| id              | UUID     | No       | generated | PK                          |
| companyId       | UUID     | No       | —         | FK → Company                |
| plateNumber     | string   | No       | —         | Unique per company (active) |
| description     | string   | No       | —         | Required                    |
| status          | enum     | No       | AVAILABLE | See VehicleStatus           |
| createdAt       | datetime | No       | now       | Audit                       |
| updatedAt       | datetime | No       | now       | Audit                       |
| deletedAt       | datetime | Yes      | null      | Soft-delete/archive         |
| createdByUserId | UUID     | Yes      | null      | Audit                       |
| updatedByUserId | UUID     | Yes      | null      | Audit                       |

**VehicleStatus enum**: `AVAILABLE`, `IN_USE`, `MAINTENANCE`, `INACTIVE`

**Indexes**: PK `id`; unique `(companyId, plateNumber)` WHERE `deletedAt IS NULL`; index
`(companyId, status)`

### Soft-delete strategy

Archive operation sets `deletedAt = now()` and `status = INACTIVE` (Vehicle) or `INACTIVE`
(Branch/Warehouse). Records are never hard-deleted. Default queries filter `deletedAt IS NULL`.

### Future extensibility

Stable UUID primary keys and `companyId` ownership enable future FK references from Employees, Trips,
Transactions, and Expenses without schema redesign.

## 3. Relationship Design

```text
Company (P001)
│
├── 1:N → Branches
├── 1:N → Warehouses
└── 1:N → Vehicles
```

**Ownership**: Every Branch, Warehouse, and Vehicle row carries `companyId`. All repository queries
MUST include `companyId` from authenticated tenant context.

**Future relationships** (not implemented in P002):

| Future Module | Relationship                                           |
| ------------- | ------------------------------------------------------ |
| Workforce     | Employee → Branch/Warehouse assignment (M:N future)    |
| Trips         | Trip → Vehicle (N:1)                                   |
| Transactions  | Transaction → Branch/Warehouse (N:1)                   |
| Expenses      | Expense → Branch/Warehouse/Vehicle (N:1 optional)      |
| Analytics     | Aggregations over organization resources by companyId  |
| Reports       | Historical reports include archived via explicit query |

P002 exports `isOperationallyEligible()` for downstream modules to enforce selection rules.

## 4. API Design

All endpoints require authentication unless noted. All responses use standard envelope. List
endpoints include pagination metadata in `meta`.

### Branches

| Method | URI                                   | Purpose   | Auth Roles               |
| ------ | ------------------------------------- | --------- | ------------------------ |
| POST   | `/api/v1/branches`                    | Create    | OWNER, MANAGER           |
| GET    | `/api/v1/branches`                    | List      | OWNER, MANAGER, EMPLOYEE |
| GET    | `/api/v1/branches/{branchId}`         | Get by ID | OWNER, MANAGER, EMPLOYEE |
| PATCH  | `/api/v1/branches/{branchId}`         | Update    | OWNER, MANAGER           |
| POST   | `/api/v1/branches/{branchId}/archive` | Archive   | OWNER, MANAGER           |

**Create request**: `{ name, address, contactNumber, status }`  
**Update request**: at least one of `{ name, address, contactNumber, status }`  
**List query**: `page`, `limit`, `sortBy` (name|createdAt|status), `sortOrder`, `search`, `status`  
**Response data**: Branch object (see contracts)  
**Errors**: 400 validation, 401 unauthenticated, 403 forbidden, 404 not found, 409 duplicate/conflict

### Warehouses

Same pattern as Branches with `/api/v1/warehouses` and `{warehouseId}`.

### Vehicles

| Method | URI                                    | Purpose | Auth Roles               |
| ------ | -------------------------------------- | ------- | ------------------------ |
| POST   | `/api/v1/vehicles`                     | Create  | OWNER, MANAGER           |
| GET    | `/api/v1/vehicles`                     | List    | OWNER, MANAGER, EMPLOYEE |
| GET    | `/api/v1/vehicles/{vehicleId}`         | Get     | OWNER, MANAGER, EMPLOYEE |
| PATCH  | `/api/v1/vehicles/{vehicleId}`         | Update  | OWNER, MANAGER           |
| POST   | `/api/v1/vehicles/{vehicleId}/archive` | Archive | OWNER, MANAGER           |

**Create request**: `{ plateNumber, description, status }`  
**Update request**: at least one of `{ plateNumber, description, status }`  
**List query**: `page`, `limit`, `sortBy` (plateNumber|createdAt|status), `sortOrder`, `search`, `status`  
**Vehicle status values**: `AVAILABLE`, `IN_USE`, `MAINTENANCE`, `INACTIVE`

Full OpenAPI contract: [contracts/openapi.yaml](./contracts/openapi.yaml)

## 5. Validation Design

### Zod schema organization

```text
src/modules/branch/presentation/branch.schemas.ts
src/modules/warehouse/presentation/warehouse.schemas.ts
src/modules/vehicle/presentation/vehicle.schemas.ts
src/validations/common-query.schemas.ts  # extended list query if needed
```

### Create validation

- Branch/Warehouse: required `name`, `address`, `contactNumber`; optional `status` defaulting to
  `ACTIVE`
- Vehicle: required `plateNumber`, `description`; optional `status` defaulting to `AVAILABLE`
- String fields: `min(1)` after trim
- Status: enum validation per resource type

### Update validation

- At least one mutable field required (`.refine()`)
- Same field rules as create for provided fields
- Path param: UUID validation for resource IDs

### Archive validation

- Path param UUID only; no body required
- Use case checks not already archived (`deletedAt IS NOT NULL` → 409)

### List/search validation

- Reuse `paginationQuerySchema` from P001
- Allowlisted `sortBy` per resource
- Optional `status` filter enum per resource
- `search` applies to name (Branch/Warehouse) or plateNumber/description (Vehicle)

### Business validation (application layer)

- Duplicate name/plate check before create/update
- Tenant scope assertion on every read/write
- Archive idempotency: reject double-archive with `LifecycleConflictError`
- Company must exist and be active (delegate to P001 company lookup if needed)

### Shared reusable validators

- `uuidParamSchema` — path parameter IDs
- `paginationQuerySchema` — list endpoints
- `contactNumberSchema` — optional shared phone format (min length, trim)
- `nonEmptyStringSchema` — trimmed non-empty strings

## 6. Authorization Matrix

| Action  | Branch | Warehouse | Vehicle | OWNER | MANAGER | EMPLOYEE |
| ------- | ------ | --------- | ------- | ----- | ------- | -------- |
| Create  | ✅     | ✅        | ✅      | ✅    | ✅      | ❌       |
| List    | ✅     | ✅        | ✅      | ✅    | ✅      | ✅       |
| Get     | ✅     | ✅        | ✅      | ✅    | ✅      | ✅       |
| Update  | ✅     | ✅        | ✅      | ✅    | ✅      | ❌       |
| Archive | ✅     | ✅        | ✅      | ✅    | ✅      | ❌       |

Enforcement:

- `createAuthenticationMiddleware` → `companyResolutionMiddleware` → `authorize(roles)` per route
- Tenant isolation: repository always filters by `req.auth.companyId`
- Cross-company ID access returns 403 `COMPANY_SCOPE_VIOLATION` or 404 (prefer 404 for ID guessing)

## 7. Business Rules

1. Every Branch, Warehouse, and Vehicle belongs to exactly one Company.
2. Branch name unique within Company among non-deleted records.
3. Warehouse name unique within Company among non-deleted records.
4. Vehicle plate number unique within Company among non-deleted records.
5. Archived resources (`deletedAt` set) excluded from default list queries.
6. Archived resources cannot be selected for future operational use.
7. Only operationally eligible resources available for downstream modules:
   - Branch/Warehouse: `ACTIVE` and not deleted
   - Vehicle: `AVAILABLE` and not deleted
8. Cross-company access forbidden on all operations.
9. No permanent deletion through API.
10. Branches/Warehouses may exist without employee assignments.
11. Vehicles may exist without Trip assignments.
12. Employee role is read-only for all organization resources.

## 8. Error Scenarios

| Scenario                 | HTTP | Error Code              | When                                       |
| ------------------------ | ---- | ----------------------- | ------------------------------------------ |
| Validation failure       | 400  | VALIDATION_ERROR        | Zod or business validation fails           |
| Unauthenticated          | 401  | UNAUTHENTICATED         | Missing/invalid bearer token               |
| Forbidden role           | 403  | FORBIDDEN               | Employee attempts create/update/archive    |
| Cross-company access     | 403  | COMPANY_SCOPE_VIOLATION | Resource companyId ≠ auth companyId        |
| Resource not found       | 404  | RESOURCE_NOT_FOUND      | ID not found in tenant scope               |
| Duplicate branch name    | 409  | DUPLICATE_RESOURCE      | Active branch name exists in company       |
| Duplicate warehouse name | 409  | DUPLICATE_RESOURCE      | Active warehouse name exists in company    |
| Duplicate plate number   | 409  | DUPLICATE_RESOURCE      | Active plate exists in company             |
| Already archived         | 409  | LIFECYCLE_CONFLICT      | Archive called on already-deleted resource |
| Inactive for operations  | 409  | LIFECYCLE_CONFLICT      | Future modules reject ineligible resource  |

## 9. Swagger Design

### Tags

- `Branches`
- `Warehouses`
- `Vehicles`

### Schemas (reusable)

- `Branch`, `Warehouse`, `Vehicle` response schemas
- `CreateBranchRequest`, `UpdateBranchRequest` (and warehouse/vehicle equivalents)
- `ApiSuccessEnvelope`, `ApiErrorEnvelope`, `ErrorBody` (from P001 common schemas)
- `PaginationMeta`

### Common responses

Register in `src/swagger/common-responses.ts`:

- 400 Validation Error
- 401 Unauthenticated
- 403 Forbidden / Company Scope Violation
- 404 Not Found
- 409 Duplicate / Lifecycle Conflict

### Module OpenAPI files

- `src/modules/branch/presentation/branch.openapi.ts`
- `src/modules/warehouse/presentation/warehouse.openapi.ts`
- `src/modules/vehicle/presentation/vehicle.openapi.ts`

Assembled in `src/swagger/openapi.builder.ts` alongside P001 paths.

## 10. Testing Strategy

### Unit tests (Vitest)

- Domain entity behavior: `isActive()`, `isDeleted()`, `isOperationallyEligible()`
- Business rules: uniqueness assertions, archive transitions
- Use cases: create, update, archive, list with mocked repositories

### Integration tests

- Prisma repository: CRUD, soft-delete filter, uniqueness constraints, tenant-scoped queries

### API tests (Supertest)

- Happy path CRUD per resource
- List pagination, search, sort, status filter
- Archive exclusion from default lists
- Duplicate name/plate conflicts (409)
- Validation failures (400)
- Unauthenticated (401)
- Employee forbidden on mutations (403)
- Cross-company access rejection
- Get archived resource by ID (404 or allowed read — **decision: 404 in default get** to avoid leaking existence)

### Test file layout

```text
tests/unit/branch/
tests/unit/warehouse/
tests/unit/vehicle/
tests/integration/branch/
tests/integration/warehouse/
tests/integration/vehicle/
tests/api/branch/
tests/api/warehouse/
tests/api/vehicle/
tests/factories/branch.factory.ts
tests/factories/warehouse.factory.ts
tests/factories/vehicle.factory.ts
```

## 11. Acceptance Criteria

- [ ] All 15 organization endpoints implemented and documented in OpenAPI
- [ ] Branch, Warehouse, Vehicle Prisma models and migration applied
- [ ] Domain entities with operational eligibility helpers
- [ ] Repository interfaces and Prisma implementations with tenant scoping
- [ ] Zod validation on all endpoints
- [ ] Authorization matrix enforced per route
- [ ] Archived resources excluded from default lists (100% test coverage)
- [ ] Uniqueness constraints enforced per company (100% test coverage)
- [ ] Cross-company access rejected (100% test coverage)
- [ ] `npm run build`, `npm test`, `npm run lint` pass
- [ ] Quickstart scenarios validated end-to-end

## 12. Future Extensibility

| Future Feature | How P002 Supports It                                                |
| -------------- | ------------------------------------------------------------------- |
| Employees      | Stable resource IDs; assignment tables reference branch/warehouseId |
| Attendance     | Branch as attendance location reference                             |
| Transactions   | Branch/Warehouse as transaction location FK                         |
| Trips          | Vehicle ID + operational eligibility check                          |
| Expenses       | Optional FK to branch/warehouse/vehicle                             |
| Analytics      | Query by companyId, status, deletedAt for reporting                 |
| Reports        | Historical access via explicit archived queries (future endpoint)   |

No redesign required — only additive migrations and new modules referencing existing resource IDs.

## Project Structure

### Documentation (this feature)

```text
specs/003-organization-management/
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
├── branch/
├── warehouse/
└── vehicle/
src/shared/organization/
prisma/schema.prisma        # add Branch, Warehouse, Vehicle models
tests/unit|integration|api/{branch,warehouse,vehicle}/
```

## Complexity Tracking

No constitution violations. Three sibling modules are justified by distinct field models and
validation rules while sharing identical lifecycle and tenant patterns.

## Artifacts Generated

| Artifact                    | Path                                                       |
| --------------------------- | ---------------------------------------------------------- |
| Implementation plan         | `specs/003-organization-management/plan.md`                |
| Research decisions          | `specs/003-organization-management/research.md`            |
| Data model                  | `specs/003-organization-management/data-model.md`          |
| OpenAPI contracts           | `specs/003-organization-management/contracts/openapi.yaml` |
| Quickstart validation guide | `specs/003-organization-management/quickstart.md`          |
