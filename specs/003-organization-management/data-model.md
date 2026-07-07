# Data Model: Organization Management

**Feature**: `003-organization-management`  
**Date**: 2026-07-07

## Overview

P002 introduces three Company-owned operational resources: Branch, Warehouse, and Vehicle. All
resources inherit tenant isolation from P001 and use soft-delete via `deletedAt`.

## Base Resource Pattern

All organization resources (except Company itself) share:

| Field           | Type     | Required | Notes                                                     |
| --------------- | -------- | -------- | --------------------------------------------------------- |
| id              | UUID     | Yes      | Primary identifier                                        |
| companyId       | UUID     | Yes      | Mandatory tenant boundary from P001                       |
| createdAt       | datetime | Yes      | Audit timestamp                                           |
| updatedAt       | datetime | Yes      | Audit timestamp                                           |
| deletedAt       | datetime | No       | Soft-delete/archive marker                                |
| createdByUserId | UUID     | No       | Audit link (deferred wiring in P002 if not yet available) |
| updatedByUserId | UUID     | No       | Audit link (deferred wiring in P002 if not yet available) |

**Soft-delete strategy**: Archive sets `deletedAt` to current timestamp. Archived records are never
returned in default operational list queries.

---

## Branch

**Purpose**: Operational Company location for day-to-day business activities.

| Field           | Type     | Required | Default   | Nullable | Notes                 |
| --------------- | -------- | -------- | --------- | -------- | --------------------- |
| id              | UUID     | Yes      | generated | No       | Primary key           |
| companyId       | UUID     | Yes      | —         | No       | FK → Company          |
| name            | string   | Yes      | —         | No       | Display/business name |
| address         | string   | Yes      | —         | No       | Physical address      |
| contactNumber   | string   | Yes      | —         | No       | Contact phone         |
| status          | enum     | Yes      | `ACTIVE`  | No       | `ACTIVE`, `INACTIVE`  |
| createdAt       | datetime | Yes      | now       | No       | Audit                 |
| updatedAt       | datetime | Yes      | now       | No       | Audit                 |
| deletedAt       | datetime | No       | null      | Yes      | Archive marker        |
| createdByUserId | UUID     | No       | null      | Yes      | Optional audit        |
| updatedByUserId | UUID     | No       | null      | Yes      | Optional audit        |

**Relationships**:

- Many Branches belong to one Company
- Future: Employees may be assigned to Branches (not in P002)
- Future: Transactions may reference Branches (not in P002)

**Cardinality**: Company 1 → N Branches

**Indexes**:

- Primary: `id`
- Unique: `(companyId, name)` WHERE `deletedAt IS NULL`
- Index: `(companyId, status)`
- Index: `(companyId, deletedAt)`

**Constraints**:

- `companyId` required on every row
- Name unique among active (non-deleted) Branches within Company
- Archive sets `deletedAt` and `status = INACTIVE`

**Future extensibility**: `code`, `geoCoordinates`, `timezone`, `operatingHours` as optional fields
in later specs without breaking existing contracts.

---

## Warehouse

**Purpose**: Storage or operational facility owned by a Company.

| Field           | Type     | Required | Default   | Nullable | Notes                |
| --------------- | -------- | -------- | --------- | -------- | -------------------- |
| id              | UUID     | Yes      | generated | No       | Primary key          |
| companyId       | UUID     | Yes      | —         | No       | FK → Company         |
| name            | string   | Yes      | —         | No       | Warehouse name       |
| address         | string   | Yes      | —         | No       | Physical address     |
| contactNumber   | string   | Yes      | —         | No       | Contact phone        |
| status          | enum     | Yes      | `ACTIVE`  | No       | `ACTIVE`, `INACTIVE` |
| createdAt       | datetime | Yes      | now       | No       | Audit                |
| updatedAt       | datetime | Yes      | now       | No       | Audit                |
| deletedAt       | datetime | No       | null      | Yes      | Archive marker       |
| createdByUserId | UUID     | No       | null      | Yes      | Optional audit       |
| updatedByUserId | UUID     | No       | null      | Yes      | Optional audit       |

**Relationships**:

