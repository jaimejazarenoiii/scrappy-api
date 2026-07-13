# Research: P010 - Activity Logs

**Feature**: `013-activity-logs`  
**Date**: 2026-07-13

## 1. Persist vs Pino-only audit

**Decision**: Persist Activity Logs in PostgreSQL via a dedicated table **and** keep existing
Pino `*-audit.service` structured logs for operational observability.

**Rationale**: Spec requires searchable/filterable Company history. Pino logs are not a product
query API and are not tenant-safe for Owners/Managers in-app.

**Alternatives considered**:

- Parse log files / log aggregator — fragile, ops-coupled, poor tenancy.
- Replace Pino audits entirely — loses request-correlated ops debugging value.

## 2. Sync recorder vs message bus (MVP)

**Decision**: Synchronous in-process `ActivityLogRecorder.record()` after successful business
writes. Defer outbox/queue to future Notifications/Webhooks/Streaming.

**Rationale**: Matches current codebase (use case → audit helper). Zero new infra. Event shape
designed for later fan-out.

**Alternatives considered**:

- Domain events + in-memory EventEmitter — useful later; extra indirection for MVP.
- Immediate Kafka/SQS — overkill; no consumers yet.

## 3. Recorder failure vs business transaction

**Decision**: Do **not** fail the business use case if Activity Log append fails; log the error.

**Rationale**: Spec edge case: source operation remains authoritative. Audit gaps are undesirable
but better than blocking payroll/transactions on audit DB issues.

**Alternatives considered**:

- Same DB transaction as business write — stronger consistency; couples availability.
- Outbox in same transaction — best long-term; deferred to async phase.

## 4. Foreign keys to User / resources

**Decision**: Soft/logical references. Prefer **no ON DELETE CASCADE** from User/resources to
ActivityLog. Optional FK to Company only if aligned with other tenant tables; still no cascade
delete of logs when Company archives.

**Rationale**: Audit must survive actor/resource soft-delete/archive.

**Alternatives considered**:

- Hard FKs with CASCADE — destroys history; rejected.
- Hard FKs with RESTRICT — blocks legitimate user cleanup; awkward.

## 5. Search implementation

**Decision**: v1 use SQL `ILIKE` / equality on `resourceNumber`, `action`, joined/denormalized
actor email or name fields as needed; `resourceNumber` denormalized at write time.

**Rationale**: Simple, consistent with Reports search patterns; adequate for Company-scale data.

**Alternatives considered**:

- Full-text search / pg_trgm — optional optimization later.
- Elasticsearch — out of scope.

## 6. Dual-write from existing audit helpers

**Decision**: Instrument producers by calling `ActivityLogRecorder` from use cases (or enhance
audit helpers to also record). Taxonomy constants centralize action strings.

**Rationale**: Existing `AuditEvent` is too loose for product Activity Logs; keep Pino helpers,
add typed recorder input.

**Alternatives considered**:

- Monkey-patch getLogger — too magical.
- Only new modules record — fails FR coverage for existing flows.

## 7. Idempotency

**Decision**: Accept rare duplicates in v1; document at-least-once. Optional `idempotencyKey` in
metadata later.

**Rationale**: YAGNI until double-submit causes support noise.

## 8. Unresolved items

None — all Technical Context clarifications resolved for planning.
