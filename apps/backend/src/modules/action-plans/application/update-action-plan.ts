import { ensureFoundAtVersion } from '../../../shared/application/ensure-found-at-version';
import { requireAdmin } from '../../../shared/application/require-admin';
import { Actor } from '../../../shared/domain/actor';
import { ActionPlanRepository } from '../domain/action-plan.repository';

export interface UpdateActionPlanCommand {
  actor: Actor;
  planId: string;
  title: string;
  description: string | null;
  expectedVersion: number;
}

export class UpdateActionPlan {
  constructor(private readonly plans: ActionPlanRepository) {}

  async execute(command: UpdateActionPlanCommand): Promise<void> {
    requireAdmin(command.actor, 'modifier un plan');
    const plan = ensureFoundAtVersion(
      await this.plans.findById(command.actor.organizationId, command.planId),
      `Plan ${command.planId}`,
      command.expectedVersion,
    );
    plan.edit(command.title, command.description);
    await this.plans.save(plan);
  }
}
