import type { TenantContext } from '../tenant/tenant-context.js';

export interface AuthorizationPolicy<TResource = Record<string, unknown>> {
  assertCanAccess(context: TenantContext, resource?: TResource): void;
}
