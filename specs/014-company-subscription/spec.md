# Feature Specification: P011 — Company Subscription Management

**Feature Branch**: `[014-company-subscription]`

**Created**: 2026-07-13

**Status**: Draft

**Input**: User description: "Create Product Specification P011 - Company Subscription Management for Scrappy. Manual administrator-managed subscriptions control Company access. Online payments and billing automation are out of scope. Business requirements only."

## Vision

Provide a centralized subscription management capability that controls whether a Company may access Scrappy.

Maintain a complete, immutable subscription history for each Company while keeping a single current subscription status that authentication can check quickly and consistently.

For the MVP, Scrappy Administrators manage subscriptions manually. Online payments, billing automation, invoices, payment gateways, and recurring billing are out of scope.

**Purpose**:

- Allow Scrappy Administrators to create, renew, expire, and suspend subscriptions and to view subscription history.
- Automatically control Company access based on current subscription status.
- Preserve full historical subscription records without modifying or deleting past periods.

**Scope**:

- Company Subscription create, view, renew, expire, suspend
- Subscription history (immutable)
- Company current subscription status
- Authentication gating by subscription status
- REST resource contracts, validation rules, and measurable acceptance criteria

**Non-goals**:

- Online payments, billing portals, payment gateways, automatic renewals, invoices
- Subscription product catalogs, coupons, usage-based billing
- Company Owner/Manager/Employee ability to create or change subscriptions
- Frontend-specific requirements
- Redefining Company, User, Employee, Organization, Workforce, Transaction, Trip, Expense, Analytics, Reports, or Activity Log foundations from P001–P010

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Gate Login by Subscription Status (Priority: P1)

When a user attempts to log in, Scrappy must allow access only if the Company is currently entitled to use the product.

**Why this priority**: Access control is the core business value of subscriptions; without login gating, subscription status has no operational effect.

**Independent Test**: Place a Company in an allowed status and confirm users can log in; place the same Company in a blocked status and confirm login is denied for all Company users.

**Acceptance Scenarios**:

1. **Given** a Company with current subscription status Trial, Active, or Grace Period, **When** a valid User of that Company logs in, **Then** authentication proceeds under existing identity rules.
2. **Given** a Company with current subscription status Expired or Suspended, **When** any User of that Company attempts to log in, **Then** login is denied and the user is informed that the company subscription does not allow access.
3. **Given** a Company that moves from Active to Expired, **When** previously valid users attempt to log in, **Then** login is denied until a Scrappy Administrator restores an allowed status.

---

### User Story 2 - Create Subscription and Set Company Status (Priority: P1)

A Scrappy Administrator creates a subscription period for a Company so the Company can (or continues to) access Scrappy.

**Why this priority**: Creating a subscription is the primary way Companies become entitled and is required before history and renewals have meaning.

**Independent Test**: As Scrappy Administrator, create a non-overlapping subscription with plan name, start/end dates, status, and optional notes; confirm the subscription appears in history and the Company’s current subscription status reflects the new entitlement.

**Acceptance Scenarios**:

1. **Given** a Company with no active subscription period, **When** a Scrappy Administrator creates a valid subscription (plan name, start date, end date, status, optional notes), **Then** the subscription is recorded, belongs only to that Company, and the Company’s current subscription status is updated accordingly.
2. **Given** a Company that already has an Active subscription, **When** a Scrappy Administrator attempts to create another Active subscription that would leave two Active periods, **Then** the create is rejected.
3. **Given** existing subscription periods for a Company, **When** a Scrappy Administrator attempts to create a subscription whose date range overlaps an existing period, **Then** the create is rejected.
4. **Given** a Company Owner, Manager, or Employee, **When** they attempt to create a subscription, **Then** the action is denied.

---

### User Story 3 - Renew Subscription (Priority: P2)

A Scrappy Administrator renews a Company’s entitlement by adding a new non-overlapping subscription period after (or succeeding) the current one, without altering historical records.

**Why this priority**: Renewal is the standard ongoing commercial operation after initial create and is needed to keep paying Companies active over time.

**Independent Test**: With an existing Active or near-ending subscription, renew with a new period; confirm a new history entry is created, prior subscriptions remain unchanged, and Company status becomes Active (or the renewal target status).

**Acceptance Scenarios**:

