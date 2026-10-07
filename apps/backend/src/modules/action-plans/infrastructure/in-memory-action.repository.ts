import { InMemoryTenantStore } from '../../../shared/infrastructure/in-memory-versioned-store';
import { Action, ActionProps } from '../domain/action';
import { ActionRepository } from '../domain/action.repository';

/**
 * Implémentation en mémoire, utilisée par les scénarios au niveau application (D29).
 * Stocke des copies pour se comporter comme une base : une instance chargée n'est pas partagée.
 * Les actions supprimées restent stockées mais sont exclues de toutes les lectures (D7).
 */
export class InMemoryActionRepository implements ActionRepository {
  private readonly store = new InMemoryTenantStore<ActionProps>();

  async findById(organizationId: string, id: string): Promise<Action | null> {
    const row = this.store.get(organizationId, id);
    return row && !row.deletedAt ? Action.restore(row) : null;
  }

  async findByPlan(organizationId: string, planId: string): Promise<Action[]> {
    return this.store
      .list(organizationId)
      .filter((row) => row.planId === planId && !row.deletedAt)
      .map((row) => Action.restore(row));
  }

  async save(action: Action): Promise<void> {
    this.store.save(action.snapshot());
  }

  /** Place une action telle quelle, sans contrôle de version (préparation des tests). */
  seed(action: Action): void {
    this.store.seed(action.snapshot());
  }

  /** Ligne stockée, supprimée ou non : vérifie que la suppression est tracée (tests). */
  stored(organizationId: string, id: string): ActionProps | undefined {
    return this.store.get(organizationId, id);
  }
}
