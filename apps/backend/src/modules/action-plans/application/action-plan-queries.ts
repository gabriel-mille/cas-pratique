import { Actor } from '../../../shared/domain/actor';
import { NotFoundError } from '../../../shared/domain/errors';
import { Action } from '../domain/action';
import { ActionStatus } from '../domain/action-status';
import { ActionPlanRepository } from '../domain/action-plan.repository';
import { ActionRepository } from '../domain/action.repository';

export interface ActionPlanView {
  id: string;
  title: string;
  description: string | null;
  version: number;
}

export interface ActionView {
  id: string;
  planId: string;
  title: string;
  description: string | null;
  status: ActionStatus;
  version: number;
}

const toActionView = (action: Action): ActionView => {
  const { id, planId, title, description, status, version } = action.snapshot();
  return { id, planId, title, description, status, version };
};

/** Lectures ouvertes à tout membre, limitées à son organisation (US7, D6). */
export class ActionPlanQueries {
  constructor(
    private readonly plans: ActionPlanRepository,
    private readonly actions: ActionRepository,
  ) {}

  async listPlans(actor: Actor): Promise<ActionPlanView[]> {
    return (await this.plans.findAll(actor.organizationId)).map((plan) => {
      const { id, title, description, version } = plan.snapshot();
      return { id, title, description, version };
    });
  }

  async listPlanActions(actor: Actor, planId: string): Promise<ActionView[]> {
    if (!(await this.plans.findById(actor.organizationId, planId))) {
      throw new NotFoundError(`Plan ${planId} introuvable`);
    }
    return (await this.actions.findByPlan(actor.organizationId, planId)).map(toActionView);
  }

  async getAction(actor: Actor, actionId: string): Promise<ActionView> {
    const action = await this.actions.findById(actor.organizationId, actionId);
    if (!action) {
      throw new NotFoundError(`Action ${actionId} introuvable`);
    }
    return toActionView(action);
  }
}
