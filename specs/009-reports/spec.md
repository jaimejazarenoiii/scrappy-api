# Feature Specification: P009 - Reports

**Feature Branch**: `[009-reports]`

**Created**: 2026-07-09

**Status**: Draft

**Input**: User description: "Create Product Specification P009 - Reports for Scrappy."

## Vision

Provide comprehensive operational reports that enable Owners and Managers to review historical
business activities, perform audits, export operational records, print records for filing or
field use, and support business decision-making.

Reports present **detailed transactional and operational records** (searchable, filterable,
sortable rows) rather than the summarized metrics provided by Analytics (P008).

Reports are a **read-only** capability. They never create, update, delete, archive, settle, or
otherwise modify operational data in any source module (P001–P008).

**Purpose**:

- Give Owners and Managers auditable, line-level visibility into transactions, trips, expenses,
  workforce activity, payroll, and organization records.
- Support operational search, filtering, sorting, printing, and exporting for compliance and
  day-to-day management.
- Enforce company tenancy and role restrictions so Reports never expose another company's data
  or grant Employees company-wide report access.

**Scope**:

- Eleven report domains: Transactions, Trips, Expenses, Attendance, Leave, Cash Advances, Payroll,
  Employees, Branches, Warehouses, Vehicles
- Shared filtering, searching, sorting, pagination, and export (CSV, Excel, PDF)
- Printable report layouts derived from the same filtered result set
- Read-only report API contracts and validation rules
- Role and tenancy enforcement for Owners and Managers only

**Non-goals**:

- Creating, updating, deleting, or archiving operational records through Reports
- Dashboard-style aggregated KPIs (covered by P008 Analytics)
- Scheduled delivery, email distribution, saved filters, custom report builder, or BI integration
  (future specifications)
- Interactive charting UX or mobile/web UI implementation (API contracts only for this specification)
- Granting Employees access to company reports in this release

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Owner Audits Transaction History (Priority: P1)

An Owner needs a detailed transaction report showing transaction numbers, parties, items, totals,
settlement information, and creators so they can audit commercial activity and settlement history
for a chosen period.

**Why this priority**: Transaction records are the core commercial audit trail for the business.

**Independent Test**: An Owner requests the Transaction Report for a custom date range with an
optional branch filter; paginated transaction rows with all required columns return for their
company only, and Employees are denied access.

**Acceptance Scenarios**:

1. **Given** an authenticated Owner and company transactions in range, **When** they request the
   Transaction Report, **Then** each row includes transaction number, direction, status, party,
   assigned employees, location, items, grand total, settlement information, created by, and
   created date.
2. **Given** a Transaction Report request with Branch and Status filters, **When** results return,
   **Then** only transactions matching all applied filters appear.
3. **Given** a search for a transaction number or party name, **When** the Transaction Report is
   requested, **Then** results are limited to matching records within the applied filters.
4. **Given** an authenticated Employee, **When** they request any company Report resource,
   **Then** access is denied.

---

### User Story 2 - Manager Reviews Trip and Expense Records (Priority: P2)

A Manager needs trip and expense reports to review field operations and spending with enough
detail to reconcile trips, vehicles, and expense references.

**Why this priority**: Trips and expenses explain field activity and cost outside summarized
dashboards.

**Independent Test**: A Manager requests Trip Report and Expense Report for This Month; detailed
rows return with trip numbers, vehicles, members, schedule/actual times, and expense category,
amount, reference, and added-by fields.

**Acceptance Scenarios**:

1. **Given** trips in various statuses, **When** a Manager requests the Trip Report, **Then** each
   row includes trip number, vehicle, members, status, scheduled start, actual start, actual end,
   origin, and destination.
2. **Given** recorded expenses, **When** a Manager requests the Expense Report, **Then** each row
   includes category, amount, reference type, reference, added by, and date.
3. **Given** optional Vehicle or Trip filters, **When** Trip or Expense Reports are requested,
   **Then** only records matching those filters within the date range appear.

---

### User Story 3 - Manager Reviews Workforce and Payroll Records (Priority: P3)

A Manager needs attendance, leave, cash advance, and payroll reports to audit time worked, time
off, advances issued, and pay periods settled or outstanding.

**Why this priority**: Workforce and payroll records support labor compliance and payroll audit.

**Independent Test**: A Manager requests Attendance, Leave, Cash Advance, and Payroll Reports for
an employee and date range; each report returns the required columns for matching company records.

**Acceptance Scenarios**:

