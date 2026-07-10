---
description: 'Task list for Reports (P009) feature'
---

# Tasks: P009 - Reports

**Input**: Design documents from `/specs/009-reports/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md; P001–P008 operational modules implemented and passing

**Tests**: Included — the specification and plan explicitly require unit, integration, API, authorization, validation, export, pagination, and tenant-isolation coverage using Vitest and Supertest.

**Organization**: Tasks introduce a new read-only `reports` module with shared filter/export infrastructure and twenty-two GET endpoints (eleven list + eleven export). Foundational work blocks all stories. Each user story phase is independently testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: `US1` = Transaction Report, `US2` = Trip & Expense Reports, `US3` = Workforce & Payroll Reports, `US4` = Export & Print, `US5` = Organization Reference Reports

## Path Conventions

P009 follows Scrappy API Clean Architecture:

- **Module**: `src/modules/reports/{domain,application,infrastructure,presentation}/`
- **Shared**: `src/shared/reporting/`
- **Cross-module wiring**: `src/modules/index.ts`, `src/config/container.ts`
- **Swagger**: `src/swagger/common-schemas.ts`, `src/modules/reports/presentation/reports.openapi.ts`, `src/swagger/openapi.builder.ts`, `docs/api-reference.md`
- **Tests**: `tests/unit/reports/`, `tests/integration/reports/`, `tests/api/reports/`, `tests/setup/`
- **Schema**: No new Prisma models for P009 (read-only queries against existing tables)

---

## Phase 1: Setup (Shared Scaffolding)

**Purpose**: Create the Reports module skeleton, install export dependencies, shared helpers, and dedicated test areas.

- [x] T001 Create the Reports module directory structure and `src/modules/reports/index.ts`
- [x] T002 Add `exceljs` and `pdfkit` (and `@types/pdfkit` if needed) to `package.json` and install via pnpm
- [x] T003 [P] Create Reports domain file placeholders in `src/modules/reports/domain/report-filter.ts`, `src/modules/reports/domain/report-pagination.ts`, `src/modules/reports/domain/report-sort.ts`, `src/modules/reports/domain/report-query.repository.ts`, and `src/modules/reports/domain/report-authorization.policy.ts`
- [x] T004 [P] Create Reports application service placeholders in `src/modules/reports/application/services/report-filter-pipeline.ts`, `src/modules/reports/application/services/report-filter-validator.service.ts`, `src/modules/reports/application/services/report-audit.service.ts`, and `src/modules/reports/application/services/report-export-orchestrator.service.ts`
- [x] T005 [P] Create Reports list/export use-case placeholders for all eleven domains in `src/modules/reports/application/use-cases/` (e.g. `list-transaction-report.use-case.ts`, `export-transaction-report.use-case.ts`, …)
- [x] T006 [P] Create Reports DTO placeholders in `src/modules/reports/application/dto/report-criteria.response.ts`, `transaction-report.response.ts`, `trip-report.response.ts`, `expense-report.response.ts`, `attendance-report.response.ts`, `leave-report.response.ts`, `cash-advance-report.response.ts`, `payroll-report.response.ts`, `employee-report.response.ts`, `branch-report.response.ts`, `warehouse-report.response.ts`, and `vehicle-report.response.ts`
- [x] T007 [P] Create Reports infrastructure and presentation placeholders in `src/modules/reports/infrastructure/reports.prisma-query-repository.ts`, `src/modules/reports/infrastructure/report-where-builders.ts`, `src/modules/reports/infrastructure/mappers/report-projection.mapper.ts`, `src/modules/reports/infrastructure/export/report-exporter.interface.ts`, `csv-report-exporter.ts`, `xlsx-report-exporter.ts`, `pdf-report-exporter.ts`, `src/modules/reports/presentation/reports.controller.ts`, `reports.routes.ts`, `reports.schemas.ts`, and `reports.openapi.ts`
- [x] T008 [P] Create shared reporting helpers in `src/shared/reporting/report-search.ts` and `src/shared/reporting/export-filename.ts`, and Reports test directories under `tests/unit/reports/`, `tests/integration/reports/`, and `tests/api/reports/`

**Checkpoint**: Module scaffolding exists for implementation and testing.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared filter model, read query port, validation, authorization, export adapters, routing, DI, OpenAPI base, and test infrastructure required by all user stories.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [x] T009 [P] Implement `ReportFilter` value object with factory from validated query in `src/modules/reports/domain/report-filter.ts`
- [x] T010 [P] Implement `ReportPagination` and `ReportSort` types with defaults in `src/modules/reports/domain/report-pagination.ts` and `src/modules/reports/domain/report-sort.ts`
- [x] T011 [P] Define read-only `ReportsQueryRepository` port with list/count method signatures for all eleven domains in `src/modules/reports/domain/report-query.repository.ts`
- [x] T012 [P] Implement `assertCanAccessReports` policy for Owner/Manager allow and Employee deny in `src/modules/reports/domain/report-authorization.policy.ts`
- [x] T013 Implement `ReportFilterPipeline` for date bounds (max 366 days), optional org filters, and `ReportFilter` assembly in `src/modules/reports/application/services/report-filter-pipeline.ts`
- [x] T014 Implement `ReportFilterValidatorService` for tenancy checks on branch, warehouse, vehicle, employee, and trip IDs in `src/modules/reports/application/services/report-filter-validator.service.ts`
- [x] T015 [P] Implement `report-audit.service.ts` structured read/export logging in `src/modules/reports/application/services/report-audit.service.ts`
- [x] T016 [P] Implement search trim and minimum-length helpers in `src/shared/reporting/report-search.ts`
- [x] T017 [P] Implement export filename builder per naming convention in `src/shared/reporting/export-filename.ts`
- [x] T018 [P] Implement `AppliedReportCriteria` and list response meta helpers in `src/modules/reports/application/dto/report-criteria.response.ts`
- [x] T019 [P] Implement base Zod schemas (`reportDateRangeSchema`, `reportPaginationSchema`, `reportSearchSchema`, `reportSortSchema`, `reportExportSchema`, `reportFilterQueryBase`) in `src/modules/reports/presentation/reports.schemas.ts`
- [x] T020 Implement shared Prisma where-builder helpers for company scope and archived exclusion in `src/modules/reports/infrastructure/report-where-builders.ts`
- [x] T021 [P] Implement `ReportProjectionMapper` for decimal rounding and label resolution in `src/modules/reports/infrastructure/mappers/report-projection.mapper.ts`
- [x] T022 Implement `ReportsPrismaQueryRepository` class skeleton implementing `ReportsQueryRepository` with not-implemented stubs in `src/modules/reports/infrastructure/reports.prisma-query-repository.ts`
- [x] T023 [P] Implement `ReportExporter` interface and format registry in `src/modules/reports/infrastructure/export/report-exporter.interface.ts`
- [x] T024 [P] Implement `CsvReportExporter` with UTF-8 BOM, header row, and CSV escaping in `src/modules/reports/infrastructure/export/csv-report-exporter.ts`
- [x] T025 [P] Implement `XlsxReportExporter` with exceljs streaming writer and styled headers in `src/modules/reports/infrastructure/export/xlsx-report-exporter.ts`
- [x] T026 [P] Implement `PdfReportExporter` with pdfkit print layout (header, subheader, table, footer, page numbers) in `src/modules/reports/infrastructure/export/pdf-report-exporter.ts`
- [x] T027 Implement `ReportExportOrchestratorService` with 10k row limit check, batch iterator (500 rows), and format dispatch in `src/modules/reports/application/services/report-export-orchestrator.service.ts`
- [x] T028 [P] Add `ExportLimitExceededError` to shared errors (e.g. `src/shared/errors/export-limit-exceeded.error.ts`) and wire into export orchestrator
- [x] T029 [P] Implement `ReportsController` method signatures for twenty-two GET handlers in `src/modules/reports/presentation/reports.controller.ts`
- [x] T030 Implement `createReportsRoutes()` with GET-only routes and `authorize(['OWNER','MANAGER'])` in `src/modules/reports/presentation/reports.routes.ts`
- [x] T031 [P] Add Reports base schemas to `src/swagger/common-schemas.ts` (`ReportFilterQuery`, `AppliedReportCriteria`, `ReportPaginationMeta`, `ExportFormat`, row list response types)
- [x] T032 [P] Implement base Reports OpenAPI path declarations and shared parameters in `src/modules/reports/presentation/reports.openapi.ts`
- [x] T033 Register `reportsOpenApiPaths` in `src/swagger/openapi.builder.ts`
- [x] T034 Wire Reports controller builder and exports in `src/modules/reports/index.ts` and `src/config/container.ts`
- [x] T035 Register Reports routes in `src/modules/index.ts`
- [x] T036 [P] Add `InMemoryReportsQueryRepository` for unit/API tests in `tests/setup/in-memory-repositories.ts`
- [x] T037 [P] Extend `tests/setup/test-app.ts` and `tests/setup/auth-helpers.ts` for Owner/Manager/Employee reports scenarios
- [x] T038 [P] Add foundational unit tests for filter pipeline date bounds in `tests/unit/reports/report-filter-pipeline.test.ts`
- [x] T039 [P] Add foundational unit tests for schema refinements in `tests/unit/reports/report-schemas.test.ts`
- [x] T040 [P] Add foundational unit tests for authorization policy in `tests/unit/reports/report-authorization.test.ts`
- [x] T041 [P] Add foundational unit tests for CSV escaping and export filename in `tests/unit/reports/report-export-helpers.test.ts`
- [x] T042 [P] Add foundational API test for Employee denied on all twenty-two report routes in `tests/api/reports/reports-auth.api.test.ts`

**Checkpoint**: Shared filter infrastructure, export stack, read port, routes, DI, OpenAPI base, and auth denial are ready.

---

## Phase 3: User Story 1 - Owner Audits Transaction History (Priority: P1) 🎯 MVP

**Goal**: Deliver `GET /api/v1/reports/transactions` and `GET /api/v1/reports/transactions/export` with full transaction row projections, pagination, search, sort, and CSV/XLSX/PDF export.

**Independent Test**: Owner requests Transaction Report for a custom date range with branch filter; paginated rows with transaction number, direction, status, party, items, totals, settlement, and creator return for their company only; Employee receives 403; export matches filtered list within limits.

### Tests for User Story 1

- [x] T043 [P] [US1] Create API tests for transaction list success, filters, search, pagination, and Employee 403 in `tests/api/reports/transaction-report.api.test.ts`
- [x] T044 [P] [US1] Create API tests for transaction export Content-Type, Content-Disposition, and format validation in `tests/api/reports/transaction-report-export.api.test.ts`
- [x] T045 [P] [US1] Create unit tests for transaction where-builder and sort allowlist in `tests/unit/reports/transaction-report-query.test.ts`
- [x] T046 [P] [US1] Create integration tests for transaction list projection against seeded data in `tests/integration/reports/transaction-report.persistence.test.ts`

### Implementation for User Story 1

- [x] T047 [US1] Implement `buildTransactionReportWhere` with direction, status, branch, search, and date range in `src/modules/reports/infrastructure/report-where-builders.ts`
- [x] T048 [US1] Implement `listTransactionReport` and `countTransactionReport` in `src/modules/reports/infrastructure/reports.prisma-query-repository.ts`
- [x] T049 [US1] Implement `TransactionReportResponseDto` builder in `src/modules/reports/application/dto/transaction-report.response.ts`
- [x] T050 [US1] Implement `transactionReportQuerySchema` with domain-specific filters in `src/modules/reports/presentation/reports.schemas.ts`
- [x] T051 [US1] Implement `ListTransactionReportUseCase` orchestrating filter → validate → audit → query → DTO in `src/modules/reports/application/use-cases/list-transaction-report.use-case.ts`
- [x] T052 [US1] Implement `ExportTransactionReportUseCase` reusing filter path and export orchestrator in `src/modules/reports/application/use-cases/export-transaction-report.use-case.ts`
- [x] T053 [US1] Complete `listTransactions` and `exportTransactions` controller handlers and route bindings in `src/modules/reports/presentation/reports.controller.ts` and `src/modules/reports/presentation/reports.routes.ts`
- [x] T054 [US1] Update transaction report OpenAPI paths, row schema, and examples in `src/modules/reports/presentation/reports.openapi.ts`

**Checkpoint**: Transaction report list and export are fully functional and independently testable (MVP).

---

## Phase 4: User Story 2 - Manager Reviews Trip and Expense Records (Priority: P2)

**Goal**: Deliver Trip and Expense report list + export endpoints with vehicle/trip filters, search, and pagination.

**Independent Test**: Manager requests Trip Report and Expense Report for This Month; trip rows include trip number, vehicle, members, schedule/actual times; expense rows include category, amount, reference, added-by (empty list when P007 schema absent); exports succeed for all three formats.

### Tests for User Story 2

- [x] T055 [P] [US2] Create API tests for trip list filters, search, and pagination in `tests/api/reports/trip-report.api.test.ts`
- [x] T056 [P] [US2] Create API tests for expense list empty-state when P007 absent and 200 success in `tests/api/reports/expense-report.api.test.ts`
- [x] T057 [P] [US2] Create integration tests for trip projection with members and vehicle in `tests/integration/reports/trip-report.persistence.test.ts`
- [x] T058 [P] [US2] Create unit tests for trip and expense where-builders in `tests/unit/reports/trip-expense-report-query.test.ts`

### Implementation for User Story 2

- [x] T059 [US2] Implement `buildTripReportWhere` and `buildExpenseReportWhere` in `src/modules/reports/infrastructure/report-where-builders.ts`
- [x] T060 [US2] Implement trip list/count query methods in `src/modules/reports/infrastructure/reports.prisma-query-repository.ts`
- [x] T061 [US2] Implement expense list/count returning empty results when P007 Expense model is absent in `src/modules/reports/infrastructure/reports.prisma-query-repository.ts`
- [x] T062 [P] [US2] Implement `TripReportResponseDto` and `ExpenseReportResponseDto` in `src/modules/reports/application/dto/trip-report.response.ts` and `expense-report.response.ts`
- [x] T063 [P] [US2] Implement `tripReportQuerySchema` and `expenseReportQuerySchema` in `src/modules/reports/presentation/reports.schemas.ts`
- [x] T064 [US2] Implement `ListTripReportUseCase` and `ExportTripReportUseCase` in `src/modules/reports/application/use-cases/list-trip-report.use-case.ts` and `export-trip-report.use-case.ts`
- [x] T065 [US2] Implement `ListExpenseReportUseCase` and `ExportExpenseReportUseCase` in `src/modules/reports/application/use-cases/list-expense-report.use-case.ts` and `export-expense-report.use-case.ts`
- [x] T066 [US2] Complete trip and expense controller handlers, routes, and OpenAPI paths in `src/modules/reports/presentation/reports.controller.ts`, `reports.routes.ts`, and `reports.openapi.ts`

**Checkpoint**: Trip and Expense reports are independently testable.

---

## Phase 5: User Story 3 - Manager Reviews Workforce and Payroll Records (Priority: P3)

**Goal**: Deliver Attendance, Leave, Cash Advance, and Payroll report list + export endpoints with employee filters, search, and pay-period overlap logic.

**Independent Test**: Manager requests all four workforce reports for a date range; rows include required audit columns per spec; payroll includes pay-period overlap; exports match list filters.

### Tests for User Story 3

- [x] T067 [P] [US3] Create API tests for attendance and leave list endpoints in `tests/api/reports/attendance-leave-report.api.test.ts`
- [x] T068 [P] [US3] Create API tests for cash advance and payroll list endpoints in `tests/api/reports/cash-advance-payroll-report.api.test.ts`
- [x] T069 [P] [US3] Create integration tests for payroll pay-period overlap filtering in `tests/integration/reports/payroll-report.persistence.test.ts`
- [x] T070 [P] [US3] Create unit tests for workforce where-builders and sort allowlists in `tests/unit/reports/workforce-report-query.test.ts`

### Implementation for User Story 3

- [x] T071 [US3] Implement `buildAttendanceReportWhere`, `buildLeaveReportWhere`, `buildCashAdvanceReportWhere`, and `buildPayrollReportWhere` in `src/modules/reports/infrastructure/report-where-builders.ts`
- [x] T072 [US3] Implement attendance, leave, cash advance, and payroll list/count query methods in `src/modules/reports/infrastructure/reports.prisma-query-repository.ts`
- [x] T073 [P] [US3] Implement workforce DTOs in `src/modules/reports/application/dto/attendance-report.response.ts`, `leave-report.response.ts`, `cash-advance-report.response.ts`, and `payroll-report.response.ts`
- [x] T074 [P] [US3] Implement workforce query schemas in `src/modules/reports/presentation/reports.schemas.ts`
- [x] T075 [US3] Implement list use cases for attendance, leave, cash advance, and payroll in `src/modules/reports/application/use-cases/`
- [x] T076 [US3] Implement export use cases for attendance, leave, cash advance, and payroll in `src/modules/reports/application/use-cases/`
- [x] T077 [US3] Complete workforce controller handlers, routes, and OpenAPI paths in `src/modules/reports/presentation/reports.controller.ts`, `reports.routes.ts`, and `reports.openapi.ts`

**Checkpoint**: All workforce and payroll reports are independently testable.

---

## Phase 6: User Story 4 - Owner Exports and Prints Filtered Reports (Priority: P4)

**Goal**: Validate export/print behavior across report domains — format validation, export row limits, list/export parity, PDF print layout, and streaming large datasets.

**Independent Test**: Owner applies filters to Payroll Report, exports to Excel, and receives the same rows as the on-screen list (within 10k limit); unsupported format returns 400; export exceeding 10k rows returns 422; PDF includes filter summary and page numbers.

### Tests for User Story 4

- [x] T078 [P] [US4] Create API tests for unsupported export format and disposition validation in `tests/api/reports/report-export-validation.api.test.ts`
- [x] T079 [P] [US4] Create API tests for export limit exceeded (422) across domains in `tests/api/reports/report-export-limit.api.test.ts`
- [x] T080 [P] [US4] Create API tests verifying export row count matches list `total` when total ≤ 10,000 in `tests/api/reports/report-export-parity.api.test.ts`
- [x] T081 [P] [US4] Create unit tests for PDF print layout builder (header, filters, page numbers) in `tests/unit/reports/pdf-print-layout.test.ts`
- [x] T082 [P] [US4] Create integration test for 1000-row in-memory export streaming with soft timing assertion in `tests/integration/reports/report-export-performance.test.ts`

### Implementation for User Story 4

- [x] T083 [US4] Finalize `ReportExportOrchestratorService` batch streaming and identical filter reuse for all export use cases in `src/modules/reports/application/services/report-export-orchestrator.service.ts`
- [x] T084 [US4] Ensure PDF exporter includes company name, report title, applied filters, and page X of Y footer in `src/modules/reports/infrastructure/export/pdf-report-exporter.ts`
- [x] T085 [US4] Wire `disposition=inline|attachment` handling and Content-Disposition headers in `src/modules/reports/presentation/reports.controller.ts`
- [x] T086 [US4] Add export audit events for all export use cases via `report-audit.service.ts`

**Checkpoint**: Export and print behavior is validated and consistent across all implemented report domains.

---

## Phase 7: User Story 5 - Manager Browses Organization Reference Reports (Priority: P5)

**Goal**: Deliver Employee, Branch, Warehouse, and Vehicle report list + export endpoints with optional date range, search, sort, and period-scoped counts.

**Independent Test**: Manager requests all four organization reports with search and sort; profile and operational information rows return for the company; exports succeed for CSV, XLSX, and PDF.

### Tests for User Story 5

- [x] T087 [P] [US5] Create API tests for employee and branch list endpoints with search in `tests/api/reports/employee-branch-report.api.test.ts`
- [x] T088 [P] [US5] Create API tests for warehouse and vehicle list endpoints with search in `tests/api/reports/warehouse-vehicle-report.api.test.ts`
- [x] T089 [P] [US5] Create integration tests for `transactionCountInPeriod` and `tripCountInPeriod` aggregations in `tests/integration/reports/organization-report.persistence.test.ts`
- [x] T090 [P] [US5] Create unit tests for organization where-builders and optional date range in `tests/unit/reports/organization-report-query.test.ts`

### Implementation for User Story 5

- [x] T091 [US5] Implement `buildEmployeeReportWhere`, `buildBranchReportWhere`, `buildWarehouseReportWhere`, and `buildVehicleReportWhere` in `src/modules/reports/infrastructure/report-where-builders.ts`
- [x] T092 [US5] Implement employee, branch, warehouse, and vehicle list/count query methods with period counts in `src/modules/reports/infrastructure/reports.prisma-query-repository.ts`
- [x] T093 [P] [US5] Implement organization DTOs in `src/modules/reports/application/dto/employee-report.response.ts`, `branch-report.response.ts`, `warehouse-report.response.ts`, and `vehicle-report.response.ts`
- [x] T094 [P] [US5] Implement organization query schemas with optional date range in `src/modules/reports/presentation/reports.schemas.ts`
- [x] T095 [US5] Implement list use cases for employee, branch, warehouse, and vehicle in `src/modules/reports/application/use-cases/`
- [x] T096 [US5] Implement export use cases for employee, branch, warehouse, and vehicle in `src/modules/reports/application/use-cases/`
- [x] T097 [US5] Complete organization controller handlers, routes, and OpenAPI paths in `src/modules/reports/presentation/reports.controller.ts`, `reports.routes.ts`, and `reports.openapi.ts`

**Checkpoint**: Organization reference reports complete the eleven-domain catalog.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Shared filter consistency, documentation, performance review, quickstart validation, and read-only guarantee.

- [x] T098 [P] Add API tests verifying `appliedCriteria` echo consistency across all list endpoints in `tests/api/reports/report-filter-consistency.api.test.ts`
- [x] T099 Finalize shared filter pipeline in all twenty-two use cases (resolve → validate → audit → query/export) in `src/modules/reports/application/use-cases/`
- [x] T100 Ensure all repository methods honor identical `ReportFilter` predicates and `includeArchived` in `src/modules/reports/infrastructure/reports.prisma-query-repository.ts`
- [x] T101 Add slow-query warning log threshold (>1s) with report domain in `src/modules/reports/infrastructure/reports.prisma-query-repository.ts`
- [x] T102 [P] Add Reports section to `docs/api-reference.md` documenting all twenty-two endpoints, shared query params, export formats, and response fields
- [x] T103 [P] Verify `specs/009-reports/contracts/openapi.yaml` stays aligned with `reports.openapi.ts` and `common-schemas.ts`
- [x] T104 Run `specs/009-reports/quickstart.md` scenarios manually or via documented test commands
- [x] T105 Run `pnpm lint`, `pnpm test:unit -- tests/unit/reports`, `pnpm test:api -- tests/api/reports`, and `pnpm build`
- [x] T106 Review Reports module for read-only guarantee (no write Prisma calls, GET-only routes) in `src/modules/reports/`

**Checkpoint**: Feature is documented, validated, and merge-ready.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories**
- **User Stories (Phase 3–7)**: Depend on Foundational completion
  - US1 (P1) can start first as MVP
  - US2–US3 and US5 can proceed sequentially or in parallel after Foundational
  - US4 validates export/print after at least US1 list+export exists; full validation after US1–US3 and US5
- **Polish (Phase 8)**: Depends on US1–US5 completion

### User Story Dependencies

| Story    | Depends on                          | Delivers                                               |
| -------- | ----------------------------------- | ------------------------------------------------------ |
| US1 (P1) | Foundational                        | Transaction report list + export                       |
| US2 (P2) | Foundational                        | Trip + Expense report list + export                    |
| US3 (P3) | Foundational                        | Attendance, Leave, Cash Advance, Payroll list + export |
| US4 (P4) | US1+ (export infra in Foundational) | Export/print validation across domains                 |
| US5 (P5) | Foundational                        | Employee, Branch, Warehouse, Vehicle list + export     |

US1, US2, US3, and US5 do not depend on each other; they share Foundational filter/query/export infrastructure only. US4 cross-cutting tests should run after the domains they validate are implemented.

### Within Each User Story

- Tests written first (fail before implementation)
- Repository query methods before use cases
- Use cases before controller handlers
- OpenAPI updates after handler contracts stabilize

### Parallel Opportunities

- Phase 1: T003–T008 all parallel after T001–T002
- Phase 2: T009–T012, T015–T019, T021, T023–T026, T028–T032, T036–T042 parallel where marked [P]
- After Foundational: US2, US3, and US5 can be staffed in parallel by different developers
- Within each story: test tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Tests in parallel:
T043 — tests/api/reports/transaction-report.api.test.ts
T044 — tests/api/reports/transaction-report-export.api.test.ts
T045 — tests/unit/reports/transaction-report-query.test.ts
T046 — tests/integration/reports/transaction-report.persistence.test.ts

# Then sequential implementation:
T047 → T048 → T049 → T050 → T051 → T052 → T053 → T054
```

