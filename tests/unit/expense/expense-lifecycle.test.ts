import { describe, expect, it } from 'vitest';
import { assertTransition } from '../../../src/modules/expense/domain/expense-lifecycle.js';

describe('expense lifecycle', () => {
  it('allows draft to record for employee owner', () => {
    expect(() => assertTransition('DRAFT', 'record', 'EMPLOYEE', { isOwner: true })).not.toThrow();
  });

  it('rejects record on recorded expense', () => {
    expect(() => assertTransition('RECORDED', 'record', 'MANAGER', { isOwner: false })).toThrow();
  });

  it('rejects cancel on cancelled expense', () => {
    expect(() => assertTransition('CANCELLED', 'cancel', 'MANAGER', { isOwner: false })).toThrow();
  });
});