1. **Given** attendance sessions in range, **When** a Manager requests the Attendance Report,
   **Then** each row includes employee, date, time in, time out, and status.
2. **Given** leave records, **When** a Manager requests the Leave Report, **Then** each row
   includes employee, leave type, and leave date.
3. **Given** cash advances, **When** a Manager requests the Cash Advance Report, **Then** each row
   includes employee, amount, issued by, and issued at.
4. **Given** payroll records, **When** a Manager requests the Payroll Report, **Then** each row
   includes employee, payroll period, salary, cash advance deduction, total amount, status, paid
   by, and paid at.

---

### User Story 4 - Owner Exports and Prints Filtered Reports (Priority: P4)

An Owner needs to export and print the currently filtered report result in CSV, Excel, or PDF so
they can share records with accountants, auditors, or internal filing without re-applying filters
manually.

**Why this priority**: Export and print are primary outcomes of operational reporting beyond
on-screen review.

**Independent Test**: An Owner applies filters to the Payroll Report, exports to Excel, and
receives a file containing the same rows that would appear in the on-screen paginated list for
that filter set (subject to documented export row limits).

**Acceptance Scenarios**:

1. **Given** a filtered Transaction Report with matching rows, **When** the Owner exports to CSV,
   **Then** the export contains the same filtered columns and rows as the on-screen report
   (within export limits).
2. **Given** the same filtered result set, **When** the Owner exports to Excel or PDF, **Then**
   the export succeeds with a human-readable layout suitable for review or printing.
3. **Given** a print request for a report, **When** the Owner requests a print-oriented layout,
   **Then** the system returns a printable presentation of the currently applied filters and
   result columns (via PDF export or equivalent print layout).
4. **Given** an export request with an unsupported format, **When** submitted, **Then** the
   request is rejected with a validation error.

---

### User Story 5 - Manager Browses Organization Reference Reports (Priority: P5)

A Manager needs employee, branch, warehouse, and vehicle reports to review organizational records
with operational context for audits and planning.

**Why this priority**: Organization reports complete the reporting catalog for people and assets.

**Independent Test**: A Manager requests Employee, Branch, Warehouse, and Vehicle Reports with
search and sort; profile and operational information rows return for the company.

**Acceptance Scenarios**:

1. **Given** active employees, **When** a Manager requests the Employee Report, **Then** each row
   presents employee profile information defined by the Employee Management domain.
2. **Given** branches, warehouses, and vehicles, **When** respective reports are requested,
   **Then** each row presents operational information for that entity type within the company.
3. **Given** a search by employee name, branch name, warehouse name, or vehicle plate number,
   **When** the corresponding report is requested, **Then** results narrow to matching records.

---

### Edge Cases

- Empty company or no records matching filters: return successful empty list and empty export, not
  a failure.
- Archived records: excluded by default; included only when explicitly requested.
- Invalid date range (end before start) or excessively wide range: validation error.
- Filter identifiers from another company: rejected (not found or forbidden as appropriate).
- Employee role attempting any Report: access denied.
- Export row count exceeds documented maximum: reject or return a clear limit error before
  generating a partial misleading file (product default: reject with guidance to narrow filters).
- Concurrent operational changes during a report request: results reflect operational data as of
  request time.
- Sorting by unsupported field: validation error.
- Search text that is too short or contains only whitespace: validation error or ignored per
  documented minimum length (default: minimum 2 characters when search is provided).
- Payroll report spanning partial pay periods: include records whose pay period overlaps the
  selected date range.
- Transaction report including cancelled transactions: included when status filter allows;
  excluded from default “active operational” views unless status filter explicitly includes
  cancelled.

## Requirements _(mandatory)_

### Functional Requirements

#### Report catalog

- **FR-001**: System MUST provide a read-only Transaction Report listing rows with: Transaction
  Number, Direction, Status, Party, Assigned Employees, Location, Items, Grand Total, Settlement
  Information, Created By, and Created Date.
- **FR-002**: System MUST provide a read-only Trip Report listing rows with: Trip Number, Vehicle,
  Members, Status, Scheduled Start, Actual Start, Actual End, Origin, and Destination.
- **FR-003**: System MUST provide a read-only Expense Report listing rows with: Category, Amount,
  Reference Type, Reference, Added By, and Date.
- **FR-004**: System MUST provide a read-only Attendance Report listing rows with: Employee, Date,
  Time In, Time Out, and Status.
- **FR-005**: System MUST provide a read-only Leave Report listing rows with: Employee, Leave
  Type, and Leave Date.