1. **Given** a Company with an existing subscription history, **When** a Scrappy Administrator renews with a valid new start/end period that does not overlap history, **Then** a new subscription record is created, previous records remain unchanged, and Company current status reflects the renewed entitlement.
2. **Given** a renewal request whose dates overlap an existing subscription, **When** the Administrator submits it, **Then** the renewal is rejected.
3. **Given** a successful renewal, **When** history is viewed, **Then** both the prior and new subscription periods are visible and prior periods are immutable.

---

### User Story 4 - Expire or Suspend Subscription (Priority: P2)

A Scrappy Administrator ends or freezes Company access by expiring or suspending the current entitlement.

**Why this priority**: Operators must be able to stop access for non-payment or policy reasons without destroying history.

**Independent Test**: Expire or suspend an entitled Company; confirm Company status changes, login becomes blocked for Expired/Suspended, and historical subscription rows remain intact.

**Acceptance Scenarios**:

1. **Given** a Company with Trial, Active, or Grace Period status, **When** a Scrappy Administrator expires the current entitlement, **Then** Company current status becomes Expired and users can no longer log in.
2. **Given** a Company with Trial, Active, or Grace Period status, **When** a Scrappy Administrator suspends the Company subscription, **Then** Company current status becomes Suspended and users can no longer log in.
3. **Given** an expire or suspend action, **When** subscription history is viewed, **Then** historical subscription records are still present and unchanged except for allowed current-status reflection rules defined for the active period’s status field where applicable.
4. **Given** a Company Owner, **When** they attempt to expire or suspend their own Company subscription, **Then** the action is denied.

---

### User Story 5 - View Current Status and History (Priority: P3)

Scrappy Administrators (and appropriately scoped Company readers of status, if exposed) can view current subscription status and full subscription history for accountability and support.

**Why this priority**: Visibility enables support and auditing; it does not by itself grant or revoke access.

**Independent Test**: Create multiple sequential subscriptions for a Company; view history in chronological order; view current company subscription status independently of raw history rows.

**Acceptance Scenarios**:

1. **Given** a Company with multiple historical subscriptions, **When** a Scrappy Administrator views subscription history, **Then** all periods are listed with plan name, start date, end date, status, and notes, and none are missing.
2. **Given** a Company, **When** current subscription status is requested by an authorized party, **Then** exactly one current operational status is returned (Trial, Active, Grace Period, Expired, or Suspended).
3. **Given** historical subscriptions, **When** any party attempts to edit or delete a historical subscription record, **Then** the action is not supported.

---

### Role Expectations

#### Scrappy Administrator

- May create, renew, expire, and suspend Company subscriptions.
- May view any Company’s current subscription status and full subscription history.
- Is the only role that may change subscription records or Company subscription status through subscription management actions.
- Is distinct from Company Owner, Manager, and Employee identities.

#### Company Owner

- May use Scrappy when the Company status is Trial, Active, or Grace Period.
- May not create, renew, expire, suspend, or otherwise modify subscriptions.
- May be shown current Company subscription status for awareness (read-only), if exposed by product policy; cannot change it.

#### Manager

- May use Scrappy when the Company status is Trial, Active, or Grace Period.
- May not manage subscriptions.
- Experiences the same login denial as other Company users when status is Expired or Suspended.

#### Employee

- May use Scrappy when the Company status is Trial, Active, or Grace Period (subject to existing employee account and workforce rules).
- May not manage subscriptions.
- Cannot log in when Company status is Expired or Suspended.

---

### Edge Cases

