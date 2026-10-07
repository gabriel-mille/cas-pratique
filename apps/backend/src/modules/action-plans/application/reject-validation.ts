import { Actor } from '../../../shared/domain/actor';
import { Clock } from '../../../shared/domain/clock';
import { ActionRepository } from '../domain/action.repository';
import { loadActionForUpdate } from './load-action-for-update';

export interface RejectValidationCommand {
  actor: Actor;
  actionId: string;
  reason: string | null;
  expectedVersion: number;
}

export class RejectValidation {
  constructor(
    private readonly actions: ActionRepository,
    private readonly clock: Clock,
  ) {}

  async execute(command: RejectValidationCommand): Promise<void> {
    const action = await loadActionForUpdate(this.actions, command.actor, command.actionId, command.expectedVersion);
    action.rejectValidation(command.actor, command.reason, this.clock.now());
    await this.actions.save(action);
  }
}
