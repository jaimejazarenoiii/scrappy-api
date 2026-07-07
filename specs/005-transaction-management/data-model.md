# Data Model: Transaction Management (Foundation)

**Feature**: `005-transaction-management`  
**Date**: 2026-07-07

## Overview

P004 introduces the Transaction aggregate as the core operational record for buying and selling
within a Company. The aggregate comprises `Transaction` (root), `TransactionItem` (child),
`TransactionAttachment` (child), and `TransactionEmployeeAssignment` (join). All records are
tenant-scoped via `companyId`. Only `DRAFT` and `CANCELLED` statuses exist in P004.

## Relationship Diagram

```text
Company (P001)
│
├── 1:N → Branch (P002) ─────────────┐
├── 1:N → Warehouse (P002) ──────────┤
├── 1:N → Employee (P001) ───────────┼──┐
│                                    │  │
└── 1:N → Transaction ◄──────────────┘  │
         │                               │
         ├── N:1 → Branch (optional)     │
         ├── N:1 → Warehouse (optional)  │
         ├── 1:N → TransactionItem      │
         ├── 1:N → TransactionAttachment │
         └── N:M → Employee (via TransactionEmployeeAssignment)
```

**Aggregate boundary**: `Transaction` + `TransactionItem` + `TransactionAttachment` +
`TransactionEmployeeAssignment` form one consistency boundary. External references: Company, User
(creator/updater), Branch, Warehouse, Employee, future Trip.

---

## Enums

### TransactionDirection

| Value    | UI Label | Description             |
| -------- | -------- | ----------------------- |
| INBOUND  | Buy      | Materials acquired      |
| OUTBOUND | Sell     | Materials disposed/sold |

### TransactionStatus

| Value     | Editable | Description                  |
| --------- | -------- | ---------------------------- |
| DRAFT     | Yes      | Work in progress; auto-saved |
| CANCELLED | No       | Terminal; read-only          |

### TransactionLocationType

| Value     | Required location fields            |
| --------- | ----------------------------------- |
| BRANCH    | branchId                            |
| WAREHOUSE | warehouseId                         |
| OUTSIDE   | outsideLocationName, outsideAddress |

### TransactionAttachmentType

| Value | Description    | P004 support |
| ----- | -------------- | ------------ |
| PHOTO | Image evidence | Yes          |

Future: `RECEIPT`, `DOCUMENT` (P005+).

### TransactionItemUnit

`KG`, `G`, `TON`, `LB`, `PIECE`, `BUNDLE`, `SACK`

---

## Transaction (Aggregate Root)

**Purpose**: Operational buying/selling record with header context, lifecycle status, and location.

| Field               | Type     | Required | Default   | Nullable | Notes                                        |
| ------------------- | -------- | -------- | --------- | -------- | -------------------------------------------- |
| id                  | UUID     | Yes      | generated | No       | Primary key                                  |
| companyId           | UUID     | Yes      | —         | No       | FK → Company; tenant boundary                |
| createdByUserId     | UUID     | Yes      | —         | No       | FK → User; transaction creator               |
| updatedByUserId     | UUID     | No       | null      | Yes      | Last mutating user                           |
| direction           | enum     | Yes      | —         | No       | `INBOUND`, `OUTBOUND`                        |
| status              | enum     | Yes      | `DRAFT`   | No       | `DRAFT`, `CANCELLED`                         |
| partyName           | string   | Yes      | —         | No       | Counterparty name                            |
| partyContactNumber  | string   | No       | null      | Yes      | Optional contact                             |
| transactionDate     | datetime | Yes      | —         | No       | Business date/time of activity               |
| locationType        | enum     | Yes      | —         | No       | `BRANCH`, `WAREHOUSE`, `OUTSIDE`             |
| branchId            | UUID     | No       | null      | Yes      | FK → Branch when locationType = BRANCH       |
| warehouseId         | UUID     | No       | null      | Yes      | FK → Warehouse when locationType = WAREHOUSE |
| outsideLocationName | string   | No       | null      | Yes      | Required when OUTSIDE                        |
| outsideAddress      | string   | No       | null      | Yes      | Required when OUTSIDE                        |
| tripId              | UUID     | No       | null      | Yes      | Optional; FK added in P006                   |
| notes               | string   | No       | null      | Yes      | Free-form notes                              |
| cancellationReason  | string   | No       | null      | Yes      | Set on cancel                                |
| cancelledAt         | datetime | No       | null      | Yes      | Set on cancel                                |
| createdAt           | datetime | Yes      | now       | No       | Audit                                        |
| updatedAt           | datetime | Yes      | now       | No       | Audit                                        |
| deletedAt           | datetime | No       | null      | Yes      | Soft delete (archive)                        |

