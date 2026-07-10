# Implementation Plan: P009 - Reports

**Branch**: `009-reports` | **Date**: 2026-07-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-reports/spec.md`

**Note**: This plan is the definitive technical design for Reports — not implementation code.
It follows architecture, conventions, and engineering decisions from P001–P008 without redefining them.

## Summary

Introduce a new read-only `reports` module that projects **detailed operational rows** from
existing modules (P001–P007) into eleven paginated report endpoints plus eleven export endpoints.
Shared `ReportFilter` resolution, search, sort, and validation ensure consistent scoping.
`ReportsQueryRepository` performs Prisma `findMany`/`count` reads; `ReportExporter` streams CSV,
Excel, and PDF. Owners and Managers access all reports; Employees are denied. Expense reports
return empty rows until P007 schema exists. No new database tables.

## Technical Context

**Language/Version**: TypeScript (strict mode) on Node.js LTS (≥22)

**Primary Dependencies**: Express.js, Prisma ORM, PostgreSQL, Zod, JWT (P001), Pino, Swagger/OpenAPI,
Vitest, Supertest; **new**: `exceljs` (xlsx), `pdfkit` (pdf) — see [research.md](./research.md)

**Storage**: PostgreSQL — read-only queries against existing operational tables; no Reports
persistence in P009

**Testing**: Vitest (unit/integration), Supertest (API/auth/export/validation)

**Target Platform**: Linux server (Docker); local dev via docker-compose

**Project Type**: modular REST API — new `reports` module only

**Performance Goals**: List responses under 2s p95 for pages ≤100 rows; exports stream in batches
of 500 rows; max export 10,000 rows; max date range 366 days

**Constraints**: Company tenant boundary; read-only GET routes; archived excluded by default; no
cross-company leakage; exports must match list filters

**Scale/Scope**: 1 new module, 22 GET endpoints (11 list + 11 export), 22 use cases, 1 query
repository, 3 export adapters, shared filter pipeline; no Prisma migrations for P009 core

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate                             | Pre-Design | Post-Design | Notes                                                |
| -------------------------------- | ---------- | ----------- | ---------------------------------------------------- |
| Layer boundaries                 | ✅         | ✅          | Reports domain has no Prisma imports                 |
| No business logic in controllers | ✅         | ✅          | `reports.controller` delegates to use cases          |
| Repository pattern               | ✅         | ✅          | `ReportsQueryRepository` read port                   |
| Dependency injection             | ✅         | ✅          | Wired in `src/config/container.ts`                   |
| Zod validation                   | ✅         | ✅          | `reports.schemas.ts` per domain                      |
| DTOs                             | ✅         | ✅          | Row + list response DTOs; no entity leak             |
| Standard response envelope       | ✅         | ✅          | List endpoints use `success()`; exports stream files |
| Pagination conventions           | ✅         | ✅          | `page`, `limit`, `sortBy`, `sortOrder`               |
| Security                         | ✅         | ✅          | JWT + `authorize(['OWNER','MANAGER'])`               |
| No `any`                         | ✅         | ✅          | Strict TypeScript                                    |
| Error handling                   | ✅         | ✅          | ValidationAppError, ForbiddenError, ExportLimit      |
| Logging                          | ✅         | ✅          | `report-audit.service` for list/export events        |
| Tests                            | ✅         | ✅          | Unit, integration, API, auth, export, pagination     |
| OpenAPI                          | ✅         | ✅          | `reports.openapi.ts` + `common-schemas.ts`           |
| Simplicity                       | ✅         | ✅          | Two new deps justified for Excel/PDF (see research)  |

## Project Structure

### Documentation (this feature)

```text
specs/009-reports/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/openapi.yaml
└── tasks.md              # Phase 2 — /speckit-tasks
```

### Source code (new)

```text
src/modules/reports/
├── domain/
│   ├── report-filter.ts
│   ├── report-pagination.ts
│   ├── report-sort.ts
│   ├── report-query.repository.ts      # read port + row projection types
│   └── report-authorization.policy.ts
├── application/
│   ├── dto/
│   │   ├── report-criteria.response.ts
│   │   ├── transaction-report.response.ts
│   │   ├── trip-report.response.ts
│   │   ├── expense-report.response.ts
│   │   ├── attendance-report.response.ts
│   │   ├── leave-report.response.ts
│   │   ├── cash-advance-report.response.ts
│   │   ├── payroll-report.response.ts
│   │   ├── employee-report.response.ts
│   │   ├── branch-report.response.ts
│   │   ├── warehouse-report.response.ts
│   │   └── vehicle-report.response.ts
│   ├── use-cases/
│   │   ├── list-transaction-report.use-case.ts
│   │   ├── export-transaction-report.use-case.ts
│   │   └── ... (×11 domains — list + export pairs)
│   └── services/
│       ├── report-filter-pipeline.ts
│       ├── report-filter-validator.service.ts
│       ├── report-audit.service.ts
│       └── report-export-orchestrator.service.ts
├── infrastructure/
│   ├── reports.prisma-query-repository.ts
│   ├── report-where-builders.ts
│   ├── mappers/
│   │   └── report-projection.mapper.ts
│   └── export/
│       ├── report-exporter.interface.ts
│       ├── csv-report-exporter.ts
│       ├── xlsx-report-exporter.ts
│       └── pdf-report-exporter.ts
├── presentation/
│   ├── reports.controller.ts
│   ├── reports.routes.ts
│   ├── reports.schemas.ts
│   └── reports.openapi.ts
└── index.ts

