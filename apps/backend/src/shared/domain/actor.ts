import { Role } from './role';

/** Membre authentifié qui exécute une opération, construit par le guard HTTP (D30). */
export interface Actor {
  userId: string;
  organizationId: string;
  role: Role;
}