**Relationships**:

- Belongs to one Company
- Created/updated by User
- Optional Branch or Warehouse (mutually exclusive by locationType)
- Has many TransactionItems (cascade delete on hard delete; soft rules in application)
- Has many TransactionAttachments
- Has many Employees through TransactionEmployeeAssignment

**Cardinality**: Company 1 → N Transactions

**Indexes**:

- Primary: `id`
- Index: `(companyId, status, deletedAt)` — default operational lists
- Index: `(companyId, transactionDate)` — date-range filters and sorting
- Index: `(companyId, direction, status)` — direction filters
- Index: `(companyId, locationType)` — location type filters
- Index: `(companyId, branchId)` — branch-scoped queries
- Index: `(companyId, warehouseId)` — warehouse-scoped queries
- Index: `(companyId, createdByUserId)` — creator audit queries
- Composite: `(companyId, deletedAt, transactionDate DESC)` — paginated default list

**Constraints**:

- `companyId` MUST match Branch/Warehouse/Employee company when referenced
- `status = CANCELLED` implies `cancelledAt IS NOT NULL`
- Only `DRAFT` may be edited; `CANCELLED` is immutable
- Default list queries exclude `deletedAt IS NOT NULL` unless `includeArchived`
- `transactionDate` MUST NOT be more than 24 hours in the future (configurable tolerance)
- At least one TransactionItem required before marking "complete" for downstream handoff (P005)

**State transitions**:

```text
[create] --> DRAFT --cancel--> CANCELLED (terminal, read-only)
DRAFT --archive (soft delete)--> deletedAt set (hidden from default lists)
CANCELLED --archive--> deletedAt set
```

**Audit strategy**:

- `createdByUserId` / `updatedByUserId` on every mutation
- Structured audit events via `transaction-audit.service.ts` for create, update, cancel, archive,
  item/attachment mutations (action, companyId, resourceType, resourceId, actorUserId)

**Soft delete strategy**:

- Archive sets `deletedAt`; no hard delete in P004 API
- Archived transactions excluded from default queries; Managers/Owners may include via filter

**Future extensibility**:

- Nullable `tripId` for P006 Trips
- `status` enum extension: `READY_FOR_PAYMENT`, `PAID` (P005) without schema redesign
- Optional `paymentReference`, `settledAt` columns additive in P005
- `expenseId` link additive in P007

---

## TransactionItem

**Purpose**: Line item describing material, quantity, unit price, and computed total.

| Field         | Type     | Required | Default   | Nullable | Notes                   |
| ------------- | -------- | -------- | --------- | -------- | ----------------------- |
| id            | UUID     | Yes      | generated | No       | Primary key             |
| transactionId | UUID     | Yes      | —         | No       | FK → Transaction        |
| materialName  | string   | Yes      | —         | No       | Free-form or suggested  |
| weight        | decimal  | Yes      | —         | No       | Positive quantity       |
| unit          | enum     | Yes      | —         | No       | TransactionItemUnit     |
| price         | decimal  | Yes      | —         | No       | Non-negative unit price |
| total         | decimal  | Yes      | computed  | No       | weight × price (2 dp)   |
| notes         | string   | No       | null      | Yes      | Optional line notes     |
| createdAt     | datetime | Yes      | now       | No       | Audit                   |
| updatedAt     | datetime | Yes      | now       | No       | Audit                   |

**Relationships**:

- Belongs to exactly one Transaction
- Cannot exist without parent Transaction

**Cardinality**: Transaction 1 → N TransactionItems (unlimited in P004)

**Indexes**:

- Primary: `id`
- Index: `(transactionId)` — list items per transaction
- Index: `(transactionId, materialName)` — suggestion queries
- Composite for suggestions: `(materialName)` with join to Transaction on `companyId`

**Constraints**:

