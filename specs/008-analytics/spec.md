# Feature Specification: P008 - Analytics

**Feature Branch**: `[008-analytics]`

**Created**: 2026-07-08

**Status**: Draft

**Input**: User description: "Create Product Specification P008 - Analytics for Scrappy."

## Vision

Provide real-time operational and business insights that help Owners and Managers understand
company performance, employee productivity, operational efficiency, and financial activity.

Analytics is a read-only business intelligence capability. It aggregates information from
completed operational modules (Company & Identity, Organization, Workforce, Transactions,
Settlement, Trips, and Expenses) without changing any underlying business data.

**Purpose**:

- Give Owners and Managers a single place to understand how the company is performing.
- Aggregate cross-module metrics for company, organization units, workforce, transactions,
  trips, and expenses.
- Support common date and organization filters so insights match the period and scope of interest.
- Enforce company tenancy and role restrictions so Analytics never exposes another company's data
  or grants Employees analytical access.

**Scope**:

- Company dashboard summary metrics
- Transaction analytics
- Trip analytics
- Expense analytics
- Workforce analytics
- Organization analytics (branch, warehouse, and vehicle performance)
- Shared dashboard filters (preset and custom date ranges; optional branch, warehouse, vehicle,
  employee)
- Read-only analytics API contracts and validation rules
- Role and tenancy enforcement for Owners and Managers only

**Non-goals**:

- Creating, updating, deleting, or soft-archiving any operational record through Analytics
- Interactive charting UX, predictive models, AI insights, KPI goals, benchmarking, or scheduled
  reports (future specifications)
- Redefining lifecycle, settlement, workforce, or expense rules defined in P001–P007
- Mobile or web UI implementation (API contracts only for this specification)
- Storing separate analytical warehouses or historical snapshots beyond reflecting current
  operational data as of the request

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Owner Reviews Company Performance (Priority: P1)

An Owner needs a company-wide snapshot for a chosen period showing transactional volume and value,
expenses, payroll, net operational amount, and current active employees, trips, and vehicles so they
can judge overall business health at a glance.

**Why this priority**: Company-level visibility is the primary Owner outcome and anchors all other
analytical views.

**Independent Test**: An Owner requests the Company Analytics dashboard for This Month; summary
metrics populate from company-scoped operational data and Employees cannot access the same
resource.

**Acceptance Scenarios**:

1. **Given** an authenticated Owner with operational data in the company, **When** they open the
   Company Analytics dashboard for This Month, **Then** they see total inbound transactions, total
   outbound transactions, total transaction amount, total expenses, total payroll, net operational
   amount, active employees, active trips, and active vehicles for the company and period.
2. **Given** Company Analytics results, **When** optional Branch, Warehouse, Vehicle, or Employee
   filters are applied, **Then** metrics recalculate within the intersection of the date range and
   selected filters.
3. **Given** an authenticated Employee, **When** they request any Analytics resource, **Then**
   access is denied.
4. **Given** Company Analytics, **When** any write or mutation request is attempted against
   Analytics resources, **Then** the capability is not offered (read-only).

---

### User Story 2 - Manager Analyzes Transaction Performance (Priority: P2)

A Manager needs transaction analytics for a period to understand inbound vs outbound volume,
total and average value, and which materials, employees, branches, and warehouses are most active.

**Why this priority**: Transaction activity is the core of junkshop operations; Managers must see
where volume and value concentrate.

**Independent Test**: A Manager requests Transaction Analytics for a custom date range and optional
branch; inbound/outbound totals, amounts, averages, and ranked materials/employees/locations
return for that company only.

**Acceptance Scenarios**:

1. **Given** settled and unsettled company transactions in range, **When** a Manager requests
   Transaction Analytics, **Then** they receive total inbound, total outbound, total transaction
   amount, transaction count, average transaction value, top materials, most active employees,
   most active branches, and most active warehouses for the filtered scope.
