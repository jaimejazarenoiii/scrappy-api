# Research: Reports (P009)

**Feature**: `009-reports`  
**Date**: 2026-07-09

## 1. Bounded context placement

**Decision**: Implement a new top-level `reports` module under `src/modules/reports/` following the
same Clean Architecture layout as `analytics` (P008) and operational modules.

**Rationale**: Reports are a cross-cutting **read projection** over operational data with distinct
concerns (pagination, search, export, print) that differ from Analytics aggregations. A dedicated
module prevents list/export logic from polluting operational write modules or Analytics dashboards.

**Alternatives considered**:

- Extend P008 Analytics with detail endpoints — rejected; violates separation of aggregated KPIs
  vs line-level audit records and would bloat analytics contracts.
- Embed report endpoints in each source module — rejected; duplicates filter/search/export logic
  eleven times.

## 2. Read-only architecture

**Decision**: Reports expose **GET-only** list and export routes. No Prisma `create`/`update`/`delete`
in reports infrastructure. Use cases inject `ReportsQueryRepository` (read port) and
`ReportExporter` (file generation port) only.

**Rationale**: Product spec FR-027 and plan invariant: Reports must never modify business data.
GET-only routing makes violations obvious in code review.

**Alternatives considered**:

- POST for export with filter body — deferred; query-string mirrors list requests and enables
  bookmarkable exports; POST may be added later for very large filter payloads without redesign.

## 3. Relationship to Analytics (P008)

**Decision**: **Separate modules** with shared patterns but no shared runtime dependency from
Analytics → Reports or vice versa. Optional reuse of **infrastructure where-builder helpers**
extracted to `src/shared/reporting/` if duplication becomes painful during implementation.

**Rationale**: Analytics answers “how much / who is top”; Reports answer “show me every row.”
Different response shapes, pagination, and export pipelines.

**Alternatives considered**:

- Single `insights` module — rejected; conflates two product capabilities with different SLAs.

## 4. Query repository design

**Decision**: Single domain port `ReportsQueryRepository` with paired methods per report domain:

- `listTransactionReport(filter, pagination, sort, search)` → `{ rows, total }`
- Similar for trips, expenses, attendance, leave, cash advances, payroll, employees, branches,
  warehouses, vehicles

One `ReportsPrismaQueryRepository` implements all methods using existing Prisma models with
`findMany` + `count` in parallel.

**Rationale**: Read-only module with no aggregate roots; unified query port avoids eleven parallel
repository interfaces while keeping Prisma out of the application layer.

**Alternatives considered**:

- Reuse operational `TransactionRepository.listByCompany` — rejected; list semantics tuned for
  employee apps, not report columns, search, or export column sets.

## 5. Shared filter model

**Decision**: `ReportFilter` value object in reports domain:

| Field                                                | Notes                           |
| ---------------------------------------------------- | ------------------------------- |
| companyId                                            | From auth only                  |
| from / to                                            | Required for date-bound reports |
| branchId, warehouseId, vehicleId, employeeId, tripId | Optional                        |
| transactionNumber, direction, status                 | Transaction report              |
| category, referenceType                              | Expense report                  |
| includeArchived                                      | Default false                   |

Resolved by `ReportFilterPipeline` (bounds validation) + `ReportFilterValidatorService`
(tenancy reference checks) before queries.

**Rationale**: Spec FR-012–FR-016 require consistent filtering across reports. Central pipeline
prevents per-endpoint drift.

**Alternatives considered**:

- Per-report filter types only — rejected; duplicates validation and OpenAPI schemas.

## 6. Search strategy

**Decision**: Single optional `search` query parameter per report; repository applies
case-insensitive `contains` (Prisma `mode: 'insensitive'`) on domain-specific columns:

| Report                                   | Search targets                            |
| ---------------------------------------- | ----------------------------------------- |
| Transactions                             | transactionNumber, partyName              |
| Trips                                    | tripNumber                                |
| Expenses                                 | reference label fields (when P007 exists) |
| Attendance, Leave, Cash Advance, Payroll | employee firstName + lastName             |
| Employees                                | firstName, lastName, employeeNumber       |
| Branches                                 | name                                      |
| Warehouses                               | name                                      |
| Vehicles                                 | plateNumber                               |

