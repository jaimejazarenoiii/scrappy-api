# Data Model: Expense Management (P007)

**Feature**: `010-expense-management`  
**Depends on**: P001 Company/User, P002 Branch/Warehouse/Vehicle, P003 Employee/Attendance, P006 Trip

## Overview

P007 introduces `Expense` as a new aggregate root with child `ExpenseAttachment` entities and
supporting `ExpenseNumberSequence` for atomic numbering. Branch, Warehouse, Vehicle, and Trip are
referenced by FK but not owned by the Expense aggregate.

## Expense (Aggregate Root)

**Purpose**: Records an operational cost incurred by a Company with lifecycle, immutable Expense
Number, single context reference, and audit metadata.

### Fields

| Field               | Type     | Nullable | Notes                                               |
| ------------------- | -------- | -------- | --------------------------------------------------- |
| id                  | UUID     | No       | PK                                                  |
| companyId           | UUID     | No       | FK → Company; tenant scope                          |
| expenseNumber       | string   | No       | Immutable; `EXP-YYYYMMDD-000001`; unique/company    |
| expenseDate         | datetime | No       | Business date of cost                               |
| category            | string   | No       | Free-form MVP; max 200                              |
| amount              | decimal  | No       | Must be > 0                                         |
| description         | string   | No       | Max 2000                                            |
| status              | enum     | No       | `DRAFT`, `RECORDED`, `CANCELLED`                    |
| contextType         | enum     | No       | `COMPANY`, `BRANCH`, `WAREHOUSE`, `VEHICLE`, `TRIP` |
| branchId            | UUID     | Yes      | FK → Branch; set when contextType=BRANCH            |
| warehouseId         | UUID     | Yes      | FK → Warehouse; set when contextType=WAREHOUSE      |
| vehicleId           | UUID     | Yes      | FK → Vehicle; set when contextType=VEHICLE          |
| tripId              | UUID     | Yes      | FK → Trip; set when contextType=TRIP                |
| createdByUserId     | UUID     | No       | FK → User                                           |
| createdByEmployeeId | UUID     | Yes      | FK → Employee; denormalized creator for filters     |
| updatedByUserId     | UUID     | Yes      | FK → User                                           |
| recordedByUserId    | UUID     | Yes      | FK → User; set on record                            |
| recordedAt          | datetime | Yes      | Set on record                                       |
| cancelledByUserId   | UUID     | Yes      | FK → User; set on cancel                            |
| cancelledAt         | datetime | Yes      | Set on cancel                                       |
| cancellationReason  | string   | Yes      | Required when status=CANCELLED                      |
| createdAt           | datetime | No       |                                                     |
| updatedAt           | datetime | No       |                                                     |
| deletedAt           | datetime | Yes      | Soft archive timestamp                              |

### Relationships

```text
Company 1──* Expense
Expense *──0..1 Branch
Expense *──0..1 Warehouse
Expense *──0..1 Vehicle
Expense *──0..1 Trip
Expense 1──* ExpenseAttachment
User → createdByUserId, updatedByUserId, recordedByUserId, cancelledByUserId
Employee → createdByEmployeeId
```

### Indexes

| Index / constraint                    | Purpose                          |
| ------------------------------------- | -------------------------------- |
| `(companyId, expenseNumber)` UNIQUE   | Business identifier lookup       |
| `(companyId, status, deletedAt)`      | Active list filters              |
| `(companyId, expenseDate)`            | Date range queries; default sort |
| `(companyId, category)`               | Category filter                  |
| `(companyId, contextType)`            | Context type filter              |
| `(companyId, branchId)`               | Branch dimensional reports       |
| `(companyId, warehouseId)`            | Warehouse dimensional reports    |
| `(companyId, vehicleId)`              | Vehicle dimensional reports      |
| `(companyId, tripId)`                 | Trip dimensional reports         |
| `(companyId, createdByEmployeeId)`    | Employee filter / mine queries   |
| `(companyId, deletedAt, expenseDate)` | Archived exclusion + sort        |

### Composite / check constraints (application + migration SQL)

