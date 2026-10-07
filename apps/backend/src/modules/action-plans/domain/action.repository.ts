import { Action } from './action';

export const ACTION_REPOSITORY = Symbol('ACTION_REPOSITORY');

export interface ActionRepository {
  /** Ne renvoie que les actions de l'organisation donnée. */
  findById(organizationId: string, id: string): Promise<Action | null>;

  /**
   * Insère une nouvelle action telle quelle (version 1). Met à jour une action existante
   * si sa version est toujours celle en base, puis l'incrémente ; sinon lève
   * `StaleVersionError` (verrou optimiste, D14).
   */
  save(action: Action): Promise<void>;
}
