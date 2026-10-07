import { Role } from '../../../shared/domain/role';

// Libellés de l'interface utilisés dans les .feature (D12).
const LABELS: Record<string, Role> = {
  Admin: Role.ADMIN,
  Gestionnaire: Role.MANAGER,
  Utilisateur: Role.MEMBER,
};

export function roleFromLabel(label: string): Role {
  const role = LABELS[label];
  if (!role) {
    throw new Error(`Libellé de rôle inconnu : ${label}`);
  }
  return role;
}