2. **Given** Transaction Analytics without optional organization filters, **When** the response is
   reviewed, **Then** metrics cover the whole company within the selected date range
   (excluding archived records unless explicitly requested).
3. **Given** Transaction Analytics for Company A, **When** Company B data exists, **Then** no
   Company B figures appear.

---

### User Story 3 - Manager Reviews Trip and Expense Insights (Priority: P3)

A Manager needs trip and expense analytics so they can judge field utilization and spend by
category and organizational dimensions.

**Why this priority**: Trips and expenses explain operational cost and vehicle/driver usage outside
premises.

**Independent Test**: A Manager requests Trip Analytics and Expense Analytics for This Week;
trip status counts, utilization rankings, expense totals, category breakdown, and dimensional
breakdowns return within filters.

**Acceptance Scenarios**:

1. **Given** trips in various statuses, **When** a Manager requests Trip Analytics, **Then** they
   see total trips, active trips, completed trips, cancelled trips, vehicle utilization, most
   active vehicles, most active drivers, and average trip duration for the filtered period.
2. **Given** recorded expenses, **When** a Manager requests Expense Analytics, **Then** they see
   total expenses, breakdown by category, expenses by branch, warehouse, vehicle, and trip, and a
   monthly expense trend for the filtered period.
3. **Given** optional Vehicle or Trip-related filters, **When** Expense Analytics is requested,
   **Then** amounts reflect only expenses matching those filters within the date range.

---

### User Story 4 - Manager Reviews Workforce and Organization Performance (Priority: P4)

A Manager needs workforce summaries (attendance, payroll, leave, cash advances, employee activity)
and organization performance views (branch, warehouse, vehicle) to manage people and assets.

**Why this priority**: Completes the dashboard set so people, pay, and organizational units are
visible alongside commercial activity.

**Independent Test**: A Manager requests Workforce Analytics and Organization Analytics for This
Month; workforce summaries and branch/warehouse/vehicle performance metrics return for the company.

**Acceptance Scenarios**:

1. **Given** workforce activity in range, **When** a Manager requests Workforce Analytics, **Then**
   they see attendance summary, payroll summary, leave summary, cash advance summary, employee
   activity, and most active employees for the filtered scope.
2. **Given** organization units with activity, **When** a Manager requests Organization Analytics,
   **Then** they see branch performance, warehouse performance, and vehicle utilization summaries
   for the filtered scope.
3. **Given** an optional Employee filter, **When** Workforce Analytics is requested, **Then**
   summaries focus on that employee within the date range.

---

### User Story 5 - Owner Applies Date and Organization Filters (Priority: P5)

An Owner needs preset periods (Today, Yesterday, This Week, This Month, This Year) and custom
date ranges, plus optional Branch, Warehouse, Vehicle, and Employee filters, so every dashboard
answers the same scope question consistently.

**Why this priority**: Filters make all dashboards actionable; without them, insights are too
broad to act on.

**Independent Test**: An Owner switches from This Week to a custom range and adds a Branch filter;
all dashboards that accept those filters recompute consistently and reject invalid ranges.

**Acceptance Scenarios**:

1. **Given** any Analytics dashboard, **When** a preset period is selected, **Then** metrics use
   that period's inclusive date boundaries for the company's timezone conventions.
2. **Given** a custom date range where the end is before the start, **When** Analytics is requested,
   **Then** the request is rejected with a validation error.
3. **Given** a Branch filter that does not belong to the company, **When** Analytics is requested,
   **Then** the request is rejected.
4. **Given** matching filters with no underlying activity, **When** Analytics is requested,
   **Then** metrics return zero or empty ranked lists rather than an error.

---

### Edge Cases

