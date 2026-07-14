# Research: P006 Addendum — Trip Load Management

**Feature**: `015-trip-load-management`  
**Date**: 2026-07-14

## 1. Trip Load inside the Trip aggregate

**Decision**: Model `TripLoad` and `TripLoadItem` as children of the Trip aggregate (owned by
Trip), not a standalone inventory bounded context.

**Rationale**: Load exists only for the lifetime of one Trip, locks with Trip status, and has no
meaning outside that outing. Aggregate boundary keeps mutations lifecycle-gated with Start /
Complete / Cancel.

**Alternatives considered**:

- Separate `trip-load` module aggregate with FK only — weaker consistency with trip status.
- Inventory catalog module — out of scope; loads are not stock.

## 2. Always-on feature vs per-trip `loadEnabled`

**Decision**: No Company-level feature kill switch. Trip Load APIs are always available.
Per-trip optionality is `Trip.loadEnabled` (default `false`) plus zero-or-one `TripLoad`.

**Rationale**: Product decision: always on, optional on the form. `loadEnabled` is the form
toggle; create/delete load and enable/disable endpoints drive it. Creating a TripLoad on Draft
auto-sets `loadEnabled = true`. Disable on Draft removes/clears load and sets `loadEnabled =
false`.

**Alternatives considered**:

- Company `tripLoadEnabled` — rejected (user: always on).
- Optionality only by presence of TripLoad row — workable, but plan requires explicit enable
  flag and Enable/Disable APIs for form UX.

## 3. Validation flags (`strictLoadValidation`)

**Decision**: Store `Trip.strictLoadValidation` (boolean, default `false` = warn). Validation
runs when `Trip.loadEnabled === true` AND transaction direction is Outbound AND a matching
load item exists. Strict → block; else → warn on success envelope.

**Company settings**: Implement `GET/PATCH /companies/me/trip-load-settings` as **company
defaults** (`defaultStrictLoadValidation`, optional `validationPreferred`) applied when a trip
enables load if trip flag not yet customized. Operative check at transaction time uses **Trip**
flags only (plan §6).

**Rationale**: Matches technical plan input; keeps Company settings from product spec without a
second transactional gate unless enabled later.

## 4. Quantity vs TransactionItem.weight

**Decision**: Trip Load Item stores `quantity` (Decimal). Remaining quantity and validation sum
`TransactionItem.weight` for matching OUTBOUND transactions linked to the Trip (same normalized
`materialName` + `unit`). Treat weight as the sold/quantity measure already used by P004.

**Rationale**: P004 items have `weight`, not a separate quantity field. Align load math with
existing ledger.

**Alternatives considered**: Add `quantity` on TransactionItem — out of scope for this addendum.

## 5. Material matching

**Decision**: Normalize material names: trim + case-insensitive. Unique material per TripLoad
under that normalization. Unit must match for validation/remaining; mismatch → skip validation
for that line.

## 6. Module placement

**Decision**: Implement under `src/modules/trip/` (domain entities, use cases, routes nested
under `/trips/:tripId/load`) rather than a new top-level module. Shared remaining-quantity /
validation helpers in `trip/domain` or `trip/application/services`. Hook transaction create use
case via injected `TripLoadValidationService`.

**Rationale**: Aggregate extension; avoid parallel module wiring; follows P006 structure.

## 7. Cascade and delete

**Decision**: TripLoad 1:1 Trip (unique `tripId`). TripLoadItem cascade delete with TripLoad.
Trip soft-delete (`deletedAt`) implies load is unreachable like other trip children.

## 8. Expenses and Analytics

**Decision**: No write coupling. Expenses unchanged. Analytics/reports may later project load
vs sold; out of MVP beyond optional summary API.

## 9. No Prisma in design docs

**Decision**: Fields/indexes/constraints in prose and tables only.
