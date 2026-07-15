export interface PlatformActivityLogCheckInput {
  action: string;
  userId: string;
  metadata?: Record<string, unknown> | null;
  actorRole?: string | null;
}

function readMetadataRole(metadata?: Record<string, unknown> | null): string | null {
  if (typeof metadata?.actorRole === 'string') return metadata.actorRole;
  if (typeof metadata?.role === 'string') return metadata.role;
  return null;
}

export function isPlatformOnlyActivityLog(input: PlatformActivityLogCheckInput): boolean {
  if (input.action.startsWith('admin.')) return true;
  if (input.action === 'auth.admin_login') return true;

  const role = input.actorRole ?? readMetadataRole(input.metadata);
  if (role === 'SUPER_ADMIN') return true;

  if (
    input.action === 'user.password_admin_reset' &&
    input.metadata?.source === 'admin.company_account'
  ) {
    return true;
  }

  return false;
}

export function shouldHideActivityLogFromTenant(
  log: PlatformActivityLogCheckInput,
  superAdminUserIds?: ReadonlySet<string>,
): boolean {
  if (isPlatformOnlyActivityLog(log)) return true;
  if (superAdminUserIds?.has(log.userId)) return true;
  return false;
}
