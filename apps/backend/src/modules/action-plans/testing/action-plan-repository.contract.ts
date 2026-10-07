import { StaleVersionError } from '../../../shared/domain/errors';
import { ActionPlan } from '../domain/action-plan';
import { ActionPlanRepository } from '../domain/action-plan.repository';

/** Contrat commun à toutes les implémentations d'`ActionPlanRepository` (cf. contrat des actions). */
export function describeActionPlanRepositoryContract(
  name: string,
  createRepository: () => Promise<ActionPlanRepository>,
) {
  describe(`ActionPlanRepository (${name})`, () => {
    let repository: ActionPlanRepository;

    const newPlan = (id: string, organizationId: string, createdAt: string) =>
      ActionPlan.create({ id, organizationId, title: `Plan ${id}`, description: null, createdAt: new Date(createdAt) });

    beforeEach(async () => {
      repository = await createRepository();
      await repository.save(newPlan('p2', 'org-a', '2026-10-08T10:00:00Z'));
      await repository.save(newPlan('p1', 'org-a', '2026-10-07T10:00:00Z'));
      await repository.save(newPlan('p3', 'org-b', '2026-10-07T10:00:00Z'));
    });

    it('ne renvoie pas un plan d’une autre organisation', async () => {
      expect(await repository.findById('org-b', 'p1')).toBeNull();
    });

    it('liste les plans de l’organisation, par date de création', async () => {
      expect((await repository.findAll('org-a')).map((plan) => plan.id)).toEqual(['p1', 'p2']);
    });

    it('enregistre une modification et incrémente la version', async () => {
      const plan = (await repository.findById('org-a', 'p1')) as ActionPlan;
      plan.edit('Audit hygiène 2026', 'Suite à la visite');
      await repository.save(plan);

      const saved = await repository.findById('org-a', 'p1');
      expect(saved?.snapshot()).toMatchObject({ title: 'Audit hygiène 2026', description: 'Suite à la visite', version: 2 });
    });

    it('rejette la seconde de deux sauvegardes concurrentes de la même version (D14)', async () => {
      const first = (await repository.findById('org-a', 'p1')) as ActionPlan;
      const second = (await repository.findById('org-a', 'p1')) as ActionPlan;
      first.edit('Premier', null);
      second.edit('Second', null);

      await repository.save(first);

      await expect(repository.save(second)).rejects.toThrow(StaleVersionError);
    });
  });
}