- Empty company / no activity in range: return zero totals and empty rankings, not a failure.
- Filters that yield no matching records: same zero/empty outcomes.
- Archived records: excluded by default; included only when the client explicitly requests them.
- Invalid or missing date range when a custom range is required: validation error.
- Filter identifiers from another company: rejected (not found or forbidden as appropriate).
- Employee role attempting Analytics: access denied.
- Concurrent operational changes during an Analytics request: results reflect operational data as
  of the moment of the request (near real-time / current operational view).
- Net operational amount when expense or payroll periods partially overlap transaction periods:
  compute consistently from the same applied filters and documented metric definitions.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide a read-only Company Analytics dashboard with: Total Inbound
  Transactions, Total Outbound Transactions, Total Transaction Amount, Total Expenses, Total
  Payroll, Net Operational Amount, Active Employees, Active Trips, and Active Vehicles.
- **FR-002**: System MUST provide Transaction Analytics with: Total Inbound, Total Outbound, Total
  Transaction Amount, Transaction Count, Average Transaction Value, Top Materials, Most Active
  Employees, Most Active Branches, and Most Active Warehouses.
- **FR-003**: System MUST provide Trip Analytics with: Total Trips, Active Trips, Completed Trips,
  Cancelled Trips, Vehicle Utilization, Most Active Vehicles, Most Active Drivers, and Average Trip
  Duration.
- **FR-004**: System MUST provide Expense Analytics with: Total Expenses, Expense Breakdown by
  Category, Expenses by Branch, Expenses by Warehouse, Expenses by Vehicle, Expenses by Trip, and
  Monthly Expense Trend.
- **FR-005**: System MUST provide Workforce Analytics with: Attendance Summary, Payroll Summary,
  Leave Summary, Cash Advance Summary, Employee Activity, and Most Active Employees.
- **FR-006**: System MUST provide Organization Analytics with: Branch Performance, Warehouse
  Performance, and Vehicle Utilization.
- **FR-007**: System MUST support date filtering via Today, Yesterday, This Week, This Month, This
  Year, and Custom Date Range on Analytics resources that are period-based.
- **FR-008**: System MUST support optional filters for Branch, Warehouse, Vehicle, and Employee on
  Analytics resources where those dimensions apply.
- **FR-009**: Analytics MUST NOT create, update, delete, archive, or otherwise modify business data.
- **FR-010**: Analytics MUST include only data belonging to the authenticated Company.
- **FR-011**: Only Owners and Managers MUST be able to access Analytics; Employees MUST be denied.
- **FR-012**: Archived records MUST be excluded from Analytics unless the request explicitly asks
  to include them.
- **FR-013**: Analytics MUST reflect current operational data available at request time (not a
  separately maintained offline batch unless future specs introduce one).
- **FR-014**: Date range and filter inputs MUST be validated before metrics are computed.
- **FR-015**: When no matching activity exists for the applied filters, Analytics MUST return
  successful empty or zero-valued results rather than treating emptiness as an error.
- **FR-016**: Net Operational Amount MUST be defined as Total Transaction Amount minus Total
  Expenses minus Total Payroll for the same filter scope (inbound and outbound amounts combined as
  Total Transaction Amount unless a later clarification changes signed treatment).
- **FR-017**: “Active” counts (employees, trips, vehicles) MUST use each source module’s current
  operational definitions of active/in-use state as of request time, independent of the selected
  historical date range where those metrics are live status indicators.
- **FR-018**: Period-based volume, amount, and ranking metrics MUST use the selected date range;
  live status metrics documented as “active” MAY ignore historical range and report current state.

### Key Entities

- **Analytics Snapshot**: A read-only aggregation result for a dashboard at request time; not a
  persisted business entity that users edit.
- **Date Range Filter**: Preset period or custom start/end bounds applying to period-based metrics.
- **Organization Filter Set**: Optional Branch, Warehouse, Vehicle, and/or Employee selectors that
  narrow which operational records contribute to metrics.
