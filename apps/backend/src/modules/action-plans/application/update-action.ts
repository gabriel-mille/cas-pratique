import { requireAdmin } from '../../../shared/application/require-admin';
import { Actor } from '../../../shared/domain/actor';
import { ActionRepository } from '../domain/action.repository';
import { loadActionForUpdate } from './load-action-for-update';

export interface UpdateActionCommand {
  actor: Actor;
  actionId: string;
  title: string;
  description: string | null;
  expectedVersion: number;
}

export class UpdateAction {
  constructor(private readonly actions: ActionRepository) {}

  async execute(command: UpdateActionCommand): Promise<void> {
    requireAdmin(command.actor, 'modifier une action');
    const action = await loadActionForUpdate(this.actions, command.actor, command.actionId, command.expectedVersion);
    action.edit(command.title, command.description);
    await this.actions.save(action);
  }
}
