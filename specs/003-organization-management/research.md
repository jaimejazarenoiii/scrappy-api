# Research: Organization Management

**Feature**: `003-organization-management`  
**Date**: 2026-07-07

## 1. Module decomposition strategy

**Decision**: Implement three sibling business modules — `branch`, `warehouse`, and `vehicle` — each
with the same internal Clean Architecture layering used in P001.

**Rationale**: Branches, Warehouses, and Vehicles share tenant and lifecycle patterns but have
different field models and validation rules. Separate modules keep responsibilities clear while
reusing shared tenant, policy, pagination, and audit primitives from P001.

**Alternatives considered**:

- Single `organization` module with sub-resources — rejected because it would create an oversized
  module with mixed validation and policy logic.
- Flat resources in `shared/` — rejected because each resource has distinct business meaning and
  future extension points.

## 2. Soft-delete and archive semantics

**Decision**: Use `deletedAt` as the archive marker for Branch, Warehouse, and Vehicle. Archived
records set `deletedAt` and transition to an inactive operational state. No hard deletes.

**Rationale**: P002 product rules require retained historical records and exclusion from normal
operational lists. `deletedAt` aligns with the platform direction established during P001 evolution
and supports future reporting without separate archive tables.

**Alternatives considered**:

- Status-only archive (`ARCHIVED`) without `deletedAt` — rejected because it weakens audit/history
  semantics and diverges from the platform soft-delete direction.
- Separate archive tables — rejected as unnecessary complexity for this phase.

## 3. Status modeling for location resources vs vehicles

**Decision**:

- Branch and Warehouse use `ACTIVE` / `INACTIVE` operational status.
- Vehicle uses `AVAILABLE`, `IN_USE`, `MAINTENANCE`, `INACTIVE`.

**Rationale**: The product spec defines distinct vehicle lifecycle states while location resources
only require operational availability. Separating these enums prevents overloading one status model.

**Alternatives considered**:

- Shared status enum for all resources — rejected because vehicle operational states are
  materially different from branch/warehouse availability.

## 4. Uniqueness constraints

**Decision**:

- Branch name unique per `(companyId, name)` where `deletedAt IS NULL`
- Warehouse name unique per `(companyId, name)` where `deletedAt IS NULL`
- Vehicle plate number unique per `(companyId, plateNumber)` where `deletedAt IS NULL`

**Rationale**: Product rules require company-scoped uniqueness while allowing name/plate reuse after
archival through soft-delete partial uniqueness patterns.

**Alternatives considered**:

- Global plate uniqueness — rejected; tenant boundary is Company.
- Unique including archived rows — rejected; would block legitimate re-creation after archive.

## 5. List endpoint behavior

**Decision**: Default list endpoints return only non-archived (`deletedAt IS NULL`) operational
records for the authenticated Company. Support pagination, search, filtering, and sorting using P001
conventions.

**Rationale**: Spec requires archived resources to be excluded from normal operational lists.
Explicit default behavior avoids client ambiguity.

**Alternatives considered**:

- Include archived by default with filter opt-out — rejected as contrary to product rules.

## 6. Authorization approach

**Decision**: Reuse P001 role middleware and tenant context. Apply resource policy:

- `OWNER`: create, read, update, archive
- `MANAGER`: create, read, update, archive
- `EMPLOYEE`: read only (list + get)

**Rationale**: Product spec assigns management to Owners and Managers; Employees may view resources
for operational needs. P001 already provides role and tenant enforcement primitives.

**Alternatives considered**:

- Fine-grained permission engine — deferred to future workforce/permissions specs.

## 7. Operational eligibility rules

**Decision**: A resource is operationally selectable only when `deletedAt IS NULL` and status is
active/available (Branch/Warehouse: `ACTIVE`; Vehicle: `AVAILABLE`).

**Rationale**: Spec states archived and inactive resources cannot be used for future operational
records. This rule will be enforced via domain helpers and exported for future modules.

**Alternatives considered**:

- Eligibility checked only at future module level — rejected; foundation module should define the
  canonical rule now.

## 8. API and validation reuse

**Decision**: Extend P001 patterns for Zod schemas, DTOs, standard envelope, OpenAPI assembly,
tenant-scoped repositories, and Supertest API tests. No new architectural standards.

**Rationale**: Constitution and P001 plan already define the required technical baseline. P002 adds
resource-specific schemas and policies only.

**Alternatives considered**:

- New response format or auth scheme — rejected; would break platform consistency.

## 9. Future relationship strategy

**Decision**: Add nullable foreign-key-ready identifiers only where needed now (`companyId` on all
resources). Defer explicit relations to Employees, Trips, Transactions, and Expenses to future
modules via reference IDs and operational eligibility checks.

**Rationale**: P002 scope excludes assignment workflows. Designing stable resource IDs and
operational eligibility now is sufficient for downstream modules.

**Alternatives considered**:

- Pre-creating join tables for future features — rejected as YAGNI violation.
