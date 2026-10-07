import { ActionPlan } from './action-plan';

export const ACTION_PLAN_REPOSITORY = Symbol('ACTION_PLAN_REPOSITORY');

export interface ActionPlanRepository {
  /** Ne renvoie que les plans de l'organisation donnée. */
  findById(organizationId: string, id: string): Promise<ActionPlan | null>;

  /** Plans de l'organisation, par date de création. */
  findAll(organizationId: string): Promise<ActionPlan[]>;

  /** Même contrat de version que `ActionRepository.save` (D14). */
  save(plan: ActionPlan): Promise<void>;
}
