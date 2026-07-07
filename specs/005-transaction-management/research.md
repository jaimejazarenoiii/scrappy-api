# Research: Transaction Management (Foundation)

**Feature**: `005-transaction-management`  
**Date**: 2026-07-07

## 1. Module decomposition strategy

**Decision**: Implement a single `transaction` bounded-context module containing the Transaction
aggregate root, child entities (Items, Attachments), employee assignment join records, and
suggestion read queries. All routes mount under `/api/v1/transactions`.

**Rationale**: Items and Attachments have no independent lifecycle outside a Transaction; they are
created, updated, and deleted only through the aggregate. A single module preserves invariant
enforcement (draft-only edits, company scoping, assignment rules) in one application layer.

**Alternatives considered**:

- Three sibling modules (`transaction`, `transaction-item`, `transaction-attachment`) — rejected;
  splits aggregate invariants across module boundaries and complicates authorization.
- Monolithic `operations` module combining future Trips/Expenses — rejected; violates YAGNI and
  mixes unrelated lifecycles.

## 2. Aggregate root and consistency boundaries

**Decision**: `Transaction` is the aggregate root. All mutations to Items, Attachments, and
Assigned Employees pass through Transaction-scoped use cases that load the root, assert `DRAFT`
status, and persist changes atomically where required.

**Rationale**: Business rules (draft-only edit, cancelled immutability, at-least-one-item
completeness) are transaction-level invariants. Child entities cannot be addressed independently
without the parent context.

**Alternatives considered**:

- Event-sourced aggregate — rejected; exceeds P004 scope and constitution simplicity principle.
- Separate repositories exposed to controllers for items — rejected; leaks aggregate boundary.

## 3. Operational readiness gate

**Decision**: Reuse `isOperationallyReady()` from `src/shared/workforce/operational-readiness.ts`.
Transaction creation use case queries the acting Employee's open `AttendanceSession` and rejects
when not timed in.

**Rationale**: P003 explicitly exported this primitive for Transaction and Expense modules.
No duplicate readiness logic.

**Alternatives considered**:

- Duplicate attendance lookup in transaction module only — rejected.
- Middleware-level gate — rejected; readiness is a business rule with clear 409 response, not auth.

## 4. Direction mapping (Buy/Sell ↔ Inbound/Outbound)

**Decision**: Persist `TransactionDirection` enum as `INBOUND` | `OUTBOUND` in storage. API accepts
either `BUY`/`SELL` (user-facing) or `INBOUND`/`OUTBOUND` (internal) in request bodies; map at
presentation boundary before use case execution. Responses always return canonical `INBOUND` |
`OUTBOUND` plus optional `directionLabel: "BUY" | "SELL"` in DTO for client convenience.

**Rationale**: Spec defines internal direction separately from UI labels; single canonical storage
avoids ambiguity in future payment/settlement modules.

**Alternatives considered**:

- Store only BUY/SELL — rejected; spec and future analytics expect inbound/outbound semantics.

## 5. Archive vs Cancel semantics

**Decision**:

- **Cancel** sets `status = CANCELLED`, records `cancelledAt` and optional `cancellationReason`;
  transaction becomes immutable.
- **Archive** sets `deletedAt` (soft delete) on Draft or Cancelled transactions; excluded from
  default list queries (`deletedAt IS NULL`). Archived records remain retrievable via
  `includeArchived=true` for Managers/Owners.

**Rationale**: Aligns with P002 organization resource archive pattern (`deletedAt`) while keeping
Cancel as a distinct business status for operational audit.

**Alternatives considered**:

- Separate `archivedAt` column — rejected; redundant with established soft-delete convention.
- Archive only Draft — rejected; spec allows retaining cancelled history while hiding from lists.

## 6. Auto-save behavior

**Decision**: Auto-save is a **client responsibility** triggering standard `PATCH
/api/v1/transactions/{transactionId}` (and item PATCH endpoints as needed) after five seconds of
inactivity or on screen exit. Server has no dedicated auto-save endpoint; PATCH validates draft
status and persists partial updates idempotently.

**Rationale**: Auto-save timing is a UX concern; server already supports partial PATCH on drafts.
Avoids duplicate endpoints and race-prone server-side timers.

**Alternatives considered**:

- Server-side debounce/session store — rejected; adds infrastructure complexity with no business
  benefit over idempotent PATCH.

## 7. Assigned employees modeling

**Decision**: Many-to-many via `TransactionEmployeeAssignment` join table
`(transactionId, employeeId)` with composite unique constraint. Creator is stored separately on
`Transaction.createdByUserId`; creator MAY also appear in assignments but is not required to.