- **FR-006**: System MUST provide a read-only Cash Advance Report listing rows with: Employee,
  Amount, Issued By, and Issued At.
- **FR-007**: System MUST provide a read-only Payroll Report listing rows with: Employee, Payroll
  Period, Salary, Cash Advance Deduction, Total Amount, Status, Paid By, and Paid At.
- **FR-008**: System MUST provide a read-only Employee Report listing employee profile
  information per employee record in the company.
- **FR-009**: System MUST provide a read-only Branch Report listing branch operational
  information per branch in the company.
- **FR-010**: System MUST provide a read-only Warehouse Report listing warehouse operational
  information per warehouse in the company.
- **FR-011**: System MUST provide a read-only Vehicle Report listing vehicle information per
  vehicle in the company.

#### Filtering

- **FR-012**: Reports MUST support filtering by Date Range where the underlying domain is
  date-bound.
- **FR-013**: Reports MUST support optional filters for Branch, Warehouse, Vehicle, Employee, and
  Trip where applicable to the report domain.
- **FR-014**: Transaction Report MUST support optional filters for Transaction Number, Direction,
  and Status.
- **FR-015**: Expense Report MUST support optional filters for Category and Reference Type.
- **FR-016**: All filter values MUST belong to the authenticated Company when entity identifiers
  are used.

#### Searching

- **FR-017**: Reports MUST support text search appropriate to each domain, including search by
  Transaction Number, Trip Number, Party Name, Employee Name, Branch Name, Warehouse Name, and
  Vehicle Plate Number where applicable.
- **FR-018**: Search MUST be combinable with filters and MUST NOT bypass company tenancy.

#### Sorting

- **FR-019**: Reports MUST support sorting by Date, Amount, Status, Employee, Branch, and Vehicle
  where meaningful for the report domain.
- **FR-020**: Sort field and direction MUST be validated against allowed values per report type.

#### Pagination

- **FR-021**: On-screen report list endpoints MUST support pagination so large result sets are
  retrieved in pages with total counts.
- **FR-022**: Default page size MUST be suitable for operational review (assumed 20 rows; maximum
  100 per page unless a report-specific limit is documented).

#### Export and printing

- **FR-023**: System MUST support exporting any report’s currently filtered result set to CSV,
  Excel, and PDF.
- **FR-024**: Exports MUST use the same filters, search, and sort as the triggering list request
  (exports reflect the currently applied report criteria).
- **FR-025**: PDF export MUST produce a printable layout including report title, applied filter
  summary, generation timestamp, and column headers.
- **FR-026**: Future export formats MAY be added without redesigning the Reporting module’s
  filter/export model.

#### Access and data integrity

- **FR-027**: Reports MUST NOT create, update, delete, archive, settle, or otherwise modify
  operational data.
- **FR-028**: Reports MUST include only data belonging to the authenticated Company.
- **FR-029**: Only Owners and Managers MUST be able to access Reports; Employees MUST be denied
  unless a future specification explicitly grants access.
- **FR-030**: Archived records MUST be excluded by default; inclusion requires an explicit request
  flag.
- **FR-031**: Reports MUST reflect current operational records as of request time (not a separate
  offline snapshot store unless future specs introduce one).

### Key Entities

- **Report Result Set**: A read-only, filtered collection of rows for one report domain at request
  time; not a persisted entity users edit.
- **Report Row**: A single detailed record line in a report (e.g., one transaction, one trip, one
  attendance session).
- **Report Filter Set**: Date range plus optional domain filters (branch, warehouse, vehicle,
  employee, trip, status, direction, category, reference type, transaction number).
- **Report Search Query**: Free-text or identifier search narrowing rows within the filter set.
- **Report Sort Order**: Allowlisted field and ascending/descending direction.
- **Report Export**: A generated CSV, Excel, or PDF artifact representing the filtered result set.
- **Applied Report Criteria**: Echo of filters, search, sort, and include-archived flag used to
  produce a result set or export (for auditability).

### Business Rules

- Reports are strictly read-only.
- All report results are company-tenanted to the authenticated session’s Company.
- Only Owner and Manager roles may call Report resources in P009.
- Employees do not have access to company reports in this release.
- Archived operational records are omitted unless `includeArchived` (or equivalent explicit flag)
  is requested.
- Reports do not change source-module lifecycles, statuses, or balances.
- Filters referencing missing or foreign-company entities MUST be rejected.
- Exports always reflect the same criteria as the list request that initiated them.
- Settlement information on Transaction Report rows reflects the transaction’s settlement state
  from Transaction Settlement (P005) without allowing settlement actions through Reports.