- `expenseNumber` NOT NULL; never updated after insert
- `amount > 0` (CHECK constraint where supported, else domain rule)
- `contextType = COMPANY` ⇒ all context FKs NULL
- `contextType = BRANCH` ⇒ `branchId` NOT NULL and other context FKs NULL
- `contextType = WAREHOUSE` ⇒ `warehouseId` NOT NULL and others NULL
- `contextType = VEHICLE` ⇒ `vehicleId` NOT NULL and others NULL
- `contextType = TRIP` ⇒ `tripId` NOT NULL and others NULL
- `recordedAt` / `recordedByUserId` NOT NULL when `status = RECORDED`
- `cancelledAt` / `cancelledByUserId` / `cancellationReason` NOT NULL when `status = CANCELLED`
- Archived (`deletedAt IS NOT NULL`) expenses MUST NOT transition status or mutate header

### Audit strategy

Lifecycle actor columns on root (`recordedByUserId`, `cancelledByUserId`, etc.) plus structured
audit events via `expense-audit.service` (Pino). Attachment add/remove logged with expense id and
actor.

### Soft delete strategy

`deletedAt` set on archive (Recorded or Cancelled only). Default queries exclude archived rows unless
`includeArchived=true`. Expense Number remains searchable when archived.

### Future extensibility

Optional columns deferred (no P007 migration):

- `vendorId`, `vendorName` — vendor directory
- `approvalStatus`, `approvedByUserId`, `approvedAt` — approval workflow
- `budgetId` — budget tracking
- `recurrenceRuleId` — recurring expenses
- `externalAccountingId` — accounting integration
- `categoryId` — master category FK (replace free-form `category` gradually)

Core Expense Number, status lifecycle, single context model, and attachment child remain stable.

---

## ExpenseAttachment (Child Entity)

**Purpose**: Receipt photo (MVP) or future document evidence linked to one expense.

### Fields

| Field            | Type     | Nullable | Notes                                        |
| ---------------- | -------- | -------- | -------------------------------------------- |
| id               | UUID     | No       | PK                                           |
| expenseId        | UUID     | No       | FK → Expense (cascade delete on hard delete) |
| attachmentType   | enum     | No       | `PHOTO` (MVP); extensible                    |
| fileName         | string   | No       | Original filename                            |
| filePath         | string   | No       | Storage key/path                             |
| mimeType         | string   | No       | e.g. `image/jpeg`                            |
| fileSize         | int      | No       | Bytes                                        |
| uploadedByUserId | UUID     | No       | FK → User                                    |
| createdAt        | datetime | No       |                                              |

### Relationships

```text
Expense 1──* ExpenseAttachment
```

### Indexes

| Index                         | Purpose          |
| ----------------------------- | ---------------- |
| `(expenseId)`                 | Load attachments |
| `(expenseId, attachmentType)` | Filter by type   |

### Constraints

- MUST reference existing Expense in same Company (via parent)
- MUST NOT exist without parent expense
- Add/remove allowed per parent expense editability rules (Draft: creator + M/O; Recorded: M/O only;
  Cancelled: none)

### Future extensibility

- Additional `ExpenseAttachmentType` values: `PDF`, `INVOICE`, `OTHER`
- `caption`, `sortOrder` — deferred

---

## ExpenseStatus (Enum)

| Value     | Description                            |
| --------- | -------------------------------------- |
| DRAFT     | In progress; editable per role rules   |
| RECORDED  | Finalized spending; employee read-only |
| CANCELLED | Voided; immutable                      |

---

## ExpenseContextType (Enum)

| Value     | Description                     | FK required |
| --------- | ------------------------------- | ----------- |
| COMPANY   | Company-wide operational cost   | none        |
| BRANCH    | Cost attributed to a branch     | branchId    |
| WAREHOUSE | Cost attributed to a warehouse  | warehouseId |
| VEHICLE   | Cost attributed to a vehicle    | vehicleId   |
| TRIP      | Cost attributed to a field trip | tripId      |

---

## ExpenseAttachmentType (Enum)

| Value | Description (MVP)   |
| ----- | ------------------- |
| PHOTO | Receipt photo image |

---

## ExpenseNumberSequence (Supporting Entity)

**Purpose**: Atomic daily sequence per Company for Expense Number allocation.

| Field        | Type | Notes                         |
| ------------ | ---- | ----------------------------- |
| companyId    | UUID | PK part                       |
| sequenceDate | date | PK part; UTC date at creation |
| lastValue    | int  | Incremented atomically        |

