# Quickstart: Company & Identity Foundation

**Feature**: `002-company-identity-foundation`  
**Purpose**: Validate the Company & Identity Foundation end-to-end after implementation.

See also: [spec.md](./spec.md) | [plan.md](./plan.md) | [data-model.md](./data-model.md) | [contracts/openapi.yaml](./contracts/openapi.yaml)

## Prerequisites

- Running Scrappy API locally or in Docker
- Access to a clean test database
- API documentation or request client available

## Validation Scenario 1: Create Company with Owner

1. Send a `POST /api/v1/companies` request using valid company and Owner onboarding data.
2. Confirm the response indicates successful Company creation.
3. Confirm the response includes both Company identity and initial Owner identity.
4. Confirm the Owner belongs to the same Company that was created.

**Expected outcome**:

- One Company is created
- One Owner user is created
- Both records share the same Company boundary

## Validation Scenario 2: Authenticate Within Company Context

1. Use the created Owner identity to call `POST /api/v1/auth/login`.
2. Confirm the response returns an authenticated session for the correct Company.
3. Call `GET /api/v1/users/me` using the authenticated context.
4. Call `POST /api/v1/auth/refresh` using the refresh context.
5. Call `POST /api/v1/auth/logout`.
6. Retry `GET /api/v1/users/me` after logout.

**Expected outcome**:

- Login succeeds with valid credentials
- Current user view is returned only for the authenticated Company
- Refresh preserves the same Company context
- Logout invalidates continued protected access

## Validation Scenario 3: Tenant Isolation Enforcement

1. Create Company A and Company B.
2. Authenticate as a user from Company A.
3. Attempt to retrieve or update a Company B resource.
4. Attempt to link an Employee from Company A to a User from Company B.

**Expected outcome**:

- Cross-company access is rejected
- Cross-company linkage is rejected
- No protected resource is returned outside the authenticated Company boundary

## Validation Scenario 4: Employee Lifecycle and Linkage

1. Authenticate as an Owner or Manager inside a Company.
2. Create an Employee record.
3. View the Employee record.
4. Update selected Employee fields.
5. Link the Employee to a same-company User.
6. Archive the Employee.
7. Verify archived Employee behavior in active vs historical views.

**Expected outcome**:

- Employee lifecycle actions succeed for authorized same-company users
- Employee-to-User linking succeeds only within the same Company
- Archived Employees are excluded from active operations but remain historically referenceable

## Validation Scenario 5: Contract and Error Behavior

1. Submit invalid create/update payloads for Company and Employee endpoints.
2. Call protected endpoints without authentication.
3. Refresh using an invalid, expired, or revoked refresh context.
4. Attempt actions not allowed by role responsibility.

**Expected outcome**:

- Validation errors are returned consistently
- Unauthenticated requests are rejected
- Invalid refresh attempts are rejected
- Forbidden actions are rejected with client-safe error responses

## Acceptance Checklist

- [x] Company onboarding creates the Company and initial Owner together
- [x] Authenticated sessions remain bound to one Company
- [x] Logout and refresh follow expected lifecycle behavior
- [x] Employee CRUD and link-to-user actions honor Company isolation
- [x] Cross-company access is rejected in all tested scenarios
- [x] Archived resources are not hard-deleted
- [x] API behavior matches `contracts/openapi.yaml`
- [x] Product rules in `spec.md` are satisfied without redefining tenant ownership semantics