- **Company Dashboard Summary**: Aggregated company KPIs listed in FR-001.
- **Transaction Analytics Summary**: Aggregated transaction KPIs and rankings listed in FR-002.
- **Trip Analytics Summary**: Aggregated trip KPIs and rankings listed in FR-003.
- **Expense Analytics Summary**: Aggregated expense KPIs, breakdowns, and trend listed in FR-004.
- **Workforce Analytics Summary**: Aggregated workforce KPIs listed in FR-005.
- **Organization Analytics Summary**: Branch, warehouse, and vehicle performance aggregates listed
  in FR-006.
- **Ranked Contributor**: A named operational subject (material, employee, branch, warehouse,
  vehicle, driver, category, trip) with an associated activity measure for “top/most active” lists.

### Business Rules

- Analytics is strictly read-only.
- All Analytics results are company-tenanted to the authenticated session’s Company.
- Only Manager and Owner roles may call Analytics resources.
- Archived operational records are omitted unless `includeArchived` (or equivalent explicit flag)
  is requested.
- Analytics does not change source-module lifecycles, statuses, or balances.
- Filters that reference missing or foreign-company entities MUST be rejected.
- Preset date periods MUST resolve to consistent inclusive boundaries for the company.
- Custom ranges require both start and end; end MUST NOT precede start.
- Expense Analytics depends on Expense Management (P007) data; until expenses exist, expense
  metrics MAY return zeros while still exposing the contract.
- Ranked lists MUST return a stable ordering by the activity measure descending, with a documented
  maximum list size suitable for dashboards.

### Validation Rules

#### Date Range validation

- Preset period values MUST be one of: Today, Yesterday, This Week, This Month, This Year, or Custom.
- Custom range MUST include both start and end date-times.
- End MUST be greater than or equal to start.
- Excessively wide custom ranges MAY be rejected if they exceed a documented product maximum
  (default assumption: one year) with a clear validation message.

#### Filter validation

- Branch, Warehouse, Vehicle, and Employee filter identifiers MUST belong to the authenticated
  Company when provided.
- Unknown filter identifiers MUST produce a not-found or validation failure (not silently ignored).
- Include-archived flag MUST be boolean when provided.

#### Business validation

- Caller role MUST be Owner or Manager.
- Authenticated Company context MUST be present.
- Analytics MUST never accept mutation payloads on Analytics resources.

### API Contracts

URI prefix for all Analytics resources: `/api/v1/analytics`.

Shared query concepts (where applicable):

- `period`: Today | Yesterday | ThisWeek | ThisMonth | ThisYear | Custom
- `from` / `to`: required when `period` is Custom
- `branchId`, `warehouseId`, `vehicleId`, `employeeId`: optional filters
- `includeArchived`: optional; default false

#### Company Analytics

- **Get Company Analytics**
  - Purpose: Return company dashboard summary metrics for the applied filters.
  - Method: `GET`
  - URI: `/api/v1/analytics/company`
  - Request: Shared filter query parameters.
  - Response: Company dashboard metrics (FR-001 fields).
  - Errors: unauthenticated, forbidden (non Owner/Manager), validation error (bad date/filters),
    company context missing.

#### Transaction Analytics

- **Get Transaction Analytics**
  - Purpose: Return transaction volume, value, and ranking insights.
  - Method: `GET`
  - URI: `/api/v1/analytics/transactions`
  - Request: Shared filter query parameters.
  - Response: Transaction analytics metrics (FR-002 fields).
  - Errors: unauthenticated, forbidden, validation error, company context missing.

#### Trip Analytics

- **Get Trip Analytics**
  - Purpose: Return trip volume, status mix, utilization, and ranking insights.
  - Method: `GET`
  - URI: `/api/v1/analytics/trips`
  - Request: Shared filter query parameters.
  - Response: Trip analytics metrics (FR-003 fields).
  - Errors: unauthenticated, forbidden, validation error, company context missing.

#### Expense Analytics

