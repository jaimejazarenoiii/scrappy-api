import { describe, expect, it } from 'vitest';
import { createTestContext } from '../setup/test-app.js';

describe('app bootstrap', () => {
  it('creates the app with docs route', async () => {
    const { app } = createTestContext();
    expect(app).toBeDefined();
  });
});
