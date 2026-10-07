import { StaleVersionError } from '../../../shared/domain/errors';
import { Action, ActionProps } from '../domain/action';
import { ActionRepository } from '../domain/action.repository';

/**
 * Implémentation en mémoire, utilisée par les scénarios au niveau application (D29).
 * Stocke des copies pour se comporter comme une base : une instance chargée n'est pas partagée.
 */
export class InMemoryActionRepository implements ActionRepository {
  private readonly rows = new Map<string, ActionProps>();

  async findById(organizationId: string, id: string): Promise<Action | null> {
    const row = this.rows.get(id);
    return row && row.organizationId === organizationId ? Action.restore(row) : null;
  }

  async save(action: Action): Promise<void> {
    const snapshot = action.snapshot();
    const stored = this.rows.get(snapshot.id);
    if (stored && stored.version !== snapshot.version) {
      throw new StaleVersionError(`L'action ${snapshot.id} a été modifiée entre-temps`);
    }
    this.rows.set(snapshot.id, stored ? { ...snapshot, version: snapshot.version + 1 } : snapshot);
  }

  /** Place une action telle quelle, sans contrôle de version (préparation des tests). */
  seed(action: Action): void {
    this.rows.set(action.id, action.snapshot());
  }
}