Unique on `(companyId, sequenceDate)`.

---

## Relationship Diagram

```text
                    ┌─────────────┐
                    │   Company   │
                    └──────┬──────┘
                           │ 1
                           │ *
                    ┌──────▼──────┐
                    │   Expense   │◄──── Aggregate Root
                    └──────┬──────┘
           ┌───────────────┼───────────────┬──────────────┐
           │ *             │               │              │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌─────▼─────┐ ┌─────▼─────┐
    │ Attachment  │ │   Branch?   │ │Warehouse? │ │ Vehicle?  │
    │  (child)    │ │  (ref FK)   │ │  (ref FK) │ │  (ref FK) │
    └─────────────┘ └─────────────┘ └───────────┘ └───────────┘
                           │
                    ┌──────▼──────┐
                    │   Trip?     │
                    │  (ref FK)   │
                    └─────────────┘
```

### Ownership

| Entity                        | Owned by              | Notes                                     |
| ----------------------------- | --------------------- | ----------------------------------------- |
| Expense                       | Expense aggregate     | Lifecycle authority                       |
| ExpenseAttachment             | Expense aggregate     | No independent lifecycle                  |
| Branch/Warehouse/Vehicle/Trip | Respective aggregates | Referenced only; not deleted with expense |

---

## State Machine

```text
              create
                │
                ▼
         ┌─────────────┐
         │    DRAFT    │◄─── edit header / attachments (role rules)
         │  (editable) │
         └──────┬──────┘
                │
      ┌─────────┴─────────┐
      │ record            │ cancel (reason)
      ▼                   ▼
┌─────────────┐     ┌─────────────┐
│  RECORDED   │     │  CANCELLED  │ (terminal, immutable)
│ employee RO │     └─────────────┘
│ M/O edit OK │
└──────┬──────┘
       │ cancel (M/O, reason)
       ▼
┌─────────────┐
│  CANCELLED  │
└─────────────┘

Archive (soft): RECORDED or CANCELLED → deletedAt set (read-only thereafter)
```

### Allowed transitions

| From     | To        | Actors                             |
| -------- | --------- | ---------------------------------- |
| DRAFT    | RECORDED  | Creator (Employee), Manager, Owner |
| DRAFT    | CANCELLED | Creator (Employee), Manager, Owner |
| RECORDED | CANCELLED | Manager, Owner                     |

### Invalid transitions

- RECORDED → DRAFT (no reopen in MVP)
- CANCELLED → any other status
- Any transition on archived expense

### Editing rules

| Status    | Employee (own)            | Manager/Owner             |
| --------- | ------------------------- | ------------------------- |
| DRAFT     | Edit header + attachments | Edit all drafts           |
| RECORDED  | Read only                 | Edit header + attachments |
| CANCELLED | Read only                 | Read only                 |

---

## Prisma sketch (reference for implementation phase)

```prisma
enum ExpenseStatus {
  DRAFT
  RECORDED
  CANCELLED
}

enum ExpenseContextType {
  COMPANY
  BRANCH
  WAREHOUSE
  VEHICLE
  TRIP
}

enum ExpenseAttachmentType {
  PHOTO
}

model Expense {
  id                  String             @id @default(uuid())
  companyId           String
  expenseNumber       String
  expenseDate         DateTime
  category            String
  amount              Decimal            @db.Decimal(18, 2)
  description         String
  status              ExpenseStatus      @default(DRAFT)
  contextType         ExpenseContextType
  branchId            String?
  warehouseId         String?
  vehicleId           String?
  tripId              String?
  createdByUserId     String
  createdByEmployeeId String?
  updatedByUserId     String?
  recordedByUserId    String?
  recordedAt          DateTime?
  cancelledByUserId   String?
  cancelledAt         DateTime?
  cancellationReason  String?
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt
  deletedAt           DateTime?
  // relations ...
  @@unique([companyId, expenseNumber])
  @@index([companyId, status, deletedAt])
  @@index([companyId, expenseDate])
}

model ExpenseAttachment { /* see fields above */ }

model ExpenseNumberSequence { /* mirror TripNumberSequence */ }
```
