import type { Role } from '@/shared/api';
import { seedMember, seedOrganization } from './fake-api';

export const ROLES: Record<string, Role> = {
  Admin: 'ADMIN',
  Gestionnaire: 'MANAGER',
  Utilisateur: 'MEMBER',
};

/** Organisation des `.feature` : chaque membre a l'email `<prénom>@lilas.fr` et le mot de passe par défaut. */
export function seedLilas(members: Record<string, Role>) {
  const organizationId = seedOrganization('Clinique des Lilas');
  const ids = new Map<string, string>();
  for (const [name, role] of Object.entries(members)) {
    ids.set(
      name,
      seedMember(organizationId, name, role, {
        email: `${name.toLowerCase()}@lilas.fr`,
      })
    );
  }
  const member = (name: string) => {
    const id = ids.get(name);
    if (!id) throw new Error(`Membre inconnu : ${name}`);
    return id;
  };
  return { organizationId, member };
}
