export const USER_ROLES = ['OWNER', 'MANAGER', 'EMPLOYEE', 'SUPER_ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];