- Many Warehouses belong to one Company
- Future: Employees may be assigned to Warehouses (not in P002)
- Future: Inventory and Transactions may reference Warehouses (not in P002)

**Cardinality**: Company 1 → N Warehouses

**Indexes**:

- Primary: `id`
- Unique: `(companyId, name)` WHERE `deletedAt IS NULL`
- Index: `(companyId, status)`
- Index: `(companyId, deletedAt)`

**Constraints**:

- Same tenant and archive rules as Branch
- Name unique among active Warehouses within Company

**Future extensibility**: `capacity`, `warehouseType`, `branchId` linkage for multi-facility setups.

---

## Vehicle

**Purpose**: Company-owned vehicle used for logistics and future Trip operations.

| Field           | Type     | Required | Default     | Nullable | Notes                      |
| --------------- | -------- | -------- | ----------- | -------- | -------------------------- |
| id              | UUID     | Yes      | generated   | No       | Primary key                |
| companyId       | UUID     | Yes      | —           | No       | FK → Company               |
| plateNumber     | string   | Yes      | —           | No       | Vehicle plate identifier   |
| description     | string   | Yes      | —           | No       | Human-readable description |
| status          | enum     | Yes      | `AVAILABLE` | No       | See VehicleStatus          |
| createdAt       | datetime | Yes      | now         | No       | Audit                      |
| updatedAt       | datetime | Yes      | now         | No       | Audit                      |
| deletedAt       | datetime | No       | null        | Yes      | Archive marker             |
| createdByUserId | UUID     | No       | null        | Yes      | Optional audit             |
| updatedByUserId | UUID     | No       | null        | Yes      | Optional audit             |

**Relationships**:

- Many Vehicles belong to one Company
- Future: Trips may assign Vehicles (not in P002)
- Future: Expenses may reference Vehicles (not in P002)

**Cardinality**: Company 1 → N Vehicles

**Indexes**:

- Primary: `id`
- Unique: `(companyId, plateNumber)` WHERE `deletedAt IS NULL`
- Index: `(companyId, status)`
- Index: `(companyId, deletedAt)`

**Constraints**:

- Plate number unique among active Vehicles within Company
- Archive sets `deletedAt` and `status = INACTIVE`
- Vehicle may exist without Trip assignment

**Future extensibility**: `make`, `model`, `year`, `capacity`, `fuelType`, `odometer`, `assignedDriverId`.

---

## Enumerations

### BranchStatus / WarehouseStatus

- `ACTIVE` — resource is operational
- `INACTIVE` — resource is not available for operational use

### VehicleStatus

- `AVAILABLE` — ready for assignment/use
- `IN_USE` — currently assigned to active operational work
- `MAINTENANCE` — temporarily unavailable for maintenance
- `INACTIVE` — not available for operational use

## State Transitions

### Branch / Warehouse

```text
CREATE -> ACTIVE (deletedAt = null)
ACTIVE -> INACTIVE (manual update)
INACTIVE -> ACTIVE (manual update)
ACTIVE|INACTIVE -> ARCHIVED (deletedAt set, status = INACTIVE)
```

### Vehicle

```text
CREATE -> AVAILABLE (deletedAt = null)
AVAILABLE <-> IN_USE
AVAILABLE|IN_USE -> MAINTENANCE
MAINTENANCE -> AVAILABLE
any -> INACTIVE (manual)
any -> ARCHIVED (deletedAt set, status = INACTIVE)
```

## Operational Eligibility

A resource is **operationally eligible** when:

- `deletedAt IS NULL`
- Branch/Warehouse: `status = ACTIVE`
- Vehicle: `status = AVAILABLE`

Future modules (Trips, Transactions, Expenses) MUST use this eligibility rule when selecting
organization resources.

## Relationship Diagram

```text
Company (P001)
├── Branches (1:N)
├── Warehouses (1:N)
└── Vehicles (1:N)

Future (not P002):
Branch ──< EmployeeAssignment
Warehouse ──< EmployeeAssignment
Vehicle ──< Trip
Branch/Warehouse ──< Transaction
Branch/Warehouse/Vehicle ──< Expense
```
