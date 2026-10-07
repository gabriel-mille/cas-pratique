import { StaleVersionError } from '../../../shared/domain/errors';
import { ORG_A, ORG_B, PLAN_1, PLAN_2, PLAN_3 } from '../../../shared/testing/test-ids';
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
      ActionPlan.create({ id, organizationId, title: 'Plan', description: null, createdAt: new Date(createdAt) });

    beforeEach(async () => {
      repository = await createRepository();
      await repository.save(newPlan(PLAN_2, ORG_A, '2026-10-08T10:00:00Z'));
      await repository.save(newPlan(PLAN_1, ORG_A, '2026-10-07T10:00:00Z'));
      await repository.save(newPlan(PLAN_3, ORG_B, '2026-10-07T10:00:00Z'));
    });

    it('ne renvoie pas un plan d’une autre organisation', async () => {
      expect(await repository.findById(ORG_B, PLAN_1)).toBeNull();
    });

    it('liste les plans de l’organisation, par date de création', async () => {
      expect((await repository.findAll(ORG_A)).map((plan) => plan.id)).toEqual([PLAN_1, PLAN_2]);
    });

    it('enregistre une modification et incrémente la version', async () => {
      const plan = (await repository.findById(ORG_A, PLAN_1)) as ActionPlan;
      plan.edit('Audit hygiène 2026', 'Suite à la visite');
      await repository.save(plan);

      const saved = await repository.findById(ORG_A, PLAN_1);
      expect(saved?.snapshot()).toMatchObject({ title: 'Audit hygiène 2026', description: 'Suite à la visite', version: 2 });
    });

    it('rejette la seconde de deux sauvegardes concurrentes de la même version (D14)', async () => {
      const first = (await repository.findById(ORG_A, PLAN_1)) as ActionPlan;
      const second = (await repository.findById(ORG_A, PLAN_1)) as ActionPlan;
      first.edit('Premier', null);
      second.edit('Second', null);

      await repository.save(first);

      await expect(repository.save(second)).rejects.toThrow(StaleVersionError);
    });
  });
}
