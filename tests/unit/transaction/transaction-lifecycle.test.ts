import { describe, expect, it } from 'vitest';
import { LifecycleConflictError } from '../../../src/shared/errors/http-exceptions.js';
import { assertTransition } from '../../../src/modules/transaction/domain/transaction-lifecycle.js';

describe('transaction lifecycle transitions', () => {
  it('allows valid transitions', () => {
    expect(() => assertTransition('DRAFT', 'finish', 'EMPLOYEE')).not.toThrow();
    expect(() => assertTransition('DRAFT', 'finish', 'MANAGER')).not.toThrow();
    expect(() => assertTransition('DRAFT', 'finish', 'OWNER')).not.toThrow();
    expect(() => assertTransition('READY_FOR_PAYMENT', 'return_to_draft', 'MANAGER')).not.toThrow();
    expect(() => assertTransition('READY_FOR_PAYMENT', 'settle', 'OWNER')).not.toThrow();
    expect(() => assertTransition('PAID', 'reopen', 'OWNER')).not.toThrow();
    expect(() => assertTransition('DRAFT', 'cancel', 'EMPLOYEE')).not.toThrow();
    expect(() => assertTransition('READY_FOR_PAYMENT', 'cancel', 'MANAGER')).not.toThrow();
  });

  it('rejects invalid transitions', () => {
    expect(() => assertTransition('READY_FOR_PAYMENT', 'finish', 'EMPLOYEE')).toThrow(
      LifecycleConflictError,
    );
    expect(() => assertTransition('DRAFT', 'settle', 'MANAGER')).toThrow(LifecycleConflictError);
    expect(() => assertTransition('PAID', 'cancel', 'OWNER')).toThrow(LifecycleConflictError);
    expect(() => assertTransition('PAID', 'reopen', 'MANAGER')).toThrow(LifecycleConflictError);
  });
});
