import { ensureFoundAtVersion } from '../../../shared/application/ensure-found-at-version';
import { Actor } from '../../../shared/domain/actor';
import { Action } from '../domain/action';
import { ActionRepository } from '../domain/action.repository';

/** Charge l'action dans l'organisation de l'acteur et vérifie la version attendue par le client (D14). */
export async function loadActionForUpdate(
  actions: ActionRepository,
  actor: Actor,
  actionId: string,
  expectedVersion: number,
): Promise<Action> {
  return ensureFoundAtVersion(await actions.findById(actor.organizationId, actionId), `Action ${actionId}`, expectedVersion);
}