- Trip and Expense report rows depend on Trip Management (P006) and Expense Management (P007);
  when source data is absent, reports return empty result sets while still exposing the contract.
- Organization reports (Employee, Branch, Warehouse, Vehicle) list current company records;
  date-range filters apply only where the domain has meaningful temporal fields (e.g., employee
  hire-related dates if exposed by profile), otherwise date filters are ignored with documented
  behavior per report.

### Validation Rules

#### Date range validation

- Date-bound reports MUST accept start and end date-times (or dates) defining the reporting window.
- End MUST be greater than or equal to start.
- Excessively wide ranges MAY be rejected if they exceed a documented product maximum (default
  assumption: one year) with a clear validation message.

#### Search validation

- Search text, when provided, MUST meet a minimum length (default: 2 characters) or be rejected.
- Search MUST NOT contain patterns that could be interpreted as cross-company identifiers without
  tenancy validation.

#### Filter validation

- Branch, Warehouse, Vehicle, Employee, and Trip identifiers MUST belong to the authenticated
  Company when provided.
- Transaction Number, Direction, Status, Category, and Reference Type values MUST be valid for
  the domain when provided.
- Unknown entity filter identifiers MUST produce not-found or validation failure (not silently
  ignored).
- `includeArchived` MUST be boolean when provided.

#### Export validation

- Export format MUST be one of: CSV, Excel, PDF.
- Export requests MUST specify the same report domain and criteria as an allowed list request.
- Export row count MUST NOT exceed a documented maximum (default assumption: 10,000 rows); excess
  MUST be rejected with guidance to narrow filters.

#### Business validation

- Caller role MUST be Owner or Manager.
- Authenticated Company context MUST be present.
- Reports MUST NOT accept mutation payloads on Report resources.

### API Contracts

URI prefix for all Report resources: `/api/v1/reports`.

Shared list query concepts (where applicable):

- `from` / `to`: date range (required for date-bound reports unless a preset period alias is
  offered in a later clarification; default: both required for operational history reports)
- `branchId`, `warehouseId`, `vehicleId`, `employeeId`, `tripId`: optional entity filters
- `transactionNumber`, `direction`, `status`, `category`, `referenceType`: optional domain filters
- `search`: optional text search
- `sortBy`, `sortOrder`: optional sorting (`asc` | `desc`)
- `page`, `limit`: pagination
- `includeArchived`: optional; default false

Shared list response concepts:

- Paginated rows for the report domain
- `appliedCriteria`: echo of filters, search, sort, and include-archived used
- `generatedAt`: timestamp of the report generation
- Standard error envelope for unauthenticated, forbidden, validation, and not-found cases

Export URI pattern per report domain:

- Method: `GET`
- URI: `/api/v1/reports/{domain}/export`
- Query: same as list query plus `format` = `csv` | `xlsx` | `pdf`
- Response: file download with appropriate content type; errors as above plus export limit exceeded

#### Transaction Report

- **List Transaction Report**
  - Purpose: Return paginated detailed transaction rows for audit and review.
  - Method: `GET`
  - URI: `/api/v1/reports/transactions`
  - Request: Shared list query; transaction-specific filters (transaction number, direction,
    status); search by transaction number or party name.
  - Response: Rows with FR-001 fields; pagination metadata; applied criteria.
  - Errors: unauthenticated, forbidden, validation error, company context missing.

- **Export Transaction Report**
  - Purpose: Export the filtered transaction report to CSV, Excel, or PDF.
  - Method: `GET`
  - URI: `/api/v1/reports/transactions/export`
  - Request: Shared list query plus `format`.
  - Response: File body (CSV, Excel, or PDF).
  - Errors: unauthenticated, forbidden, validation error, export limit exceeded.

#### Trip Report

- **List Trip Report**
  - Purpose: Return paginated detailed trip rows.
  - Method: `GET`
  - URI: `/api/v1/reports/trips`
  - Request: Shared list query; search by trip number.
  - Response: Rows with FR-002 fields; pagination metadata; applied criteria.
  - Errors: unauthenticated, forbidden, validation error, company context missing.

- **Export Trip Report**
  - Purpose: Export the filtered trip report.
  - Method: `GET`
  - URI: `/api/v1/reports/trips/export`
  - Request: Shared list query plus `format`.
  - Response: File body.
  - Errors: unauthenticated, forbidden, validation error, export limit exceeded.

#### Expense Report