**Rationale**: Spec requires multiple assigned employees; join table is normalized and queryable for
employee-scoped list filters.

**Alternatives considered**:

- JSON array column on Transaction — rejected; poor index support for assigned-employee queries.
- Single `primaryEmployeeId` only — rejected; spec requires multiple.

## 8. Item total calculation

**Decision**: `total = round(weight * price, 2)` computed in domain/application layer on create and
update. Client-submitted `total` is validated against computed value; mismatch returns 400.

**Rationale**: Prevents inconsistent financial line data before P005 payment workflows.

**Alternatives considered**:

- Trust client total — rejected for scrap trading where weight × price is authoritative.

## 9. Attachment storage strategy

**Decision**: Introduce `FileStorage` interface in infrastructure with `LocalFileStorage`
implementation for development. Files stored under `{UPLOAD_DIR}/transactions/{companyId}/{transactionId}/`.
Database stores metadata (`fileName`, `filePath`, `mimeType`, `fileSize`, `attachmentType`).
Upload via `multipart/form-data` at presentation layer using multer (justified new dependency for
binary uploads). Allowed types: `image/jpeg`, `image/png`, `image/webp`; max 5 MB per file; max 20
photos per transaction.

**Rationale**: No file upload infrastructure exists in P001–P003; binary handling requires a
presentation-boundary parser. Local storage keeps MVP simple; interface allows S3 swap later without
domain changes.

**Alternatives considered**:

- Base64 in JSON body — rejected; payload size and performance concerns.
- Direct S3 in P004 — rejected; YAGNI until deployment requirements are defined.

## 10. Material and price suggestions

**Decision**: Read-only queries against historical `TransactionItem` rows joined to `Transaction`
filtered by `companyId`, excluding archived transactions (`deletedAt IS NULL`). Material
suggestions: `DISTINCT materialName` with `ILIKE` prefix search, ordered by recency/frequency.
Price suggestions: distinct `price` values for exact `materialName` match, ordered by most recent
use.

**Rationale**: No separate material master table in P004; suggestions derive from operational
history per spec.

**Alternatives considered**:

- Dedicated `Material` catalog entity — deferred; spec allows free-form entry with suggestions only.

## 11. Location validation

**Decision**: Conditional validation by `locationType`:

| locationType | Required fields                     | Forbidden/null fields       |
| ------------ | ----------------------------------- | --------------------------- |
| BRANCH       | branchId (active, same co.)         | warehouseId, outside fields |
| WAREHOUSE    | warehouseId (active, same co.)      | branchId, outside fields    |
| OUTSIDE      | outsideLocationName, outsideAddress | branchId, warehouseId       |

`tripId` optional on all types in P004.

**Rationale**: Matches spec location rules and P002 Branch/Warehouse tenant ownership.

## 12. Trip extensibility (P006 placeholder)

**Decision**: Add nullable `tripId` UUID column on Transaction with no FK constraint until Trip
model exists in P006. Validation accepts null or ignores unknown trip references in P004.

**Rationale**: Spec states Trip relationship is optional now; column avoids migration pain later.

**Alternatives considered**:

- Omit tripId until P006 — rejected; additive nullable column is low cost and documents intent.

## 13. Weight unit allowlist

**Decision**: `TransactionItemUnit` enum: `KG`, `G`, `TON`, `LB`, `PIECE`, `BUNDLE`, `SACK`.

**Rationale**: Covers common scrap/recycling weight and count units without open-ended strings that
break reporting in P008 analytics.

**Alternatives considered**:

- Free-text unit — rejected; complicates price suggestion matching and future reports.

## 14. Authorization enforcement

**Decision**: Reuse P001 middleware chain: `authn` → `companyResolutionMiddleware` → route-level
`authorize()`. Assignment checks in application policies:

- Employee edit: must be in `TransactionEmployeeAssignment` for target transaction.
- Manager/Owner: any Draft in company.
- View: Employee assigned-only; Manager/Owner company-wide.

**Rationale**: Consistent with P002/P003 patterns; assignment is resource-level, not role-only.

## 15. Search and filter implementation

**Decision**: List queries support filters: `direction`, `status`, `locationType`, `branchId`,
`warehouseId`, `assignedEmployeeId`, `fromDate`, `toDate`, `search` (party name, notes, material
name via item subquery), `includeArchived`. Default sort `transactionDate desc`. Pagination via P001
`page`, `limit`, `sortBy`, `sortOrder`.

**Rationale**: Matches spec list/search/filter requirements and constitution pagination conventions.

**Alternatives considered**:

- Full-text search engine — rejected for P004 volume expectations.