- **Get Expense Analytics**
  - Purpose: Return expense totals, category and dimensional breakdowns, and monthly trend.
  - Method: `GET`
  - URI: `/api/v1/analytics/expenses`
  - Request: Shared filter query parameters.
  - Response: Expense analytics metrics (FR-004 fields).
  - Errors: unauthenticated, forbidden, validation error, company context missing.

#### Workforce Analytics

- **Get Workforce Analytics**
  - Purpose: Return attendance, payroll, leave, cash advance, and employee activity summaries.
  - Method: `GET`
  - URI: `/api/v1/analytics/workforce`
  - Request: Shared filter query parameters (Employee filter especially relevant).
  - Response: Workforce analytics metrics (FR-005 fields).
  - Errors: unauthenticated, forbidden, validation error, company context missing.

#### Organization Analytics

- **Get Organization Analytics**
  - Purpose: Return branch performance, warehouse performance, and vehicle utilization summaries.
  - Method: `GET`
  - URI: `/api/v1/analytics/organization`
  - Request: Shared filter query parameters.
  - Response: Organization analytics metrics (FR-006 fields).
  - Errors: unauthenticated, forbidden, validation error, company context missing.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: An Owner or Manager can retrieve Company Analytics for a standard preset period and
  see all nine required company summary metrics in a single successful response.
- **SC-002**: Transaction, Trip, Expense, Workforce, and Organization Analytics each return every
  metric listed for that dashboard under the same filter model.
- **SC-003**: 100% of Analytics access attempts by Employees are denied.
- **SC-004**: 100% of Analytics responses for a company contain zero metrics derived from any other
  company's records.
- **SC-005**: With no matching activity in range, Analytics completes successfully with zero totals
  and empty rankings (no false failure).
- **SC-006**: Invalid custom date ranges and foreign filter IDs are rejected before any partial
  metrics are returned.
- **SC-007**: Owners and Managers can switch among Today, Yesterday, This Week, This Month, This
  Year, and a valid custom range and obtain recalculated period-based metrics for each selection.
- **SC-008**: Archived records do not appear in default Analytics results; when explicitly
  requested, archived-included results differ accordingly where archived source data exists.
- **SC-009**: No Analytics endpoint performs create, update, delete, or archive of business data
  (verified by contract and acceptance: only GET analytics resources exist for P008).
- **SC-010**: A Manager using optional Branch (and similarly Warehouse/Vehicle/Employee where
  applicable) filters sees reduced or equal totals compared with the unfiltered company same-period
  view, never inflated by out-of-filter records.

## Assumptions

- P001–P007 capabilities that Analytics aggregates (identity, organization, workforce, transactions,
  settlement, trips, expenses) are available as operational sources of truth.
- “Total Transaction Amount” for company and transaction dashboards means the sum of transaction
  monetary totals in scope (inbound and outbound), not a signed net of buy vs sell, unless a later
  product clarification changes this.
- Net Operational Amount = Total Transaction Amount − Total Expenses − Total Payroll for the same
  filter scope.
- “Active Employees / Trips / Vehicles” are live status counts at request time; other metrics are
  period aggregates unless noted.
- Ranked “top/most active” lists return a small dashboard-sized set (assumed top 10) ordered by
  descending activity measure.
- Company timezone / calendar week boundaries follow the company’s established operational locale
  conventions already used elsewhere in Scrappy.
- Custom date range maximum span is one year unless a later clarification widens it.
- Expense module (P007) may still be maturing; Analytics exposes expense contracts regardless, with
  zero values acceptable when no expense data exists.
- Backend API specification only for P008; client UI layout and charting are out of scope.
- Analytics does not require users to materialize or save named report definitions in this release.

## Future Considerations

Future specifications may extend Analytics with:

- Interactive Charts
- Predictive Analytics
- AI Insights
- KPI Goals
- Benchmarking
- Scheduled Reports

without redesigning the Analytics module’s read-only aggregation model, tenancy rules, or core
dashboard resources defined here.
