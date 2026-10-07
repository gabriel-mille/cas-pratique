import { Actor } from '../../../shared/domain/actor';
import { NotFoundError, StaleVersionError } from '../../../shared/domain/errors';
import { Action } from '../domain/action';
import { ActionRepository } from '../domain/action.repository';

/**
 * Charge l'action dans l'organisation de l'acteur et vérifie la version attendue par le client (D14).
 * Une action d'une autre organisation est « introuvable », pour ne pas révéler son existence.
 */
export async function loadActionForUpdate(
  actions: ActionRepository,
  actor: Actor,
  actionId: string,
  expectedVersion: number,
): Promise<Action> {
  const action = await actions.findById(actor.organizationId, actionId);
  if (!action) {
    throw new NotFoundError(`Action ${actionId} introuvable`);
  }
  if (action.version !== expectedVersion) {
    throw new StaleVersionError(`L'action ${actionId} a été modifiée entre-temps`);
  }
  return action;
}
