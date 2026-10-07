import { InMemoryVersionedStore } from '../../../shared/infrastructure/in-memory-versioned-store';
import { ActionPlan, ActionPlanProps } from '../domain/action-plan';
import { ActionPlanRepository } from '../domain/action-plan.repository';

/** Implémentation en mémoire, utilisée par les scénarios au niveau application (D29). */
export class InMemoryActionPlanRepository implements ActionPlanRepository {
  private readonly store = new InMemoryVersionedStore<ActionPlanProps>();

  async findById(organizationId: string, id: string): Promise<ActionPlan | null> {
    const row = this.store.get(organizationId, id);
    return row ? ActionPlan.restore(row) : null;
  }

  async findAll(organizationId: string): Promise<ActionPlan[]> {
    return this.store.list(organizationId).map((row) => ActionPlan.restore(row));
  }

  async save(plan: ActionPlan): Promise<void> {
    this.store.save(plan.snapshot());
  }

  seed(plan: ActionPlan): void {
    this.store.seed(plan.snapshot());
  }
}
