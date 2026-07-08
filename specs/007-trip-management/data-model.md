# Data Model: Trip Management (P006)

**Feature**: `007-trip-management`  
**Depends on**: P001 Company, P002 Vehicle, P003 Employee, P004/P005 Transaction (`tripId`)

## Overview

P006 introduces `Trip` as a new aggregate root with child `TripMember` entities and supporting
`TripNumberSequence` for atomic numbering. Transactions and future Expenses reference Trip by ID;
they are not owned by the Trip aggregate.

## Trip (Aggregate Root)

**Purpose**: Coordinates field operations outside company locations—scheduling, vehicle assignment,
employee roster, and lifecycle gating for Outside transactions.

### Fields

| Field              | Type     | Nullable | Notes                                             |
| ------------------ | -------- | -------- | ------------------------------------------------- |
| id                 | UUID     | No       | PK                                                |
| companyId          | UUID     | No       | FK → Company; tenant scope                        |
| tripNumber         | string   | No       | Immutable; `TRIP-YYYYMMDD-000001`; unique/company |
| vehicleId          | UUID     | No       | FK → Vehicle                                      |
| status             | enum     | No       | `DRAFT`, `STARTED`, `COMPLETED`, `CANCELLED`      |
| scheduledStart     | datetime | No       | Planned departure                                 |
| actualStart        | datetime | Yes      | Set on start                                      |
| actualEnd          | datetime | Yes      | Set on complete                                   |
| origin             | string   | No       | Free text; max 500                                |
| destination        | string   | No       | Free text; max 500                                |
| notes              | string   | Yes      | Max 2000                                          |
| createdByUserId    | UUID     | Yes      | FK → User                                         |
| updatedByUserId    | UUID     | Yes      | FK → User                                         |
| startedByUserId    | UUID     | Yes      | FK → User                                         |
| completedByUserId  | UUID     | Yes      | FK → User                                         |
| cancelledByUserId  | UUID     | Yes      | FK → User                                         |
| cancellationReason | string   | Yes      | Required when cancelled                           |
| createdAt          | datetime | No       |                                                   |
| updatedAt          | datetime | No       |                                                   |
| deletedAt          | datetime | Yes      | Soft archive timestamp                            |

### Relationships

```text
Company 1──* Trip
Trip *──1 Vehicle
Trip 1──* TripMember
Trip 1──* Transaction (optional FK on Transaction.tripId — reference only)
User → createdByUserId, updatedByUserId, startedByUserId, completedByUserId, cancelledByUserId
```

### Indexes

| Index / constraint                                                         | Purpose                                              |
| -------------------------------------------------------------------------- | ---------------------------------------------------- |
| `(companyId, tripNumber)` UNIQUE                                           | Business identifier lookup                           |
| `(companyId, status, deletedAt)`                                           | Active list filters                                  |
| `(companyId, scheduledStart)`                                              | Date range queries                                   |
| `(companyId, vehicleId)`                                                   | Vehicle filter                                       |
| `(companyId, vehicleId)` UNIQUE WHERE status=STARTED AND deletedAt IS NULL | One active trip per vehicle (partial, SQL migration) |

### Constraints

- `tripNumber` NOT NULL; never updated after insert
- `actualStart` NOT NULL when `status IN (STARTED, COMPLETED)`
- `actualEnd` NOT NULL when `status = COMPLETED`
- `cancellationReason` NOT NULL when `status = CANCELLED`
- `vehicleId` MUST reference active Vehicle in same Company at create/start
- Archived (`deletedAt IS NOT NULL`) trips MUST NOT transition status

### Audit strategy

Lifecycle actor columns on root (`startedByUserId`, etc.) plus structured audit events via
`trip-audit.service`. Member changes audited while Draft only.

### Soft delete strategy

`deletedAt` set on archive (Completed/Cancelled only). Default queries exclude archived rows unless
`includeArchived=true`. Trip Number remains searchable when archived.

