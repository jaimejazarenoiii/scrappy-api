import { describe, expect, it } from 'vitest';
import { LifecycleConflictError } from '../../../src/shared/errors/http-exceptions.js';
import { assertTransition } from '../../../src/modules/trip/domain/trip-lifecycle.js';

describe('trip lifecycle transitions', () => {
  it('allows valid transitions', () => {
    expect(() => assertTransition('DRAFT', 'start', 'MANAGER')).not.toThrow();
    expect(() => assertTransition('DRAFT', 'cancel', 'OWNER')).not.toThrow();
    expect(() => assertTransition('STARTED', 'complete', 'MANAGER')).not.toThrow();
  });

  it('rejects invalid transitions', () => {
    expect(() => assertTransition('STARTED', 'start', 'MANAGER')).toThrow(LifecycleConflictError);
    expect(() => assertTransition('DRAFT', 'complete', 'MANAGER')).toThrow(LifecycleConflictError);
    expect(() => assertTransition('COMPLETED', 'cancel', 'OWNER')).toThrow(LifecycleConflictError);
    expect(() => assertTransition('CANCELLED', 'complete', 'OWNER')).toThrow(
      LifecycleConflictError,
    );
    expect(() => assertTransition('DRAFT', 'start', 'EMPLOYEE')).toThrow(LifecycleConflictError);
  });
});
