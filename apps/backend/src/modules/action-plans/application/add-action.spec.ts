import { NotFoundError } from '../../../shared/domain/errors';
import { Role } from '../../../shared/domain/role';
import { FixedClock } from '../../../shared/testing/fixed-clock';
import { ActionPlan } from '../domain/action-plan';
import { InMemoryActionPlanRepository } from '../infrastructure/in-memory-action-plan.repository';
import { InMemoryActionRepository } from '../infrastructure/in-memory-action.repository';
import { AddAction } from './add-action';

describe('AddAction', () => {
  it('rend introuvable le plan d’une autre organisation, sans y ajouter d’action', async () => {
    const createdAt = new Date('2026-10-07T10:00:00Z');
    const plans = new InMemoryActionPlanRepository();
    const actions = new InMemoryActionRepository();
    plans.seed(ActionPlan.create({ id: 'plan-lac', organizationId: 'org-lac', title: 'Plan', description: null, createdAt }));
    const admin = { userId: 'alice', organizationId: 'org-lilas', role: Role.ADMIN };

    await expect(
      new AddAction(plans, actions, new FixedClock(createdAt)).execute({
        actor: admin,
        planId: 'plan-lac',
        title: 'Intrusion',
        description: null,
      }),
    ).rejects.toThrow(NotFoundError);
    expect(await actions.findByPlan('org-lac', 'plan-lac')).toEqual([]);
  });
});