Minimum length: 2 characters when provided.

**Rationale**: Spec FR-017; single param keeps client UX simple; domain mapping in repository.

**Alternatives considered**:

- Dedicated `q` per field — rejected for MVP; can extend with field-scoped search later.

## 7. Sorting strategy

**Decision**: Allowlisted `sortBy` per report domain; `sortOrder` `asc` | `desc` (default `desc`
for date-bound reports, `asc` for name reports). Validated in Zod per route schema.

**Rationale**: Constitution pagination conventions; prevents SQL injection via sort fields.

## 8. Export library choices

**Decision**: Add two production dependencies for P009:

| Format | Library                                         | Rationale                                                |
| ------ | ----------------------------------------------- | -------------------------------------------------------- |
| CSV    | Native streaming (`Readable` + manual escaping) | No dependency; UTF-8 BOM for Excel compatibility         |
| Excel  | `exceljs`                                       | Mature streaming workbook writer, column formatting      |
| PDF    | `pdfkit`                                        | Streaming PDF generation, table layout control for print |

**Rationale**: Spec FR-023–FR-025 require three formats with streaming for large exports. Native CSV
minimizes deps; exceljs/pdfkit are standard Node choices with stream support.

**Alternatives considered**:

- `xlsx` (SheetJS) — rejected; heavier and less streaming-friendly for server export.
- HTML-to-PDF (Puppeteer) — rejected; operational cost and headless browser dependency.
- Single CSV-only MVP — rejected; spec explicitly requires Excel and PDF.

## 9. Export streaming and limits

**Decision**:

- Pre-count rows with same filter; if `total > 10_000`, reject with `ExportLimitExceededError`
  before streaming (spec SC-012).
- Stream export using cursor/batched `findMany` (batch size 500) to bound memory.
- List pagination unchanged (`page`/`limit`, max 100).

**Rationale**: Prevents OOM on large exports; aligns with spec assumptions.

**Alternatives considered**:

- Async job queue for large exports — deferred to Scheduled Reports future spec.

## 10. PDF / print layout

**Decision**: PDF exports use shared `PrintLayoutBuilder`:

- Header: company name, report title
- Subheader: applied filter summary (date range, entity filters, search)
- Footer: page number, generated timestamp (UTC ISO)
- Table: column headers + rows (truncate cell text with ellipsis beyond max width)

Printing = PDF export with `Content-Disposition: inline` optional query flag `disposition=inline`
vs default `attachment`.

**Rationale**: Spec printing strategy; one implementation serves print and PDF download.

## 11. Expense report without P007 schema

**Decision**: `ReportsQueryRepository.getExpenseReport` returns empty rows until `Expense` Prisma
model exists; contract and export paths remain implemented (mirrors P008 expense zero fallback).

**Rationale**: P007 may lag schema migration; Reports must not block on expense tables.

## 12. File naming convention

**Decision**: `{report-domain}-{companySlug}-{fromYYYYMMDD}-{toYYYYMMDD}-{generatedAtUnix}.{ext}`

Example: `transactions-acme-20260701-20260731-1720512000.csv`

**Rationale**: Auditable, unique, filesystem-safe filenames for downloads.

## 13. Authorization

**Decision**: Reuse P008 pattern — `assertCanAccessReports(role)` allows OWNER and MANAGER;
Employee → `ForbiddenError`. Route middleware: `authorize(['OWNER','MANAGER'])`.

**Rationale**: Spec FR-029; consistent with Analytics authorization model.

## 14. Audit logging

**Decision**: `report-audit.service` logs structured events: `report.list`, `report.export` with
companyId, userId, report domain, row count / format, filter hash (not full PII).

**Rationale**: Constitution observability; supports audit requirements in product vision.

## 15. Performance / indexes

**Decision**: Rely on existing Prisma indexes (see schema `@@index` on `companyId`, date columns,
status, foreign keys). No new migrations required for P009 core. Monitor slow queries >1s with
Pino warn logs in repository (same pattern as Analytics).

**Rationale**: Reports are read-heavy on already-indexed operational tables; premature new indexes
deferred until production profiling.

**Alternatives considered**:

- Materialized report tables — rejected; violates read-from-operational-data invariant.