- What happens when start date is after end date?
- What happens when renewal is attempted while an Active subscription already covers overlapping dates?
- What happens when expire/suspend is requested for a Company already Expired or Suspended?
- What happens when a Company has history but no current Active period and status is still inconsistently marked Active?
- What happens when login succeeds for credentials but Company is Suspended?
- What happens when notes exceed reasonable length or plan name is blank?
- What happens when Company Owners attempt subscription management endpoints?
- What happens when Grace Period is set—do users still authenticate? (Yes: Grace Period is an allowed access status; Company and Users are `ACTIVE`.)
- What happens when Expire/Suspend runs—are Company and User accounts inactivated? (Yes: Company and all Users → `INACTIVE`, sessions revoked.)
- What happens when entitlement is restored via create/renew—are accounts reactivated? (Yes: Company and all Users → `ACTIVE`.)
- What happens to a user who was manually inactive before expire, then restore runs? (Restored to `ACTIVE` with all peers; re-disable individually if needed.)

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow Scrappy Administrators to create a Subscription for a Company with plan name, start date, end date, status, and optional notes.
- **FR-002**: System MUST allow Scrappy Administrators to renew a Company’s entitlement by creating a new Subscription period without modifying historical Subscriptions.
- **FR-003**: System MUST allow Scrappy Administrators to expire a Company’s current entitlement such that Company current subscription status becomes Expired.
- **FR-004**: System MUST allow Scrappy Administrators to suspend a Company’s entitlement such that Company current subscription status becomes Suspended.
- **FR-005**: System MUST allow Scrappy Administrators to view a Company’s full Subscription history.
- **FR-006**: System MUST allow viewing of a Company’s current subscription status as exactly one of: Trial, Active, Grace Period, Expired, Suspended.
- **FR-007**: Every Subscription MUST belong to exactly one Company.
- **FR-008**: A Company MUST be allowed multiple historical Subscriptions over time.
- **FR-009**: At most one Subscription MAY be Active for a Company at any time.
- **FR-010**: Subscription date periods for the same Company MUST NOT overlap.
- **FR-011**: Historical Subscriptions MUST be immutable (no update or delete of past records).
- **FR-012**: Company current subscription status MUST reflect subscription management outcomes (create, renew, expire, suspend).
- **FR-013**: During login, the system MUST validate Company subscription status in addition to existing user (and employee, if applicable) checks.
- **FR-014**: Users of Companies with status Trial, Active, or Grace Period MUST be allowed to authenticate (subject to existing identity rules).
- **FR-015**: Users of Companies with status Expired or Suspended MUST NOT be allowed to authenticate.
- **FR-016**: Only Scrappy Administrators MUST be able to manage Subscriptions; Company Owners, Managers, and Employees MUST NOT.
- **FR-017**: Subscription management actions that violate date, status, overlap, or business rules MUST be rejected with clear validation feedback.
- **FR-018**: When Company subscription status becomes a **blocked** entitlement (`Expired` or `Suspended`), the system MUST set the Company account status to `INACTIVE` and set all Users of that Company to `INACTIVE`, and MUST revoke their refresh sessions.
- **FR-019**: When Company subscription status becomes an **allowed** entitlement (`Trial`, `Active`, or `Grace Period`), the system MUST set the Company account status to `ACTIVE` and set all Users of that Company to `ACTIVE`.
- **FR-020**: Account lifecycle cascading (FR-018 / FR-019) MUST run as part of the same subscription management outcomes that change `subscriptionStatus` (create, renew, expire, suspend, and any admin transition into an allowed or blocked status).

### Key Entities

- **Company (extension)**: Existing Company gains a current operational subscription status used for access control. Company account status (`ACTIVE`/`INACTIVE`) is kept in sync with blocked vs allowed subscription entitlement.
- **Subscription**: A dated entitlement period for one Company, including plan name, start date, end date, status, and optional notes. Multiple Subscriptions form an immutable history for the Company.
- **Company Subscription Status**: The single current operational status for a Company: Trial, Active, Grace Period, Expired, or Suspended.
- **User (affected)**: Tenant user account status is bulk-updated when subscription entitlement is blocked or restored.
- **Scrappy Administrator**: Platform operator identity authorized to manage subscriptions across Companies (not a Company Owner/Manager/Employee role).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of login attempts for Companies in Expired or Suspended status are denied.
- **SC-002**: 100% of login attempts for Companies in Trial, Active, or Grace Period status are allowed to proceed past subscription checks (subject to existing credential and account rules).
- **SC-003**: Scrappy Administrators can create a valid subscription and see it in history within one management session without altering prior history rows.
- **SC-004**: Overlapping subscription periods are rejected 100% of the time.
- **SC-005**: Attempts by Company Owners, Managers, or Employees to create, renew, expire, or suspend subscriptions are denied 100% of the time.
- **SC-006**: After expire or suspend, Company current subscription status matches the action outcome, Company account status is `INACTIVE`, all Company users are `INACTIVE`, sessions are revoked, and subsequent logins for that Company fail until an allowed status is restored.
- **SC-007**: For a Company with three sequential historical periods, history view returns all three periods with no missing or altered past records.
- **SC-008**: After create/renew (or other transition) into Trial, Active, or Grace Period, Company account status is `ACTIVE` and all Company users are `ACTIVE`.

