export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMINISTRATOR: 'administrator',
  MANAGER: 'manager',
  USER: 'user'
};

export const normalizeRole = (role) => {
  if (!role) return null;
  const normalized = String(role).toLowerCase();
  if (normalized === 'admin') return ROLES.ADMINISTRATOR;
  if (normalized === 'employee') return ROLES.USER;
  return normalized;
};

export const hasRole = (currentRole, roles) => {
  const normalizedCurrentRole = normalizeRole(currentRole);
  if (!normalizedCurrentRole) return false;
  const roleList = Array.isArray(roles) ? roles : [roles];
  return roleList.map(normalizeRole).includes(normalizedCurrentRole);
};

export const isSuperAdminRole = (role) => hasRole(role, ROLES.SUPER_ADMIN);
export const isAdministratorRole = (role) => hasRole(role, [ROLES.SUPER_ADMIN, ROLES.ADMINISTRATOR]);
export const isManagerRole = (role) => hasRole(role, [ROLES.SUPER_ADMIN, ROLES.ADMINISTRATOR, ROLES.MANAGER]);
export const isEmployeeRole = (role) => hasRole(role, ROLES.USER);

export const canEditRole = (role) => !isEmployeeRole(role);
export const canViewStatsRole = (role) => isAdministratorRole(role);
export const canManageUsersRole = (role) => isAdministratorRole(role);
export const canSeePricesRole = (role) => isManagerRole(role);