src/shared/reporting/
├── report-search.ts           # min length, trim
└── export-filename.ts         # naming convention helper

src/config/container.ts        # MOD — wire reports module
src/modules/index.ts           # MOD — register reports routes
src/swagger/openapi.builder.ts # MOD — reportsOpenApiPaths
src/swagger/common-schemas.ts  # MOD — report schemas

tests/
├── unit/reports/
├── integration/reports/
└── api/reports/
```

**Structure Decision**: Mirrors P008 Analytics read-only module; adds export adapters in
infrastructure and paired list/export use cases per domain.

## Complexity Tracking

| Addition  | Why Needed                                 | Simpler Alternative Rejected                        |
| --------- | ------------------------------------------ | --------------------------------------------------- |
| `exceljs` | Spec requires Excel export with formatting | CSV-only insufficient                               |
| `pdfkit`  | Spec requires printable PDF layouts        | HTML print without server PDF breaks API-only scope |

---

## 1. Module Architecture

### Responsibilities

| Component                      | Responsibility                                                   |
| ------------------------------ | ---------------------------------------------------------------- |
| `reports` module               | Read-only list + export, filter/search/sort, projection assembly |
| `ReportFilter`                 | Canonical scope (dates, org filters, domain filters, tenancy)    |
| `ReportFilterPipeline`         | Parse query → validate bounds → build filter VO                  |
| `ReportFilterValidatorService` | Tenancy checks on branch/warehouse/vehicle/employee/trip         |
| `ReportsQueryRepository`       | Domain read port for all list projections + counts               |
| `ReportsPrismaQueryRepository` | Prisma findMany/count implementations                            |
| `ReportExporter`               | Stream CSV/XLSX/PDF from row iterator                            |
| `report-authorization.policy`  | Owner/Manager allow; Employee deny                               |
| List/export use cases (×22)    | Orchestrate filter → query → DTO or stream                       |

### Read-only architecture

```text
HTTP GET (list)  → controller → list use case → ReportsQueryRepository → operational tables
HTTP GET (export)→ controller → export use case → ReportsQueryRepository (batched)
                                              → ReportExporter → response stream