### Future extensibility

Optional columns deferred (no P006 migration):

- `originLatitude`, `originLongitude`, `destinationLatitude`, `destinationLongitude` — GPS
- `estimatedDistanceKm`, `actualDistanceKm` — mileage
- `routePolyline` — route optimization
- `geofenceId` — geofencing

Free-text origin/destination remain; coordinates added without breaking API contracts.

---

## TripMember (Child Entity)

**Purpose**: Links an Employee to a Trip with an operational role.

### Fields

| Field      | Type     | Nullable | Notes                                                                   |
| ---------- | -------- | -------- | ----------------------------------------------------------------------- |
| id         | UUID     | No       | PK                                                                      |
| tripId     | UUID     | No       | FK → Trip (cascade delete on trip hard delete; soft trip uses restrict) |
| employeeId | UUID     | No       | FK → Employee                                                           |
| role       | enum     | No       | `DRIVER`, `HELPER`, `BUYER`, `SUPERVISOR`                               |
| createdAt  | datetime | No       |                                                                         |
| updatedAt  | datetime | No       |                                                                         |

### Relationships

```text
Trip 1──* TripMember
TripMember *──1 Employee
```

### Indexes

| Index                         | Purpose                           |
| ----------------------------- | --------------------------------- |
| `(tripId, employeeId)` UNIQUE | No duplicate member per trip      |
| `(employeeId)`                | Member filter; active trip lookup |
| `(tripId)`                    | Load members with trip            |

### Constraints

- `employeeId` MUST be active Employee in same Company as Trip
- Mutations allowed only when parent Trip `status = DRAFT`
- At least one member MUST exist before parent can start

### Future extensibility

- Additional roles via enum extension
- `isPrimaryDriver` flag — deferred
- Per-member notes — deferred

---

## TripStatus (Enum)

| Value     | Description                                  |
| --------- | -------------------------------------------- |
| DRAFT     | Planning; editable                           |
| STARTED   | Active field operations                      |
| COMPLETED | Ended; no new transactions; expenses allowed |
| CANCELLED | Draft abandoned; immutable                   |

---

## TripNumberSequence (Supporting Entity)

**Purpose**: Atomic daily sequence per Company for Trip Number suffix.

| Field        | Type | Notes                         |
| ------------ | ---- | ----------------------------- |
| companyId    | UUID | FK → Company                  |
| sequenceDate | date | UTC calendar date at creation |
| lastSequence | int  | Last allocated suffix         |

**Unique**: `(companyId, sequenceDate)`

Infrastructure-only; not exposed via public API.

---

## TripNumber (Value Object — logical)

| Property     | Rule                                  |
| ------------ | ------------------------------------- |
| Format       | `TRIP-{YYYYMMDD}-{000001}`            |
| Generation   | At create, before commit              |
| Date source  | UTC date from `createdAt` at creation |
| Uniqueness   | Per Company                           |
| Immutability | Never updated                         |
| Cancelled    | Number retained                       |
| Archived     | Number retained                       |

---

## Relationship Diagram

```text
                    ┌─────────────┐
                    │   Company   │
                    └──────┬──────┘
                           │ 1
                           │
                           │ *
                    ┌──────▼──────┐         ┌─────────────┐
                    │    Trip     │ *────1  │   Vehicle   │
                    │ (aggregate  │         └─────────────┘
                    │    root)    │
                    └──────┬──────┘
                           │ 1
                           │ *
                    ┌──────▼──────┐         ┌─────────────┐
                    │ TripMember  │ *────1  │  Employee   │
                    └─────────────┘         └─────────────┘

        ┌─────────────┐
        │ Transaction │──── tripId (optional FK, reference only)
        └─────────────┘

        ┌─────────────┐
        │  Expense    │──── tripId (future FK, reference only)
        └─────────────┘
```

### Ownership

