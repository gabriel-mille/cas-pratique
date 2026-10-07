import { randomUUID } from 'node:crypto';
import { requireAdmin } from '../../../shared/application/require-admin';
import { Actor } from '../../../shared/domain/actor';
import { Clock } from '../../../shared/domain/clock';
import { NotFoundError } from '../../../shared/domain/errors';
import { Action } from '../domain/action';
import { ActionPlanRepository } from '../domain/action-plan.repository';
import { ActionRepository } from '../domain/action.repository';

export interface AddActionCommand {
  actor: Actor;
  planId: string;
  title: string;
  description: string | null;
}

export class AddAction {
  constructor(
    private readonly plans: ActionPlanRepository,
    private readonly actions: ActionRepository,
    private readonly clock: Clock,
  ) {}

  /** Renvoie l'id de l'action créée, toujours À faire (D3). */
  async execute(command: AddActionCommand): Promise<string> {
    requireAdmin(command.actor, 'ajouter une action');
    const { organizationId } = command.actor;
    if (!(await this.plans.findById(organizationId, command.planId))) {
      throw new NotFoundError(`Plan ${command.planId} introuvable`);
    }
    const action = Action.create({
      id: randomUUID(),
      organizationId,
      planId: command.planId,
      title: command.title,
      description: command.description,
      createdAt: this.clock.now(),
    });
    await this.actions.save(action);
    return action.id;
  }
}