```

- **No** `POST`/`PATCH`/`DELETE` report routes.
- **No** `prisma.*.create/update/delete` in reports infrastructure.
- Use cases MUST NOT call operational write use cases.

### Why Reports never modifies operational data

1. **Product invariant** — Reports are audit/read surfaces (spec FR-027).
2. **Lifecycle integrity** — Settlement, payroll, trip state changes stay in owning modules.
3. **Audit clarity** — All mutations traceable to operational endpoints only.
4. **Security** — Read-only reduces attack surface vs combined read/write APIs.
5. **Historical accuracy** — Reports reflect operational truth at query time without side effects.

### Projection strategy

- **Row-level DTOs** assembled in `report-projection.mapper.ts` from Prisma includes/joins.
- **Labels resolved in infrastructure** (employee display names, branch names, user emails) to keep
  application layer free of Prisma types.
- **Nested collections** (transaction items, trip members) embedded in parent row for list and
  flattened in CSV/Excel (one row per item optional future; MVP: parent row with serialized items
  column or nested JSON column in CSV).

### Dependencies (read-only)

| Module                                           | Usage                                       |
| ------------------------------------------------ | ------------------------------------------- |
| `company`                                        | Tenant via auth; company name in PDF header |
| `user`                                           | createdBy / paidBy / issuedBy labels        |
| `employee`                                       | Names, profile report, assignment labels    |
| `branch`, `warehouse`, `vehicle`                 | Filters, labels, org reports                |
| `transaction`                                    | Transaction report rows                     |
| `trip`                                           | Trip report rows                            |
| `attendance`, `leave`, `cash-advance`, `payroll` | Workforce reports                           |
| `expense`                                        | Expense rows (P007; empty until schema)     |

Reports MUST NOT import operational **use cases**. Filter validation MAY use operational
**repositories** (`findById`) via validator service (same as Analytics).

### Shared services

| Service                   | Location               | Purpose                        |
| ------------------------- | ---------------------- | ------------------------------ |
| `report-filter-pipeline`  | reports application    | Bounds + VO assembly           |
| `report-filter-validator` | reports application    | Tenancy reference checks       |
| `report-audit`            | reports application    | Structured read/export logging |
| `report-search`           | `src/shared/reporting` | Search trim + min length       |
| `export-filename`         | `src/shared/reporting` | Download naming                |

---

## 2. Report Design

All monetary values: **PHP**, 2 decimal places. Datetimes: ISO 8601 UTC in API; localized display
is client concern. See [data-model.md](./data-model.md) for field-level mapping.

### Transaction Report

**Purpose**: Auditable line-level transaction history with settlement context.

**Returned fields**: transactionNumber, direction, status, party (+ contact), assignedEmployees[],
location { type, label, ids }, items[], grandTotal, settlement { submittedAt, submittedBy,
paidAt, paidBy, paymentReference }, createdBy, createdAt.

**Default sort**: `transactionDate` desc. **Search**: transactionNumber, partyName.

### Trip Report

**Purpose**: Field operation audit trail.

**Fields**: tripNumber, vehicle { plateNumber, description }, members[] { name, role }, status,
scheduledStart, actualStart, actualEnd, origin, destination.

**Default sort**: scheduledStart desc. **Search**: tripNumber.

### Expense Report

**Purpose**: Spend audit by category and reference.

**Fields**: category, amount, referenceType, reference, addedBy, date.

**Default sort**: date desc. **P007**: empty list when Expense model absent.

### Attendance Report

**Purpose**: Time worked audit.

**Fields**: employee, date (from timeInAt), timeIn, timeOut, status (OPEN/CLOSED).

**Default sort**: timeInAt desc. **Search**: employee name.

### Leave Report

**Purpose**: Time off audit.

**Fields**: employee, leaveType, leaveDate (+ status for audit column in export).

**Default sort**: leaveDate desc.

### Cash Advance Report

**Purpose**: Advance issuance audit.

**Fields**: employee, amount, issuedBy, issuedAt.

**Default sort**: createdAt desc.

### Payroll Report

**Purpose**: Pay period audit.

**Fields**: employee, payrollPeriod { start, end }, salary (gross), cashAdvanceDeduction,
totalAmount (netPay), status, paidBy, paidAt.

**Filter**: pay period overlap with `[from, to]`. **Default sort**: payPeriodStart desc.

### Employee Report

**Purpose**: Workforce roster / profile audit.

**Fields**: employeeNumber, names, contactNumber, weeklySalary, status, linkedUserEmail,
createdAt, displayName.

**Date filter**: optional on createdAt. **Default sort**: lastName asc.

### Branch Report

**Purpose**: Branch registry and operational context.

**Fields**: name, address, contactNumber, status, createdAt, updatedAt,
transactionCountInPeriod (when date range applied).

**Default sort**: name asc. **Search**: name.

### Warehouse Report

**Purpose**: Warehouse registry and operational context.

**Fields**: name, address, contactNumber, status, createdAt, updatedAt,
transactionCountInPeriod (when date range applied).

**Default sort**: name asc.

### Vehicle Report

**Purpose**: Fleet registry and utilization context.

**Fields**: plateNumber, description, status, createdAt, updatedAt,
tripCountInPeriod (when date range applied).

**Default sort**: plateNumber asc. **Search**: plateNumber.

---

## 3. Query Design

### Searching

- Optional `search` query param; validated min length 2.
- Repository applies OR across domain-specific columns (case-insensitive).
- Combined with AND against filter predicates.

### Filtering

Shared builder functions in `report-where-builders.ts`:

- `buildTransactionReportWhere(filter, search)`
- `buildTripReportWhere(filter, search)`
- etc.

Consistent predicates:

- `companyId` always
- `deletedAt: null` unless `includeArchived`
- Date range on domain date column (see data-model.md)
- Optional entity filters (branchId, warehouseId, …)
- Domain enums (direction, status, category, referenceType)

### Sorting

Allowlisted `sortBy` per report in Zod schema. Repository maps to Prisma `orderBy`. Secondary
sort by `id` for stable pagination.

### Pagination

- `page` (1-based), `limit` (default 20, max 100).
- Parallel `findMany` + `count` with identical `where`.
- Response `meta`: `{ page, limit, total, totalPages }`.

### Date range

- Required for transaction, trip, expense, attendance, leave, cash advance, payroll reports.
- Optional for employee, branch, warehouse, vehicle (all current records when omitted).
- Max span 366 days when provided.

### Projection strategy

- Use Prisma `include` for relations (items, assignments, members, employee, vehicle).
- Map to DTOs in infrastructure mapper; application use cases receive typed projections only.

### Reusable query services

| Service                        | Role                                        |
| ------------------------------ | ------------------------------------------- |
| `ReportFilterPipeline`         | Single entry: query params → `ReportFilter` |
| `ReportFilterValidatorService` | Entity existence + tenancy                  |
| `ReportsQueryRepository`       | All list/count queries                      |

### Performance considerations

- Select only columns needed for DTOs.
- Batch export reads with `take: 500` cursor pagination.
- Warn log when query duration > 1000ms.
- Rely on existing indexes (`companyId` + date/status FK indexes).

---

## 4. Export Strategy

### CSV

- UTF-8 with BOM for Excel compatibility.
- Header row = column labels.
- Stream via `Readable`; escape commas/quotes.
- `Content-Type: text/csv`

### Excel

- `exceljs` streaming workbook writer.
- Header row styled (bold); column widths auto.
- `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

