Prisma database conventions for P001 Company & Identity Foundation and P002 Organization Management.

## P002 Organization Resources

- `Branch`, `Warehouse`, and `Vehicle` models are tenant-scoped via `companyId`
- Soft-delete uses `deletedAt`; archive sets `deletedAt` and inactive status
- Partial unique indexes enforce name/plate uniqueness among active records only
- See `specs/003-organization-management/data-model.md` for full entity design
