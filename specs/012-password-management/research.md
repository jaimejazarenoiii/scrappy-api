# Research: Password Management

**Feature**: `012-password-management`  
**Date**: 2026-07-13

## 1. Module ownership (User vs Auth)

**Decision**: Implement change-password and password-status in the `user` module; admin reset in
`employee` (target by `employeeId`); keep `auth` for login/logout/refresh only, enriching login
response with `passwordChangeRequired`.

**Rationale**: Credentials and compliance flags are User identity concerns. Auth already owns
sessions; expanding it into admin credential ops blurs P001 boundaries.

**Alternatives considered**:

- All password routes under `/auth/*` — rejected; mixes session lifecycle with identity admin.
- New `password` module — rejected; YAGNI for two use cases.

## 2. Forced-change enforcement

**Decision**: Global middleware after authentication that loads User and, when
`passwordChangeRequired`, allows only an explicit path allowlist; otherwise `403 PASSWORD_CHANGE_REQUIRED`.

**Rationale**: Spec requires blocking other protected resources until change completes. DB re-check
avoids stale JWT claims.

**Alternatives considered**:

- JWT-only claim without DB read — weaker if flag cleared mid-token lifetime incorrectly; also
  harder to clear without re-issue.
- Per-route checks — easy to miss routes.

## 3. User field extension

**Decision**: Add `passwordChangeRequired` (bool, default false) and `passwordChangedAt`
(nullable datetime). No redesign of User.

**Rationale**: Matches plan/spec requirements; sufficient for forced change and future expiration.

**Alternatives considered**:

- Separate `PasswordCredential` table — overkill for MVP.
- Soft-delete User on reset — violates “account remains active.”

## 4. Session invalidation

**Decision**: On admin reset, revoke all refresh sessions for the target. On self change, revoke all
refresh sessions for the actor (other devices must re-login). Short-lived access tokens expire
naturally.

**Rationale**: Reuses `SessionRepository.revokeAllForUser` from account provisioning. Prevents use
of old refresh tokens after credential change.

**Alternatives considered**:

- Keep current session on change — slightly better UX, more complex; deferred.
- Global token version column — heavier than needed for MVP.

## 5. Admin reset targeting

**Decision**: `POST /employees/{employeeId}/password-reset` requires linked User; role checks use
linked User.role. Request body does not include a password; the system generates a temporary
password and returns plaintext once.

**Rationale**: Spec URI and workforce onboarding model; auto-generation prevents weak admin-chosen
temps and matches one-time display rule (only hash stored).

**Alternatives considered**:

- Client-supplied temporary password — rejected; conflicts with one-time system generation rules.
- `POST /users/{userId}/password-reset` — better for unlinked Owners; deferred to keep MVP aligned
  with spec contracts.

## 6. Temporary password generation

**Decision**: Application service generates a cryptographically secure random password meeting
product strength rules; plaintext returned only in reset response; only bcrypt hash persisted.

**Rationale**: Matches product rules for one-time display, non-recoverability, and immediate
credential replacement.

**Alternatives considered**:

- Fixed-format short codes — weaker; rejected for credential use.
- Email delivery of temp password — out of scope (forgot-password future).

## 7. Incorrect current password error shape

**Decision**: Return `400 VALIDATION_ERROR` with path `currentPassword` (do not reveal whether email
exists — N/A for authenticated change).

**Rationale**: Authenticated self-service; field-level feedback is appropriate.

## 8. Forgot password

**Decision**: Out of scope; leave P001 placeholder unchanged.

**Rationale**: Explicit product constraint for MVP.