### PDF

- `pdfkit` document stream.
- Uses `PrintLayoutBuilder` (headers, footers, page numbers).
- `Content-Type: application/pdf`
- Query `disposition=inline` for browser print preview.

### Streaming large exports

1. Count rows; if > 10_000 → `ExportLimitExceededError` (422).
2. Iterate batches of 500 from repository.
3. Pipe to exporter stream without loading full dataset in memory.

### File naming

`{domain}-{companySlug}-{fromYYYYMMDD}-{toYYYYMMDD}-{unixTs}.{ext}`

### Export permissions

Same as list: Owner + Manager only; same filter validation path.

### Future extensibility

`ReportExporter` interface + format registry map (`format` → exporter). New formats register
without changing use cases.

---

## 5. Printing Strategy

Printing is fulfilled by **PDF export** with print-optimized layout:

| Element   | Content                                                  |
| --------- | -------------------------------------------------------- |
| Header    | Company name, report title (e.g. "Transaction Report")   |
| Subheader | Date range, applied filters, search term                 |
| Table     | Column headers + rows (paginated across PDF pages)       |
| Footer    | Page X of Y, generated timestamp (UTC)                   |
| Branding  | Company name from `Company` record (no logo in P009 MVP) |

Optional `disposition=inline` serves PDF for browser print dialog.

---

## 6. API Design

URI prefix: `/api/v1/reports`. All list endpoints return standard envelope with `data.items` +
`data.appliedCriteria` + `data.generatedAt` + `meta` pagination.

Shared query params documented in [contracts/openapi.yaml](./contracts/openapi.yaml).

