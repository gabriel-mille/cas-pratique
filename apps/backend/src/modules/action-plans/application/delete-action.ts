import { requireAdmin } from '../../../shared/application/require-admin';
import { Actor } from '../../../shared/domain/actor';
import { Clock } from '../../../shared/domain/clock';
import { ActionRepository } from '../domain/action.repository';
import { loadActionForUpdate } from './load-action-for-update';

export interface DeleteActionCommand {
  actor: Actor;
  actionId: string;
  expectedVersion: number;
}

/** Suppression logique (D7) : l'action reste en base avec son auteur et sa date de suppression. */
export class DeleteAction {
  constructor(
    private readonly actions: ActionRepository,
    private readonly clock: Clock,
  ) {}

  async execute(command: DeleteActionCommand): Promise<void> {
    requireAdmin(command.actor, 'supprimer une action');
    const action = await loadActionForUpdate(this.actions, command.actor, command.actionId, command.expectedVersion);
    action.delete(command.actor.userId, this.clock.now());
    await this.actions.save(action);
  }
}
