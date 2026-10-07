import { NotFoundError, StaleVersionError } from '../domain/errors';

/**
 * Vérifie qu'une ressource chargée dans l'organisation de l'acteur existe, et qu'elle est
 * toujours à la version vue par le client (D14). Hors organisation, elle est « introuvable »,
 * pour ne pas révéler son existence.
 */
export function ensureFoundAtVersion<T extends { version: number }>(
  entity: T | null,
  label: string,
  expectedVersion: number,
): T {
  if (!entity) {
    throw new NotFoundError(`${label} introuvable`);
  }
  if (entity.version !== expectedVersion) {
    throw new StaleVersionError(`${label} a été modifié entre-temps`);
  }
  return entity;
}