| Entity      | Owned by        | Notes                                       |
| ----------- | --------------- | ------------------------------------------- |
| Trip        | Trip aggregate  | Lifecycle authority                         |
| TripMember  | Trip aggregate  | No independent lifecycle                    |
| Transaction | Transaction agg | Trip referenced; not deleted with trip      |
| Expense     | Expense agg     | Future; references Trip                     |
| Vehicle     | Vehicle agg     | Status updated by Trip use cases            |
| Employee    | Employee agg    | On Trip derived; not stored on Employee row |

---

## State Machine

```text
                 create
                   │
                   ▼
            ┌─────────────┐
            │    DRAFT    │◄─── edit header / members (Manager/Owner)
            │  (editable) │
            └──────┬──────┘
                   │
         ┌─────────┴─────────┐
         │ start             │ cancel (reason required)
         ▼                   ▼
  ┌─────────────┐     ┌─────────────┐
  │   STARTED   │     │  CANCELLED  │ (terminal, read-only)
  │ vehicle     │     └─────────────┘
  │ IN_USE      │
  │ members     │
  │ On Trip     │
  └──────┬──────┘
         │ complete
         ▼
  ┌─────────────┐
  │  COMPLETED  │ (terminal for transactions; expenses OK)
  │ vehicle     │
  │ AVAILABLE*  │
  └─────────────┘

* Unless vehicle separately in MAINTENANCE/INACTIVE per P002

Invalid transitions:
- STARTED → DRAFT (no reopen in P006)
- STARTED → CANCELLED
- COMPLETED → any
- CANCELLED → any (except archive)
- Any → STARTED except from DRAFT
```

### Locking behavior

| Status    | Header edit | Members edit | Start | Complete | Cancel | Archive |
| --------- | ----------- | ------------ | ----- | -------- | ------ | ------- |
| DRAFT     | Yes         | Yes          | Yes   | No       | Yes    | No      |
| STARTED   | No          | No           | No    | Yes      | No     | No      |
| COMPLETED | No          | No           | No    | No       | No     | Yes     |
| CANCELLED | No          | No           | No    | No       | No     | Yes     |

### Reopen behavior

**None in P006.** Completed and Cancelled trips are terminal for lifecycle (archive only).

---

## Prisma schema sketch (implementation reference)

```prisma
enum TripStatus {
  DRAFT
  STARTED
  COMPLETED
  CANCELLED
}

enum TripMemberRole {
  DRIVER
  HELPER
  BUYER
  SUPERVISOR
}

model Trip {
  id                 String     @id @default(uuid())
  companyId          String
  tripNumber         String
  vehicleId          String
  status             TripStatus @default(DRAFT)
  scheduledStart     DateTime
  actualStart        DateTime?
  actualEnd          DateTime?
  origin             String
  destination        String
  notes              String?
  createdByUserId    String?
  updatedByUserId    String?
  startedByUserId    String?
  completedByUserId  String?
  cancelledByUserId  String?
  cancellationReason String?
  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt
  deletedAt          DateTime?

  company   Company      @relation(...)
  vehicle   Vehicle      @relation(...)
  members   TripMember[]
  transactions Transaction[]

  @@unique([companyId, tripNumber])
  @@index([companyId, status, deletedAt])
  @@index([companyId, scheduledStart])
  @@index([companyId, vehicleId])
}

model TripMember {
  id         String         @id @default(uuid())
  tripId     String
  employeeId String
  role       TripMemberRole
  createdAt  DateTime       @default(now())
  updatedAt  DateTime       @updatedAt

  trip     Trip     @relation(...)
  employee Employee @relation(...)

  @@unique([tripId, employeeId])
  @@index([employeeId])
}

model TripNumberSequence {
  companyId    String
  sequenceDate DateTime @db.Date
  lastSequence Int      @default(0)

  @@unique([companyId, sequenceDate])
}
```

Add `transactions Trip[]` on Company/Vehicle/Employee relations as needed. Extend `Transaction.tripId`
with `@relation(fields: [tripId], references: [id])`.
