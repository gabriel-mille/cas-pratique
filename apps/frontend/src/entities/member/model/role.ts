import type { Role } from '@/shared/api';

export const ROLE_LABELS: Record<Role, string> = {
  MEMBER: 'Utilisateur',
  MANAGER: 'Gestionnaire',
  ADMIN: 'Administrateur',
};

export const ROLE_OPTIONS = (['MEMBER', 'MANAGER', 'ADMIN'] as const).map((value) => ({
  value,
  label: ROLE_LABELS[value],
}));

/** Opérations réservées par `docs/specs/permissions.md` ; les transitions d'état sont dans `entities/action`. */
export type Permission = 'manage-members' | 'edit-plans' | 'delete-actions';

const PERMISSIONS: Record<Permission, readonly Role[]> = {
  'manage-members': ['ADMIN'],
  'edit-plans': ['ADMIN'],
  'delete-actions': ['ADMIN'],
};

/** Masque ce qui serait refusé ; le back reste la seule autorité. */
export const can = (role: Role, permission: Permission): boolean => PERMISSIONS[permission].includes(role);
