import { describe, expect, it } from 'vitest';
import { generateTemporaryPassword } from '../../../src/shared/auth/temporary-password.js';

describe('generateTemporaryPassword', () => {
  it('returns passwords meeting minimum length', () => {
    const password = generateTemporaryPassword();
    expect(password.length).toBeGreaterThanOrEqual(8);
  });

  it('returns unique values across calls', () => {
    const a = generateTemporaryPassword();
    const b = generateTemporaryPassword();
    expect(a).not.toBe(b);
  });
});
