import { Actor } from '../../../shared/domain/actor';
import { Clock } from '../../../shared/domain/clock';
import { ActionStatus } from '../domain/action-status';
import { ActionRepository } from '../domain/action.repository';
import { loadActionForUpdate } from './load-action-for-update';

export interface ChangeActionStatusCommand {
  actor: Actor;
  actionId: string;
  to: ActionStatus;
  expectedVersion: number;
}

export class ChangeActionStatus {
  constructor(
    private readonly actions: ActionRepository,
    private readonly clock: Clock,
  ) {}

  async execute(command: ChangeActionStatusCommand): Promise<void> {
    const action = await loadActionForUpdate(this.actions, command.actor, command.actionId, command.expectedVersion);
    action.changeStatus(command.to, command.actor, this.clock.now());
    await this.actions.save(action);
  }
}
