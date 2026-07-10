import { describe, expect, it } from 'vitest';
import {
  archivedPredicate,
  buildTransactionReportWhere,
} from '../../../src/modules/reports/infrastructure/report-where-builders.js';

describe('buildTransactionReportWhere', () => {
  const companyId = '550e8400-e29b-41d4-a716-446655440000';
  const branchId = '660e8400-e29b-41d4-a716-446655440001';

  it('scopes by company and excludes archived by default', () => {
    const where = buildTransactionReportWhere({
      companyId,
      includeArchived: false,
      from: new Date('2026-01-01T00:00:00.000Z'),
      to: new Date('2026-01-31T23:59:59.999Z'),
    });
    expect(where).toMatchObject({
      companyId,
      deletedAt: null,
      transactionDate: {
        gte: new Date('2026-01-01T00:00:00.000Z'),
        lte: new Date('2026-01-31T23:59:59.999Z'),
      },
    });
  });

  it('applies branch, direction, status, and employee filters', () => {
    const employeeId = '770e8400-e29b-41d4-a716-446655440002';
    const where = buildTransactionReportWhere({
      companyId,
      includeArchived: true,
      branchId,
      direction: 'INBOUND',
      status: 'DRAFT',
      employeeId,
    });
    expect(where.branchId).toBe(branchId);
    expect(where.direction).toBe('INBOUND');
    expect(where.status).toBe('DRAFT');
    expect(where.assignments).toEqual({ some: { employeeId } });
    expect(archivedPredicate(true)).toEqual({});
  });

  it('applies case-insensitive search across number and party', () => {
    const where = buildTransactionReportWhere({ companyId, includeArchived: false }, 'acme');
    expect(where.OR).toEqual([
      { transactionNumber: { contains: 'acme', mode: 'insensitive' } },
      { partyName: { contains: 'acme', mode: 'insensitive' } },
    ]);
  });
});