## Assumptions

- Scrappy Administrators are platform operators distinct from Company Owner, Manager, and Employee accounts.
- MVP subscription lifecycle changes (create, renew, expire, suspend, and placement into Trial or Grace Period) are performed manually by Scrappy Administrators; automatic calendar-driven transitions may be added later without changing the subscription model.
- Grace Period is an allowed access status (users may still log in), used for temporary continued access after commercial issues or near end-of-term handling.
- New Companies may be placed in Trial by Administrator action (or an agreed onboarding default) before becoming Active.
- Company account status (`ACTIVE`/`INACTIVE`) and User account status are **synchronized with subscription entitlement**: blocked subscription → company + users `INACTIVE`; allowed subscription → company + users `ACTIVE`. This is intentional cascading, not an independent parallel gate.
- Restoring entitlement reactivates **all** Company users to `ACTIVE`. Operators who need a specific user disabled afterward must disable that user again after restore.
- Company Owners may receive read-only visibility of current status for support clarity; they still cannot mutate subscriptions.
- Online payments and billing automation remain future work and are not required for MVP acceptance.

## Validation Rules

### Subscription validation

- Plan name is required and must be a non-empty value within an agreed maximum length.
- Status on a Subscription must be one of the allowed subscription period statuses used by the business (aligned with Company operational statuses as applicable to the period).
- Notes are optional and, when present, must respect an agreed maximum length.

### Date validation

- Start date is required.
- End date is required.
- Start date must be on or before end date.
- Renewal and create periods must use coherent calendar dates (no inverted ranges).

### Status validation

- Company current subscription status must be one of: Trial, Active, Grace Period, Expired, Suspended.
- Expire sets Company subscription status to Expired **and** cascades Company + Users to `INACTIVE` (with session revoke).
- Suspend sets Company subscription status to Suspended **and** cascades Company + Users to `INACTIVE` (with session revoke).
- Create/renew that establishes entitlement sets Company subscription status to the intended allowed status (typically Active or Trial / Grace Period as chosen by the Administrator within rules) **and** cascades Company + Users to `ACTIVE`.

### Overlap validation

- A new or renewed Subscription period must not overlap any existing Subscription period for the same Company.
- Creating a second Active Subscription while another Active Subscription exists for the Company must be rejected.

### Business validation

- Subscription must reference an existing Company.
- Only Scrappy Administrators may perform create, renew, expire, suspend.
- Historical Subscription records cannot be updated or deleted.
- Login must deny access when Company subscription status is Expired or Suspended (and will also fail if Company/User accounts are `INACTIVE` after cascade).

### Account lifecycle cascade

| Company subscription status | Company account status | User account statuses | Sessions           |
| --------------------------- | ---------------------- | --------------------- | ------------------ |
| Trial, Active, Grace Period | `ACTIVE`               | all → `ACTIVE`        | unchanged (normal) |
| Expired, Suspended          | `INACTIVE`             | all → `INACTIVE`      | revoked            |

## API Contracts _(business resources)_

Contracts describe REST resources only. They do not prescribe frameworks, storage, or internal processing.

### 1. Create Company Subscription

- **Purpose**: Create a new subscription period for a Company and update current Company subscription status.
- **HTTP Method**: `POST`
- **URI**: `/api/v1/admin/companies/{companyId}/subscriptions`
- **Required Request**: Plan name, start date, end date, status; notes optional. Caller must be a Scrappy Administrator.
- **Successful Response**: Created subscription representation and updated Company current subscription status.
- **Possible Errors**: Unauthorized; forbidden (non-administrator); company not found; validation failed; overlapping period; active subscription conflict.

### 2. Renew Company Subscription

- **Purpose**: Add a new non-overlapping subscription period continuing Company entitlement.
- **HTTP Method**: `POST`
- **URI**: `/api/v1/admin/companies/{companyId}/subscriptions/renew`
- **Required Request**: Plan name, start date, end date; status (typically Active); notes optional. Caller must be a Scrappy Administrator.
- **Successful Response**: New subscription representation and updated Company current subscription status; prior history unchanged.
- **Possible Errors**: Unauthorized; forbidden; company not found; validation failed; overlapping period.