- `weight > 0`
- `price >= 0`
- `total` MUST equal `round(weight * price, 2)`
- Mutations only when parent `Transaction.status = DRAFT` and not archived
- Cascade: deleting Transaction (hard) removes items; P004 uses soft delete on Transaction only

**Future extensibility**:

- Optional `materialId` FK when material catalog is introduced
- `sortOrder` column for client display ordering

---

## TransactionAttachment

**Purpose**: File evidence attached to a transaction. P004 supports photos; model supports future
document types via `attachmentType`.

| Field            | Type     | Required | Default   | Nullable | Notes                       |
| ---------------- | -------- | -------- | --------- | -------- | --------------------------- |
| id               | UUID     | Yes      | generated | No       | Primary key                 |
| transactionId    | UUID     | Yes      | —         | No       | FK → Transaction            |
| attachmentType   | enum     | Yes      | `PHOTO`   | No       | `PHOTO` in P004             |
| fileName         | string   | Yes      | —         | No       | Original filename           |
| filePath         | string   | Yes      | —         | No       | Storage-relative path       |
| mimeType         | string   | Yes      | —         | No       | e.g. image/jpeg             |
| fileSize         | integer  | Yes      | —         | No       | Bytes; max 5_242_880 (5 MB) |
| uploadedByUserId | UUID     | Yes      | —         | No       | FK → User                   |
| createdAt        | datetime | Yes      | now       | No       | Upload timestamp            |

**Relationships**:

- Belongs to exactly one Transaction
- Uploaded by one User

**Cardinality**: Transaction 1 → N TransactionAttachments (max 20 photos in P004 validation)

**Indexes**:

- Primary: `id`
- Index: `(transactionId)` — list attachments per transaction
- Index: `(transactionId, attachmentType)` — filter by type

**Constraints**:

- Cannot exist without parent Transaction
- `mimeType` MUST be in allowlist for PHOTO: `image/jpeg`, `image/png`, `image/webp`
- `fileSize` MUST be <= 5 MB per file
- Max 20 PHOTO attachments per transaction
- Mutations only when parent `Transaction.status = DRAFT` and not archived
- `filePath` MUST be scoped under company/transaction directory in storage

**Future extensibility**:

- `RECEIPT`, `DOCUMENT` attachment types in P005
- Optional `thumbnailPath` for image previews
- Virus scan status column for production hardening

---

## TransactionEmployeeAssignment

**Purpose**: Links Employees assigned to a transaction for operational responsibility and scoped
access.

| Field         | Type     | Required | Default | Nullable | Notes                |
| ------------- | -------- | -------- | ------- | -------- | -------------------- |
| transactionId | UUID     | Yes      | —       | No       | FK → Transaction     |
| employeeId    | UUID     | Yes      | —       | No       | FK → Employee        |
| assignedAt    | datetime | Yes      | now     | No       | Assignment timestamp |

**Relationships**:

- Many assignments per Transaction; many transactions per Employee

**Cardinality**: Transaction N ↔ M Employee

**Indexes**:

- Primary: `(transactionId, employeeId)` composite
- Index: `(employeeId, transactionId)` — assigned transaction list for Employee
- Index: `(employeeId)` — employee-scoped queries

**Constraints**:

- Unique `(transactionId, employeeId)`
- Employee MUST belong to same Company as Transaction
- At least one assignment REQUIRED on transaction create
- Assignment changes only on DRAFT transactions

---

## Cross-Module Dependencies

| Module     | Usage in P004                             |
| ---------- | ----------------------------------------- |
| company    | Tenant boundary                           |
| auth/user  | Actor identity, createdBy/updatedBy       |
| employee   | Assigned employees, employee-scoped lists |
| branch     | BRANCH location validation                |
| warehouse  | WAREHOUSE location validation             |
| attendance | Operational readiness gate on create      |

## Suggestion Read Models

No persisted tables. Queries against `TransactionItem` joined to `Transaction` where
`Transaction.companyId = :companyId` and `Transaction.deletedAt IS NULL`.

| Query          | Source columns                      | Ordering                    |
| -------------- | ----------------------------------- | --------------------------- |
| Material names | DISTINCT `materialName`             | Recent use, then alpha      |
| Prices         | DISTINCT `price` for `materialName` | Most recent transactionDate |
