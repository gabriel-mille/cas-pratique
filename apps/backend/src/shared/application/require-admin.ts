import { Actor } from '../domain/actor';
import { ForbiddenError } from '../domain/errors';
import { Role } from '../domain/role';

/**
 * Opérations réservées à l'Administrateur (matrice docs/specs/permissions.md).
 * Vérifié avant tout chargement : un refus ne dit rien de l'existence de la ressource.
 */
export function requireAdmin(actor: Actor, operation: string): void {
  if (actor.role !== Role.ADMIN) {
    throw new ForbiddenError(`Le rôle ${actor.role} ne peut pas ${operation}`);
  }
}