- **List Expense Report**
  - Purpose: Return paginated detailed expense rows.
  - Method: `GET`
  - URI: `/api/v1/reports/expenses`
  - Request: Shared list query; category and reference type filters.
  - Response: Rows with FR-003 fields; pagination metadata; applied criteria.
  - Errors: unauthenticated, forbidden, validation error, company context missing.

- **Export Expense Report**
  - Purpose: Export the filtered expense report.
  - Method: `GET`
  - URI: `/api/v1/reports/expenses/export`
  - Request: Shared list query plus `format`.
  - Response: File body.
  - Errors: unauthenticated, forbidden, validation error, export limit exceeded.

#### Attendance Report

- **List Attendance Report**
  - Purpose: Return paginated attendance session rows.
  - Method: `GET`
  - URI: `/api/v1/reports/attendance`
  - Request: Shared list query; search by employee name.
  - Response: Rows with FR-004 fields; pagination metadata; applied criteria.
  - Errors: unauthenticated, forbidden, validation error, company context missing.

- **Export Attendance Report**
  - Purpose: Export the filtered attendance report.
  - Method: `GET`
  - URI: `/api/v1/reports/attendance/export`
  - Request: Shared list query plus `format`.
  - Response: File body.
  - Errors: unauthenticated, forbidden, validation error, export limit exceeded.

#### Leave Report

- **List Leave Report**
  - Purpose: Return paginated leave record rows.
  - Method: `GET`
  - URI: `/api/v1/reports/leave`
  - Request: Shared list query; search by employee name.
  - Response: Rows with FR-005 fields; pagination metadata; applied criteria.
  - Errors: unauthenticated, forbidden, validation error, company context missing.

- **Export Leave Report**
  - Purpose: Export the filtered leave report.
  - Method: `GET`
  - URI: `/api/v1/reports/leave/export`
  - Request: Shared list query plus `format`.
  - Response: File body.
  - Errors: unauthenticated, forbidden, validation error, export limit exceeded.

#### Cash Advance Report

- **List Cash Advance Report**
  - Purpose: Return paginated cash advance rows.
  - Method: `GET`
  - URI: `/api/v1/reports/cash-advances`
  - Request: Shared list query; search by employee name.
  - Response: Rows with FR-006 fields; pagination metadata; applied criteria.
  - Errors: unauthenticated, forbidden, validation error, company context missing.

- **Export Cash Advance Report**
  - Purpose: Export the filtered cash advance report.
  - Method: `GET`
  - URI: `/api/v1/reports/cash-advances/export`
  - Request: Shared list query plus `format`.
  - Response: File body.
  - Errors: unauthenticated, forbidden, validation error, export limit exceeded.

#### Payroll Report

- **List Payroll Report**
  - Purpose: Return paginated payroll record rows.
  - Method: `GET`
  - URI: `/api/v1/reports/payroll`
  - Request: Shared list query; search by employee name.
  - Response: Rows with FR-007 fields; pagination metadata; applied criteria.
  - Errors: unauthenticated, forbidden, validation error, company context missing.

- **Export Payroll Report**
  - Purpose: Export the filtered payroll report.
  - Method: `GET`
  - URI: `/api/v1/reports/payroll/export`
  - Request: Shared list query plus `format`.
  - Response: File body.
  - Errors: unauthenticated, forbidden, validation error, export limit exceeded.

#### Employee Report

- **List Employee Report**
  - Purpose: Return paginated employee profile rows for the company.
  - Method: `GET`
  - URI: `/api/v1/reports/employees`
  - Request: Shared list query (entity filters as applicable); search by employee name.
  - Response: Rows with FR-008 profile fields; pagination metadata; applied criteria.
  - Errors: unauthenticated, forbidden, validation error, company context missing.

- **Export Employee Report**
  - Purpose: Export the filtered employee report.
  - Method: `GET`
  - URI: `/api/v1/reports/employees/export`
  - Request: Shared list query plus `format`.
  - Response: File body.
  - Errors: unauthenticated, forbidden, validation error, export limit exceeded.

#### Branch Report

- **List Branch Report**
  - Purpose: Return paginated branch operational rows.
  - Method: `GET`
  - URI: `/api/v1/reports/branches`
  - Request: Shared list query; search by branch name.
  - Response: Rows with FR-009 fields; pagination metadata; applied criteria.
  - Errors: unauthenticated, forbidden, validation error, company context missing.

