# Research: Company & Identity Foundation

**Feature**: `002-company-identity-foundation`  
**Date**: 2026-07-07

## 1. Multi-tenant isolation strategy

**Decision**: Company is the hard tenant boundary for every protected resource. All application
services, repositories, policies, and queries must require `companyId` as part of protected
resource access.

**Rationale**: The product spec makes company isolation the foundational business rule. Making
company ownership explicit across layers prevents accidental cross-tenant access and establishes a
repeatable pattern for future modules.

**Alternatives considered**:

- Implicit tenant context only in middleware — rejected because repository and policy layers still
  need explicit isolation guarantees.
- Mixed global and tenant-owned resources — rejected for this foundation because it complicates
  ownership semantics too early.

## 2. Identity model separation

**Decision**: Keep `User` and `Employee` as separate domain models with an optional same-company
link between them.

**Rationale**: The spec requires employees to exist before being linked to a user, and not every
employee must authenticate. Separate models preserve business meaning and future extensibility for
workforce, payroll, and attendance.

**Alternatives considered**:

- Single combined user-employee record — rejected because it cannot naturally represent non-login
  employees and complicates lifecycle management.

## 3. Role strategy

**Decision**: Start with fixed foundational roles: `OWNER`, `MANAGER`, `EMPLOYEE`, represented as
business roles assigned inside one company.

**Rationale**: The spec requires stable foundational responsibilities but explicitly avoids
technical permission engine design. Fixed roles provide a clean baseline for policy enforcement and
future expansion.

**Alternatives considered**:

- Dynamic permission matrix from day one — rejected as premature complexity for the foundation.
- Global roles across companies — rejected because users operate in exactly one company in this
  foundation.

## 4. Company and archive lifecycle

**Decision**: Use soft-delete/archive lifecycle for Company and Employee, plus lifecycle flags for
User account status and session validity.

**Rationale**: The product spec requires archived resources to remain historically available and
not be permanently deleted. Soft-delete semantics also support future audit and reporting modules.

**Alternatives considered**:

- Hard delete — rejected by the business rules.
- Separate archive tables — rejected as unnecessary complexity at this stage.

## 5. Authentication session design

**Decision**: Use short-lived access tokens, longer-lived refresh tokens, server-side refresh token
tracking, and explicit logout/rotation rules.

**Rationale**: The constitution requires JWT access and refresh tokens with secure issuance,
rotation, and revocation semantics. Server-side tracking supports logout, invalidation, and future
session visibility.

**Alternatives considered**:

- Stateless refresh tokens with no persistence — rejected because logout and revocation become weak.
- Session-only cookie auth — rejected because the constitution explicitly standardizes JWT access
  and refresh tokens.

## 6. Password handling strategy

**Decision**: Store only bcrypt password hashes, never plaintext credentials, and enforce password
validation before hash creation.

**Rationale**: Required by the constitution and aligned with the product spec's identity
foundation.

**Alternatives considered**:

- Plaintext or reversible encryption — rejected as insecure.
- Deferring password policy — rejected because Owner onboarding and login are in scope.

## 7. API surface and versioning

**Decision**: Use versioned REST resources under `/api/v1`, plural resource naming, action
sub-routes only where lifecycle or linkage actions are not natural CRUD (for example,
`/employees/{employeeId}/user-link`).

**Rationale**: The product spec requires reusable contracts for future modules. Versioning and
consistent resource naming reduce future breaking changes.

**Alternatives considered**:

- Unversioned URIs — rejected because the foundation will be extended heavily.
- RPC-style naming for everything — rejected because the spec asks for REST resources.

## 8. Request validation strategy

**Decision**: Validate request body, params, and query at the presentation boundary with Zod;
optionally validate outbound response DTOs on high-risk endpoints and shared envelopes.

**Rationale**: Required by the constitution. Boundary validation keeps controllers thin and avoids
invalid data entering use cases.

**Alternatives considered**:

- Validation only in services — rejected because it mixes transport concerns with business logic.
- No response validation — partially rejected; DTO contracts still need strong guarantees.

## 9. Testing strategy

**Decision**: Use Vitest for unit and integration tests; use Supertest for HTTP contract coverage;
use isolated test fixtures and a dedicated test database strategy for repository/integration
coverage.

**Rationale**: Matches the constitution and current platform baseline. This gives fast unit tests
for policies/services and end-to-end confidence for protected routes.

**Alternatives considered**:

- Unit-only testing — rejected because tenant isolation and auth behavior require integration
  coverage.
- Full E2E browser testing — rejected; backend API foundation does not require it.

## 10. Module organization

**Decision**: Organize the codebase by business module (`company`, `auth`, `user`, `employee`) with
clean-architecture layering inside each module, plus shared cross-cutting support.

**Rationale**: The user asked for a backend foundation that future modules can extend without major
architectural change. Domain-driven module boundaries preserve ownership and keep future work local.

**Alternatives considered**:

- Pure layer-first structure only — rejected because feature ownership becomes diffuse as modules
  grow.
