import { randomUUID } from 'node:crypto';
import { requireAdmin } from '../../../shared/application/require-admin';
import { Actor } from '../../../shared/domain/actor';
import { Clock } from '../../../shared/domain/clock';
import { ActionPlan } from '../domain/action-plan';
import { ActionPlanRepository } from '../domain/action-plan.repository';

export interface CreateActionPlanCommand {
  actor: Actor;
  title: string;
  description: string | null;
}

export class CreateActionPlan {
  constructor(
    private readonly plans: ActionPlanRepository,
    private readonly clock: Clock,
  ) {}

  /** Renvoie l'id du plan créé. */
  async execute(command: CreateActionPlanCommand): Promise<string> {
    requireAdmin(command.actor, 'créer un plan');
    const plan = ActionPlan.create({
      id: randomUUID(),
      organizationId: command.actor.organizationId,
      title: command.title,
      description: command.description,
      createdAt: this.clock.now(),
    });
    await this.plans.save(plan);
    return plan.id;
  }
}