---

## Parallel Example: After Foundational

```bash
# Three developers after Phase 2 checkpoint:
Developer A: Phase 3 (US1 — Transactions) — MVP
Developer B: Phase 4 (US2 — Trips & Expenses)
Developer C: Phase 5 (US3 — Workforce & Payroll)

# Then Developer A or B takes Phase 7 (US5), then Phase 6 (US4 export validation)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (**critical**)
3. Complete Phase 3: User Story 1 (Transaction report list + export)
4. **STOP and VALIDATE**: `pnpm test:api -- tests/api/reports/transaction-report.api.test.ts`
5. Demo Owner transaction audit report with CSV export

### Incremental Delivery

1. Setup + Foundational → shared filter and export infrastructure ready
2. US1 → Transaction report → deploy/demo (**MVP**)
3. US2 → Trip + Expense reports → deploy/demo
4. US3 → Workforce + Payroll reports → deploy/demo
5. US5 → Organization reference reports → deploy/demo
6. US4 → Export/print validation hardening → deploy/demo
7. Polish → docs + quickstart

### Suggested MVP Scope

**User Story 1 only** (Transaction Report list + export) after Foundational — delivers the core commercial audit trail and proves read-only list/export architecture before expanding to the remaining ten domains.

---

## Notes

- Reports is **read-only**: no Prisma migrations or write operations in this feature
- Expense report returns empty items until P007 `Expense` model exists — do not block other reports
- All monetary values: PHP, 2 decimal places; pagination default `page=1`, `limit=20`, max `limit=100`
- Export max 10,000 rows; batch size 500 for streaming
- Organization reports use optional date range; date-bound reports require `from`/`to` with max 366-day span
- Verify tests fail before implementing corresponding production code
- Stop at any checkpoint to validate story independence
