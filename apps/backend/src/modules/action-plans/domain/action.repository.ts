import { Action } from './action';

export const ACTION_REPOSITORY = Symbol('ACTION_REPOSITORY');

export interface ActionRepository {
  /** Ne renvoie que les actions non supprimées de l'organisation donnée (D7). */
  findById(organizationId: string, id: string): Promise<Action | null>;

  /** Actions non supprimées d'un plan de l'organisation, par date de création. */
  findByPlan(organizationId: string, planId: string): Promise<Action[]>;

  /**
   * Insère une nouvelle action telle quelle (version 1). Met à jour une action existante
   * si sa version est toujours celle en base, puis l'incrémente ; sinon lève
   * `StaleVersionError` (verrou optimiste, D14).
   */
  save(action: Action): Promise<void>;
}