### 3. Expire Company Subscription

- **Purpose**: Mark Company entitlement as expired and block future logins.
- **HTTP Method**: `POST`
- **URI**: `/api/v1/admin/companies/{companyId}/subscriptions/expire`
- **Required Request**: Optional notes/reason. Caller must be a Scrappy Administrator.
- **Successful Response**: Company current subscription status Expired; confirmation payload.
- **Possible Errors**: Unauthorized; forbidden; company not found; invalid current state if already terminal per business rules.

### 4. Suspend Company Subscription

- **Purpose**: Suspend Company entitlement and block future logins.
- **HTTP Method**: `POST`
- **URI**: `/api/v1/admin/companies/{companyId}/subscriptions/suspend`
- **Required Request**: Optional notes/reason. Caller must be a Scrappy Administrator.
- **Successful Response**: Company current subscription status Suspended; confirmation payload.
- **Possible Errors**: Unauthorized; forbidden; company not found; invalid current state if not suspendable per business rules.

### 5. List Subscription History

- **Purpose**: View immutable subscription history for a Company.
- **HTTP Method**: `GET`
- **URI**: `/api/v1/admin/companies/{companyId}/subscriptions`
- **Required Request**: Company identifier; Scrappy Administrator authentication.
- **Successful Response**: Ordered list of subscription periods (plan name, start date, end date, status, notes, identifiers as applicable).
- **Possible Errors**: Unauthorized; forbidden; company not found.

### 6. Get Subscription by Id

- **Purpose**: View a single subscription history record.
- **HTTP Method**: `GET`
- **URI**: `/api/v1/admin/companies/{companyId}/subscriptions/{subscriptionId}`
- **Required Request**: Company and subscription identifiers; Scrappy Administrator authentication.
- **Successful Response**: Single subscription representation.
- **Possible Errors**: Unauthorized; forbidden; not found (including cross-company mismatch).

### 7. Get Company Subscription Status

- **Purpose**: Read the Company’s current operational subscription status.
- **HTTP Method**: `GET`
- **URI**: `/api/v1/admin/companies/{companyId}/subscription-status`
- **Required Request**: Company identifier; Scrappy Administrator authentication (Company Owner may use a read-only Company-scoped status resource if product exposes one separately).
- **Successful Response**: Current status value (Trial | Active | Grace Period | Expired | Suspended).
- **Possible Errors**: Unauthorized; forbidden; company not found.

### 8. Login (existing resource — subscription behavior)

- **Purpose**: Authenticate a User; must include Company subscription entitlement check.
- **HTTP Method**: `POST`
- **URI**: `/api/v1/auth/login` (existing)
- **Required Request**: Existing login credentials.
- **Successful Response**: Existing auth success payload when subscription status is Trial, Active, or Grace Period (and other identity rules pass).
- **Possible Errors**: Existing credential failures; forbidden/denied when Company subscription status is Expired or Suspended.

## Acceptance Criteria

1. Scrappy Administrators can create, renew, expire, and suspend subscriptions for a Company.
2. Subscription history retains all periods and does not allow historical edit or delete.
3. Only one Active subscription exists per Company at a time; overlapping periods are rejected.
4. Company current subscription status always reflects the latest management outcome among Trial, Active, Grace Period, Expired, Suspended.
5. Login succeeds for Trial, Active, and Grace Period Companies (given valid credentials and accounts).
6. Login fails for Expired and Suspended Companies.
7. Company Owners, Managers, and Employees cannot modify subscriptions.
8. Subscription fields plan name, start date, end date, status, and notes behave according to validation rules.
9. Expire/Suspend sets Company and all User accounts to `INACTIVE` and revokes sessions.
10. Transition into Trial/Active/Grace Period sets Company and all User accounts to `ACTIVE`.

## Future Considerations

Future versions may introduce the following without redesigning the Company Subscription model:

- Online payments
- Billing portal
- Payment gateway integration
- Automatic renewals
- Invoice generation
- Subscription plans catalog
- Coupons
- Usage-based billing

## Important Constraints

- Backend API product specification only.
- No implementation details, frameworks, middleware, database design, project structure, testing strategy, or code examples.
- This specification defines Company Subscription Management only.
