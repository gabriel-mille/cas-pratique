import { Actor } from '../../../shared/domain/actor';
import { NotFoundError } from '../../../shared/domain/errors';
import { Action } from '../domain/action';
import { ActionStatus } from '../domain/action-status';
import { ActionPlanRepository } from '../domain/action-plan.repository';
import { ActionRepository } from '../domain/action.repository';
import { AuthorDirectory } from './author-directory';

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

export interface StatusChangeView {
  from: ActionStatus;
  to: ActionStatus;
  at: Date;
  reason: string | null;
  /** `name` est nul si le compte est introuvable. */
  author: { userId: string; name: string | null };
}

export interface ActionDetailView extends ActionView {
  history: StatusChangeView[];
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
    private readonly authors: AuthorDirectory,
  ) {}

  async listPlans(actor: Actor): Promise<ActionPlanView[]> {
    return (await this.plans.findAll(actor.organizationId)).map((plan) => {
      const { id, title, description, version } = plan.snapshot();
      return { id, title, description, version };
    });
  }

  async getPlan(actor: Actor, planId: string): Promise<ActionPlanView> {
    const plan = await this.plans.findById(actor.organizationId, planId);
    if (!plan) {
      throw new NotFoundError(`Plan ${planId} introuvable`);
    }
    const { id, title, description, version } = plan.snapshot();
    return { id, title, description, version };
  }

  async listPlanActions(actor: Actor, planId: string): Promise<ActionView[]> {
    if (!(await this.plans.findById(actor.organizationId, planId))) {
      throw new NotFoundError(`Plan ${planId} introuvable`);
    }
    return (await this.actions.findByPlan(actor.organizationId, planId)).map(toActionView);
  }

  async getAction(actor: Actor, actionId: string): Promise<ActionView> {
    return toActionView(await this.loadAction(actor, actionId));
  }

  /** Détail avec l'historique des changements d'état (D5), du plus ancien au plus récent. */
  async getActionDetail(actor: Actor, actionId: string): Promise<ActionDetailView> {
    const action = await this.loadAction(actor, actionId);
    const changes = action.statusChanges;
    const names = await this.authors.namesOf([...new Set(changes.map((change) => change.by))]);
    return {
      ...toActionView(action),
      history: changes.map(({ from, to, at, reason, by }) => ({
        from,
        to,
        at,
        reason,
        author: { userId: by, name: names.get(by) ?? null },
      })),
    };
  }

  private async loadAction(actor: Actor, actionId: string): Promise<Action> {
    const action = await this.actions.findById(actor.organizationId, actionId);
    if (!action) {
      throw new NotFoundError(`Action ${actionId} introuvable`);
    }
    return action;
  }
}
