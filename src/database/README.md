Prisma database conventions for P001 Company & Identity Foundation, P002 Organization Management, and P003 Workforce Management.

## P003 Workforce Resources

- `AttendanceSession`, `LeaveRecord`, `CashAdvance`, and `PayrollRecord` are tenant-scoped via `companyId`
- Employee-scoped records also require `employeeId`
- See `specs/004-workforce-management/data-model.md` for full entity design

## P002 Organization Resources

- `Branch`, `Warehouse`, and `Vehicle` models are tenant-scoped via `companyId`
- Soft-delete uses `deletedAt`; archive sets `deletedAt` and inactive status
- Partial unique indexes enforce name/plate uniqueness among active records only
- See `specs/003-organization-management/data-model.md` for full entity design
