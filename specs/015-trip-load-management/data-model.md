# Data Model: P006 Addendum — Trip Load Management

**Feature**: `015-trip-load-management`  
**Date**: 2026-07-14

## Overview

```text
Trip 1──0..1 TripLoad 1──* TripLoadItem
Trip 1──* Transaction   (reference only; not owned for mutation)
Trip 1──* Expense       (reference only; unchanged)
```

Trip Load is temporary operational cargo for one Trip. Not inventory.

## Trip (extension)

| Field                | Type    | Required | Default | Notes                                    |
| -------------------- | ------- | -------- | ------- | ---------------------------------------- |
| loadEnabled          | boolean | yes      | `false` | Form toggle: trip is using Trip Load     |
| strictLoadValidation | boolean | yes      | `false` | `true` = block on exceed; `false` = warn |

### Purpose

- `loadEnabled`: per-trip optionality without a Company feature flag.
- `strictLoadValidation`: outbound oversell behavior when validation applies.

### Business rules

- Defaults apply to new Draft trips.
- Enable Load → `loadEnabled = true` (Draft only).
- Disable Load → Draft only; clear TripLoad if present; `loadEnabled = false`.
- Creating TripLoad sets `loadEnabled = true` if not already.
- Started/Completed/Cancelled: flags and load are immutable (except Completing freezes history).
- Validation at transaction create uses current Trip flags + load items.

### Indexes

- Existing Trip indexes unchanged. Optional `(companyId, loadEnabled)` for ops reporting.

### Future extensibility

Later: `defaultWarehouseId`, barcode session id, without changing load item shape.

---

## TripLoad

| Field           | Type     | Required | Notes                    |
| --------------- | -------- | -------- | ------------------------ |
| id              | UUID     | yes      | PK                       |
| tripId          | UUID     | yes      | Unique — one load / trip |
| notes           | string   | no       | Free text                |
| createdByUserId | UUID     | yes      | Manager/Owner            |
| updatedByUserId | UUID     | no       | Last mutator             |
| createdAt       | datetime | yes      |                          |
| updatedAt       | datetime | yes      |                          |

### Purpose

Header for materials loaded before start.

### Relationships

| From     | To           | Cardinality | Notes                        |
| -------- | ------------ | ----------- | ---------------------------- |
| Trip     | TripLoad     | 1:0..1      | Unique `tripId`              |
| TripLoad | TripLoadItem | 1:N         | Cascade delete with TripLoad |

### Indexes / constraints

- **Unique**: `tripId`
- Index: `tripId`
- Trip must be same Company (enforced via trip lookup)

### Future extensibility

`originWarehouseId`, `loadedAt`, attachment refs — additive.

---

## TripLoadItem

| Field        | Type        | Required | Notes                                      |
| ------------ | ----------- | -------- | ------------------------------------------ |
| id           | UUID        | yes      | PK                                         |
| tripLoadId   | UUID        | yes      | Parent load                                |
| materialName | string      | yes      | Free text; unique per load when normalized |
| quantity     | decimal     | yes      | Loaded amount; `> 0`                       |
| unit         | enum/string | yes      | Align with `TransactionItemUnit`           |
| notes        | string      | no       | Line notes                                 |
| createdAt    | datetime    | yes      |                                            |
| updatedAt    | datetime    | yes      |                                            |

### Purpose

One loaded material line.

### Indexes / constraints

- Index: `(tripLoadId)`
- Unique composite: `(tripLoadId, normalizedMaterialName)` or app-level unique after
  trim+lower; DB unique on stored normalized column preferred at implement time
- Check: `quantity > 0`

### Quantity semantics

Compared to sum of `TransactionItem.weight` for OUTBOUND transactions on the Trip with same
normalized `materialName` and `unit`.

### Future extensibility

`barcode`, `sku`, `sourceLotId` — additive columns.

---

## Company Trip Load Settings (optional defaults)

| Field                       | Type    | Default | Notes                               |
| --------------------------- | ------- | ------- | ----------------------------------- |
| defaultStrictLoadValidation | boolean | false   | Copied onto Trip when enabling load |

No Company enable flag.

---

## State / lifecycle (load mutability)

| Trip status | loadEnabled / load / items           |
| ----------- | ------------------------------------ |
| DRAFT       | Full CRUD; enable/disable            |
| STARTED     | Read-only load; remaining calculated |
| COMPLETED   | Read-only                            |
| CANCELLED   | Read-only                            |

---

## Validation summary

- Unique normalized material per load
- quantity > 0; unit required
- Outbound validation: `loadEnabled` + match material/unit → compare quantity vs Σ weight
- Strict → reject; else warn
- Inbound: never validate against load