### Summary table

| Domain        | List URI                     | Export URI                          |
| ------------- | ---------------------------- | ----------------------------------- |
| Transactions  | GET `/reports/transactions`  | GET `/reports/transactions/export`  |
| Trips         | GET `/reports/trips`         | GET `/reports/trips/export`         |
| Expenses      | GET `/reports/expenses`      | GET `/reports/expenses/export`      |
| Attendance    | GET `/reports/attendance`    | GET `/reports/attendance/export`    |
| Leave         | GET `/reports/leave`         | GET `/reports/leave/export`         |
| Cash Advances | GET `/reports/cash-advances` | GET `/reports/cash-advances/export` |
| Payroll       | GET `/reports/payroll`       | GET `/reports/payroll/export`       |
| Employees     | GET `/reports/employees`     | GET `/reports/employees/export`     |
| Branches      | GET `/reports/branches`      | GET `/reports/branches/export`      |
| Warehouses    | GET `/reports/warehouses`    | GET `/reports/warehouses/export`    |
| Vehicles      | GET `/reports/vehicles`      | GET `/reports/vehicles/export`      |

### Per-endpoint contract pattern

**List**

- Purpose: Paginated detailed rows for domain.
- Method: `GET`
- Request: Shared filters + `search`, `sortBy`, `sortOrder`, `page`, `limit`, `includeArchived`
- Response: `{ items: Row[], appliedCriteria, generatedAt }` + meta pagination
- Errors: 401, 403, 400 validation, 404 foreign filter entity

**Export**

- Purpose: Download filtered rows as file.
- Method: `GET`
- Request: Same as list + `format=csv|xlsx|pdf` + optional `disposition=inline|attachment`
- Response: File stream with `Content-Disposition`
- Errors: above + 422 export limit exceeded

(Full OpenAPI in `contracts/openapi.yaml`.)

---

## 7. Validation Design

Zod schemas in `reports.schemas.ts`:

| Schema                         | Validates                                             |
| ------------------------------ | ----------------------------------------------------- |
| `reportDateRangeSchema`        | from, to, max 366 days, to >= from                    |
| `reportPaginationSchema`       | page ≥ 1, limit 1–100                                 |
| `reportSearchSchema`           | optional, min 2 chars                                 |
| `reportSortSchema`             | allowlisted sortBy per domain                         |
| `reportExportSchema`           | format enum, disposition optional                     |
| `transactionReportQuerySchema` | combines above + direction, status, transactionNumber |
| `expenseReportQuerySchema`     | + category, referenceType                             |
| … per domain                   |                                                       |

### Reusable validators

- `reportFilterQueryBase` — shared entity IDs, includeArchived
- `validateReportDateRange` superRefine
- Export schema extends list schema

### Business validation

- `assertCanAccessReports(role)` in use case entry
- `ReportFilterValidatorService.validateReferences(filter)` before query
- Export orchestrator re-validates row count limit

---

## 8. Authorization Matrix

| Resource                    | Owner | Manager | Employee |
| --------------------------- | ----- | ------- | -------- |
| All report list endpoints   | ✅    | ✅      | ❌ 403   |
| All report export endpoints | ✅    | ✅      | ❌ 403   |

Employees have **no** company report access in P009. Future role-based reports may extend policy
without changing repository layer.

---

## 9. Business Rules

- Reports are read-only (no mutations).
- Data scoped to authenticated `companyId` only.
- Exports use identical filters/search/sort as list request.
- Archived records excluded unless `includeArchived=true`.
- Results reflect operational data at request time (historically accurate snapshot read).
- Search + filter predicates combine with AND semantics across all reports.
- Cancelled transactions appear when status filter includes them; no special hidden exclusion
  beyond archived flag.

---

## 10. Performance Strategy

| Concern            | Strategy                                               |
| ------------------ | ------------------------------------------------------ |
| Pagination         | Default limit 20; max 100; count query parallelized    |
| Large datasets     | Indexed filters; batch export 500 rows                 |
| Streaming exports  | Node Readable → response pipe                          |
| Indexes            | Use existing Prisma schema indexes; no P009 migrations |
| Caching            | None in MVP (operational accuracy > stale cache)       |
| Query optimization | Select minimal fields; avoid N+1 via includes          |
| Slow queries       | Log warn > 1s with report domain + companyId           |

