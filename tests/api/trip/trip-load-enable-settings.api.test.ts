import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';
import { createTrip } from '../../setup/trip-load-helpers.js';

describe('trip load enable/disable + company settings api', () => {
  it('enables and disables load on a draft trip', async () => {
    const { app } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const tripId = await createTrip(app, owner.auth);

    const enabled = await request(app)
      .post(`/api/v1/trips/${tripId}/load/enable`)
      .set(owner.auth)
      .send({ strictLoadValidation: true });
    expect(enabled.status).toBe(200);
    expect(enabled.body.data.loadEnabled).toBe(true);
    expect(enabled.body.data.strictLoadValidation).toBe(true);

    const disabled = await request(app)
      .post(`/api/v1/trips/${tripId}/load/disable`)
      .set(owner.auth);
    expect(disabled.status).toBe(200);
    expect(disabled.body.data.loadEnabled).toBe(true);
    expect(disabled.body.data.strictLoadValidation).toBe(false);
  });

  it('applies company default strict flag when enabling without override', async () => {
    const { app } = createTestContext();
    const owner = await createCompanyAndLogin(app);

    const settings = await request(app)
      .patch('/api/v1/companies/me/trip-load-settings')
      .set(owner.auth)
      .send({ defaultStrictLoadValidation: true });
    expect(settings.status).toBe(200);
    expect(settings.body.data.defaultStrictLoadValidation).toBe(true);

    const getSettings = await request(app)
      .get('/api/v1/companies/me/trip-load-settings')
      .set(owner.auth);
    expect(getSettings.status).toBe(200);
    expect(getSettings.body.data.defaultStrictLoadValidation).toBe(true);

    const tripId = await createTrip(app, owner.auth);
    const enabled = await request(app)
      .post(`/api/v1/trips/${tripId}/load/enable`)
      .set(owner.auth)
      .send({});
    expect(enabled.body.data.strictLoadValidation).toBe(true);
  });

  it('disable clears an existing load', async () => {
    const { app } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const tripId = await createTrip(app, owner.auth);

    await request(app)
      .post(`/api/v1/trips/${tripId}/load`)
      .set(owner.auth)
      .send({ items: [{ materialName: 'Copper', quantity: 100, unit: 'KG' }] });

    const disabled = await request(app)
      .post(`/api/v1/trips/${tripId}/load/disable`)
      .set(owner.auth);
    expect(disabled.status).toBe(200);

    const load = await request(app).get(`/api/v1/trips/${tripId}/load`).set(owner.auth);
    expect(load.status).toBe(404);
  });
});
