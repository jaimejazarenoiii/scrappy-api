# Data Model: Transaction Settlement (P005)

**Feature**: `006-transaction-settlement`  
**Extends**: P004 Transaction aggregate (`005-transaction-management`)

## Overview

P005 extends the `Transaction` aggregate root with immutable Transaction Number, settlement
status values, submission and payment metadata, and audit actor fields. Child entities (Items,
Attachments, Assignments) are unchanged structurally; their mutability rules extend per root status.

No new aggregate roots. Receipt is a read model, not persisted.

## Transaction (Aggregate Root — Extended)

**Purpose**: Operational and financial buying/selling record with settlement lifecycle.

### New and extended fields

| Field              | Type     | Nullable | Set when              | Notes                                             |
| ------------------ | -------- | -------- | --------------------- | ------------------------------------------------- |
| transactionNumber  | string   | No       | Create                | Immutable; unique per `companyId`                 |
| status             | enum     | No       | Lifecycle transitions | `DRAFT`, `READY_FOR_PAYMENT`, `PAID`, `CANCELLED` |
| submittedAt        | datetime | Yes      | Finish (submit)       | When Employee submits for settlement              |
| submittedByUserId  | UUID     | Yes      | Finish                | FK → User                                         |
| paidAt             | datetime | Yes      | Settle                | Settlement timestamp                              |
| paidByUserId       | UUID     | Yes      | Settle                | FK → User; settling Manager/Owner                 |
| cancelledAt        | datetime | Yes      | Cancel                | Existing P004 field                               |
| cancelledByUserId  | UUID     | Yes      | Cancel                | New; FK → User                                    |
| cancellationReason | string   | Yes      | Cancel                | Existing P004 field                               |
| reopenedAt         | datetime | Yes      | Reopen                | Last reopen timestamp (audit)                     |
| reopenedByUserId   | UUID     | Yes      | Reopen                | FK → User (Owner)                                 |
| reopenReason       | string   | Yes      | Reopen                | Required on reopen; audit only                    |

All P004 fields (`direction`, `partyName`, `locationType`, `tripId`, `deletedAt`, etc.) unchanged.

### Transaction Number

| Property     | Rule                                                             |
| ------------ | ---------------------------------------------------------------- |
| Format IN    | `IN-{YYYYMMDD}-{000001}` — six-digit zero-padded sequence        |
| Format OUT   | `OUT-{YYYYMMDD}-{000001}`                                        |
| Date source  | `transactionDate` calendar date at creation (UTC date component) |
| Sequence     | Increments per `(companyId, direction, sequenceDate)`            |
| Uniqueness   | Unique `(companyId, transactionNumber)`                          |
| Immutability | Never updated after assignment                                   |
| Cancelled    | Number retained; still searchable                                |
| Reopened     | Number retained; `paidAt`/`paidByUserId` cleared on reopen       |

### Status enum

| Value             | Editable by Employee | Editable by Manager/Owner | Terminal |
| ----------------- | -------------------- | ------------------------- | -------- |
| DRAFT             | Yes (if assigned)    | Yes                       | No       |
| READY_FOR_PAYMENT | No                   | Yes                       | No       |
| PAID              | No                   | No (Owner reopen only)    | No*      |
| CANCELLED         | No                   | No                        | Yes      |

\*Paid is financially terminal until Owner reopen.

### Indexes (new)

| Index                                   | Purpose                               |
| --------------------------------------- | ------------------------------------- |
| `(companyId, transactionNumber)` UNIQUE | Lookup and uniqueness enforcement     |
| `(companyId, status, deletedAt)`        | Extended status filter (existing idx) |
| `(companyId, paidAt)`                   | Settlement date reports (future)      |
| `(companyId, submittedAt)`              | Submission queue ordering             |

### Constraints

- `transactionNumber` NOT NULL after migration backfill
- `paidAt` and `paidByUserId` both NULL or both NOT NULL when `status = PAID`
- `submittedAt` and `submittedByUserId` both NULL or both NOT NULL when
  `status IN (READY_FOR_PAYMENT, PAID)` (Paid retains submission metadata)
- `status = CANCELLED` implies `cancelledAt IS NOT NULL`
- `status = PAID` implies `paidAt IS NOT NULL`
- Archived (`deletedAt IS NOT NULL`) transactions MUST NOT transition status

### Future extensibility

- `tripId` remains optional for P006 Trip enforcement
- `paymentReference` column reserved in future for bank/gateway reference (not P005)
- `TransactionStatusHistory` table can be added later without changing root fields

## TransactionNumberSequence (Supporting entity)

**Purpose**: Atomic daily sequence allocation per Company and direction.

| Field        | Type | Notes                               |
| ------------ | ---- | ----------------------------------- |
| companyId    | UUID | FK → Company                        |
| direction    | enum | `INBOUND` \| `OUTBOUND`             |
| sequenceDate | date | Calendar date for suffix grouping   |
| lastSequence | int  | Last allocated suffix (starts at 0) |

**Unique**: `(companyId, direction, sequenceDate)`

Not exposed via public API; infrastructure-only.

## TransactionItem, TransactionAttachment, TransactionEmployeeAssignment

Unchanged schema. Mutability rules extended:

| Root status       | Item/attachment mutations          |
| ----------------- | ---------------------------------- |
| DRAFT             | Per P004 (Employee assigned / Mgr) |
| READY_FOR_PAYMENT | Manager/Owner only                 |
| PAID              | None                               |
| CANCELLED         | None                               |

## Receipt (Read Model — not persisted)

**Purpose**: Settlement artifact for Paid transactions.

| Field group       | Source                                             |
| ----------------- | -------------------------------------------------- |
| transactionNumber | Transaction.transactionNumber                      |
| company           | Company (name, contactNumber, email, address)      |
| directionLabel    | Mapped from Transaction.direction (BUY/SELL)       |
| partyName         | Transaction.partyName                              |
| transactionDate   | Transaction.transactionDate                        |
| items             | TransactionItem[] with line totals                 |
| grandTotal        | Sum of item totals                                 |
| paidByDisplayName | Resolved from User/Employee linked to paidByUserId |
| paidAt            | Transaction.paidAt                                 |

## State machine

```text
                    ┌─────────────┐
         create     │    DRAFT    │◄────────────────────────────┐
        ──────────► │  (editable) │                               │
                    └──────┬──────┘                               │
                           │ finish (Employee)                   │ return-to-draft
                           ▼                                     │ (Manager/Owner)
                    ┌─────────────┐                               │
                    │    READY    │───────────────────────────────┘
                    │ FOR PAYMENT │
                    │ (mgr edit)  │
                    └──────┬──────┘
                           │ settle (Manager/Owner)
                           ▼
                    ┌─────────────┐     reopen (Owner)      ┌─────────────┐
                    │    PAID     │ ───────────────────────►│    READY    │
                    │  (locked)   │                         │ FOR PAYMENT │
                    └─────────────┘                         └─────────────┘

DRAFT / READY_FOR_PAYMENT ──cancel──► CANCELLED (terminal, read-only)
PAID ──cancel──► ✗ forbidden
```

## Relationships (unchanged)

```text
Company 1──* Transaction
Transaction 1──* TransactionItem
Transaction 1──* TransactionAttachment
Transaction *──* Employee (via TransactionEmployeeAssignment)
Transaction *──0..1 Branch (when BRANCH)
Transaction *──0..1 Warehouse (when WAREHOUSE)
User → submittedByUserId, paidByUserId, cancelledByUserId, reopenedByUserId
```