---

## 11. Error Scenarios

| Scenario                   | HTTP | Error                                               |
| -------------------------- | ---- | --------------------------------------------------- |
| Invalid date range         | 400  | ValidationAppError                                  |
| Range > 366 days           | 400  | ValidationAppError                                  |
| Unknown sort field         | 400  | ValidationAppError                                  |
| Search too short           | 400  | ValidationAppError                                  |
| Foreign branch/employee ID | 404  | ResourceNotFoundError                               |
| Employee access            | 403  | ForbiddenError                                      |
| Unauthenticated            | 401  | Unauthorized                                        |
| Export > 10k rows          | 422  | ExportLimitExceededError                            |
| Unsupported format         | 400  | ValidationAppError                                  |
| Cross-company data         | —    | Prevented by companyId predicate (0 rows, not leak) |

---

## 12. Swagger Design

- **Tag**: `Reports`
- **Schemas**: `ReportFilterQuery`, `AppliedReportCriteria`, `ReportPaginationMeta`, each `*ReportRow`,
  `*ReportListResponse`, `ExportFormat` enum
- **Parameters**: Reusable `reportDateRangeParams`, `reportEntityFilterParams`, `reportPaginationParams`,
  `reportSearchParam`, `reportSortParams`, `exportFormatParam`
- **List responses**: Standard envelope referencing row list schemas
- **Export responses**: `content` types for csv, xlsx, pdf binary
- **Examples**: Transaction list with filters; export CSV
- **Errors**: Reference common 400/401/403/404/422 responses

Registered via `reportsOpenApiPaths` in `openapi.builder.ts`.

---

## 13. Testing Strategy

### Unit tests

- `ReportFilterPipeline` date bounds
- Zod schemas (range, search, sort, export format)
- `assertCanAccessReports`
- Export filename helper
- CSV escaping, row batching logic (mock repository iterator)

### Integration tests

- `ReportsPrismaQueryRepository` per domain against seeded DB or in-memory adapter
- Filter + search + sort combinations
- Archived exclusion
- Payroll period overlap

### API tests (Supertest)

- Auth: Employee 403 on all 22 routes
- Owner/Manager 200 list each domain
- Validation failures (bad range, bad sort)
- Tenant isolation (foreign filter ID)
- Export Content-Type and Content-Disposition headers
- Export limit exceeded
- Pagination meta correctness
- Empty result 200

### Large dataset tests

- Soft timing assertion on 1000-row in-memory export (integration)

---

## 14. Acceptance Criteria (Engineering)

- **AC-001**: All 11 list endpoints return required columns per spec with pagination meta.
- **AC-002**: All 11 export endpoints produce valid CSV, XLSX, and PDF for same filter set.
- **AC-003**: 100% Employee report attempts return 403.
- **AC-004**: Zero cross-company rows in any report response.
- **AC-005**: Export row count matches list `total` when total ≤ 10,000.
- **AC-006**: Export requests with total > 10,000 return 422 without file body.
- **AC-007**: Invalid date range returns 400 before query execution.
- **AC-008**: `includeArchived=false` excludes soft-deleted operational rows.
- **AC-009**: No report route accepts POST/PATCH/DELETE.
- **AC-010**: OpenAPI documents all 22 endpoints with shared parameters.
- **AC-011**: PDF includes header filter summary and page numbers.
- **AC-012**: Expense report returns 200 with empty items when P007 schema absent.

---

## 15. Future Extensibility

The module supports extension without redesign:

| Future feature     | Extension point                                       |
| ------------------ | ----------------------------------------------------- |
| Scheduled Reports  | New job runner calls existing export use cases        |
| Saved Filters      | Persist `ReportFilter` JSON; replay through pipeline  |
| Email Reports      | Attach export stream from orchestrator                |
| Custom Reports     | New row projection + query method on repository port  |
| Role-based Reports | Extend `report-authorization.policy`                  |
| BI Integration     | Read same repository port or DB views; no write paths |

Core invariants preserved: read-only, company-tenanted, filter → query → project/export pipeline.