- **Export Branch Report**
  - Purpose: Export the filtered branch report.
  - Method: `GET`
  - URI: `/api/v1/reports/branches/export`
  - Request: Shared list query plus `format`.
  - Response: File body.
  - Errors: unauthenticated, forbidden, validation error, export limit exceeded.

#### Warehouse Report

- **List Warehouse Report**
  - Purpose: Return paginated warehouse operational rows.
  - Method: `GET`
  - URI: `/api/v1/reports/warehouses`
  - Request: Shared list query; search by warehouse name.
  - Response: Rows with FR-010 fields; pagination metadata; applied criteria.
  - Errors: unauthenticated, forbidden, validation error, company context missing.

- **Export Warehouse Report**
  - Purpose: Export the filtered warehouse report.
  - Method: `GET`
  - URI: `/api/v1/reports/warehouses/export`
  - Request: Shared list query plus `format`.
  - Response: File body.
  - Errors: unauthenticated, forbidden, validation error, export limit exceeded.

#### Vehicle Report

- **List Vehicle Report**
  - Purpose: Return paginated vehicle information rows.
  - Method: `GET`
  - URI: `/api/v1/reports/vehicles`
  - Request: Shared list query; search by vehicle plate number.
  - Response: Rows with FR-011 fields; pagination metadata; applied criteria.
  - Errors: unauthenticated, forbidden, validation error, company context missing.

- **Export Vehicle Report**
  - Purpose: Export the filtered vehicle report.
  - Method: `GET`
  - URI: `/api/v1/reports/vehicles/export`
  - Request: Shared list query plus `format`.
  - Response: File body.
  - Errors: unauthenticated, forbidden, validation error, export limit exceeded.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: An Owner or Manager can retrieve each of the eleven report types and receive every
  required column defined for that report in a single successful paginated response.
- **SC-002**: 100% of Report access attempts by Employees are denied.
- **SC-003**: 100% of Report responses for a company contain zero rows derived from any other
  company's records.
- **SC-004**: With no matching records for applied filters, Reports complete successfully with an
  empty list (not a false failure).
- **SC-005**: Invalid date ranges, unsupported sort fields, and foreign filter identifiers are
  rejected before partial results are returned.
- **SC-006**: Owners and Managers can apply date range, entity, status, and text search filters
  and see monotonically narrower or equal result sets compared with fewer filters.
- **SC-007**: Exported CSV, Excel, and PDF files for a given criteria set contain the same logical
  rows as the on-screen report for that criteria (within documented export row limits).
- **SC-008**: PDF exports include filter summary and generation timestamp suitable for printing
  and audit filing.
- **SC-009**: Archived records do not appear in default Report results; when explicitly
  requested, archived-inclusive results differ accordingly where archived source data exists.
- **SC-010**: No Report endpoint performs create, update, delete, archive, settle, or other
  mutation of business data (verified by contract: only GET list and GET export resources).
- **SC-011**: A Manager can sort a date-bound report by date or amount and receive rows in the
  requested order across pages.
- **SC-012**: Export requests exceeding the documented row limit are rejected with actionable
  guidance rather than silently truncating without notice.

## Assumptions

- P001–P008 capabilities are available as operational sources of truth for report rows.
- Reports complement P008 Analytics: Analytics aggregates; Reports enumerate detailed records.
- Date-bound reports require explicit `from` and `to` in v1 (preset period aliases may be added
  later without breaking the filter model).
- Default pagination: page 1, limit 20, maximum limit 100 per page.
- Default maximum date range span: one year.
- Default maximum export row count: 10,000 rows per export request.
- Minimum search length when `search` is provided: 2 characters.
- Employee, Branch, Warehouse, and Vehicle reports primarily reflect current organizational records;
  temporal filters apply only where the source domain exposes meaningful dates.
- Transaction Report “Items” presents line-item detail inline or as nested row expansion per
  product convention, but all item fields required for audit are present in the response.
- Settlement Information on Transaction Report rows includes settlement status, settlement
  timestamps, and payment references as defined by P005, without exposing mutation actions.
- Backend API specification only for P009; client UI layout, print dialog integration, and file
  storage retention for exports are out of scope unless a later spec defines them.
- Export files are generated on demand and not persisted as long-term business records unless a
  future Scheduled Reports feature introduces retention rules.

## Future Considerations

Future specifications may extend Reports with:

- Scheduled Reports
- Email Reports
- Shared Reports
- Saved Filters
- Custom Report Builder
- BI Integration

without redesigning the Reporting module’s read-only model, tenancy rules, shared filter/export
pattern, or the eleven core report domains defined here.
