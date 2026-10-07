import { StaleVersionError } from '../../../shared/domain/errors';
import { Role } from '../../../shared/domain/role';
import { Action } from '../domain/action';
import { ActionStatus } from '../domain/action-status';
import { ActionRepository } from '../domain/action.repository';

/**
 * Contrat commun à toutes les implémentations d'`ActionRepository` :
 * joué sur l'implémentation en mémoire, puis sur TypeORM contre PostgreSQL.
 */
export function describeActionRepositoryContract(name: string, createRepository: () => Promise<ActionRepository>) {
  describe(`ActionRepository (${name})`, () => {
    const at = new Date('2026-10-07T10:00:00Z');
    const manager = { userId: 'bob', role: Role.MANAGER };
    let repository: ActionRepository;

    const newAction = (id = 'a1', organizationId = 'org-a', planId = 'p1', createdAt = at) =>
      Action.create({ id, organizationId, planId, title: `Action ${id}`, description: null, createdAt });
    const ids = (actions: Action[]) => actions.map((action) => action.id);

    beforeEach(async () => {
      repository = await createRepository();
      await repository.save(newAction());
    });

    it('ne renvoie pas une action d’une autre organisation', async () => {
      expect(await repository.findById('org-b', 'a1')).toBeNull();
    });

    it('enregistre l’état et l’historique, et incrémente la version', async () => {
      const action = await repository.findById('org-a', 'a1');
      action?.changeStatus(ActionStatus.IN_PROGRESS, manager, at);
      await repository.save(action as Action);

      const saved = await repository.findById('org-a', 'a1');
      expect(saved?.status).toBe(ActionStatus.IN_PROGRESS);
      expect(saved?.version).toBe(2);
      expect(saved?.statusChanges).toEqual([
        { from: ActionStatus.TODO, to: ActionStatus.IN_PROGRESS, by: 'bob', at, reason: null },
      ]);
    });

    it('rejette la seconde de deux sauvegardes concurrentes de la même version (D14)', async () => {
      const first = (await repository.findById('org-a', 'a1')) as Action;
      const second = (await repository.findById('org-a', 'a1')) as Action;
      first.changeStatus(ActionStatus.IN_PROGRESS, manager, at);
      second.changeStatus(ActionStatus.IN_PROGRESS, manager, at);

      await repository.save(first);

      await expect(repository.save(second)).rejects.toThrow(StaleVersionError);
      expect((await repository.findById('org-a', 'a1'))?.statusChanges).toHaveLength(1);
    });

    it('liste les actions d’un plan de l’organisation, par date de création', async () => {
      await repository.save(newAction('a3', 'org-a', 'p1', new Date('2026-10-09T10:00:00Z')));
      await repository.save(newAction('a2', 'org-a', 'p1', new Date('2026-10-08T10:00:00Z')));
      await repository.save(newAction('other-plan', 'org-a', 'p2'));
      await repository.save(newAction('other-org', 'org-b', 'p1'));

      expect(ids(await repository.findByPlan('org-a', 'p1'))).toEqual(['a1', 'a2', 'a3']);
    });

    it('n’expose plus une action supprimée, ni en détail ni dans son plan (D7)', async () => {
      const action = (await repository.findById('org-a', 'a1')) as Action;
      action.delete('alice', at);
      await repository.save(action);

      expect(await repository.findById('org-a', 'a1')).toBeNull();
      expect(await repository.findByPlan('org-a', 'p1')).toEqual([]);
    });
  });
}
