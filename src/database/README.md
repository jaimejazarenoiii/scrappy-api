Prisma database conventions for P001 Company & Identity Foundation, P002 Organization Management, P003 Workforce Management, and P004 Transaction Management.

## P004 Transaction Resources

- `Transaction` is the aggregate root; `TransactionItem`, `TransactionAttachment`, and
  `TransactionEmployeeAssignment` are children scoped through the parent transaction
- All transactions are tenant-scoped via `companyId`; only `DRAFT` and `CANCELLED` statuses exist
- Soft-delete (archive) uses `deletedAt`; archived transactions are excluded from default lists
- Photo attachments are stored on the local filesystem under `uploads/transactions/{companyId}/{transactionId}/`
  (the `uploads/` directory is gitignored); override the base directory with the `UPLOAD_DIR` env var
- See `specs/005-transaction-management/data-model.md` for full entity design

## P003 Workforce Resources

- `AttendanceSession`, `LeaveRecord`, `CashAdvance`, and `PayrollRecord` are tenant-scoped via `companyId`
- Employee-scoped records also require `employeeId`
- See `specs/004-workforce-management/data-model.md` for full entity design

## P002 Organization Resources

- `Branch`, `Warehouse`, and `Vehicle` models are tenant-scoped via `companyId`
- Soft-delete uses `deletedAt`; archive sets `deletedAt` and inactive status
- Partial unique indexes enforce name/plate uniqueness among active records only
- See `specs/003-organization-management/data-model.md` for full entity design
