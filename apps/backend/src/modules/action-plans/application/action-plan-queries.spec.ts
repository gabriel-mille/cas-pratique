import { NotFoundError } from '../../../shared/domain/errors';
import { Role } from '../../../shared/domain/role';
import { Action } from '../domain/action';
import { ActionPlan } from '../domain/action-plan';
import { ActionStatus } from '../domain/action-status';
import { InMemoryActionPlanRepository } from '../infrastructure/in-memory-action-plan.repository';
import { InMemoryActionRepository } from '../infrastructure/in-memory-action.repository';
import { ActionPlanQueries } from './action-plan-queries';
import { AuthorDirectory } from './author-directory';

const alice = { userId: 'user-alice', organizationId: 'org-a', role: Role.ADMIN };
const outsider = { userId: 'user-xavier', organizationId: 'org-b', role: Role.ADMIN };
const createdAt = new Date('2026-10-07T10:00:00Z');
const at = new Date('2026-10-07T11:00:00Z');

describe('ActionPlanQueries', () => {
  let plans: InMemoryActionPlanRepository;
  let actions: InMemoryActionRepository;
  let queries: ActionPlanQueries;

  beforeEach(async () => {
    plans = new InMemoryActionPlanRepository();
    actions = new InMemoryActionRepository();
    const authors: AuthorDirectory = {
      namesOf: async (userIds) => new Map(userIds.filter((id) => id === 'user-alice').map((id) => [id, 'Alice'])),
    };
    queries = new ActionPlanQueries(plans, actions, authors);
    await plans.save(
      ActionPlan.create({ id: 'plan-1', organizationId: 'org-a', title: 'Audit', description: null, createdAt }),
    );
  });

  describe('getPlan', () => {
    it('rend le plan avec sa version', async () => {
      expect(await queries.getPlan(alice, 'plan-1')).toEqual({
        id: 'plan-1',
        title: 'Audit',
        description: null,
        version: 1,
      });
    });

    it('ne révèle pas le plan d’une autre organisation', async () => {
      await expect(queries.getPlan(outsider, 'plan-1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getActionDetail', () => {
    it('rend l’historique avec le nom des auteurs, dans l’ordre (D5)', async () => {
      const action = Action.create({
        id: 'action-1',
        organizationId: 'org-a',
        planId: 'plan-1',
        title: 'Former',
        description: null,
        createdAt,
      });
      action.changeStatus(ActionStatus.IN_PROGRESS, alice, at);
      await actions.save(action);

      expect(await queries.getActionDetail(alice, 'action-1')).toMatchObject({
        id: 'action-1',
        status: ActionStatus.IN_PROGRESS,
        version: 1,
        history: [
          {
            from: ActionStatus.TODO,
            to: ActionStatus.IN_PROGRESS,
            at,
            reason: null,
            author: { userId: 'user-alice', name: 'Alice' },
          },
        ],
      });
    });

    it('garde l’auteur sans nom s’il est introuvable', async () => {
      const action = Action.create({
        id: 'action-1',
        organizationId: 'org-a',
        planId: 'plan-1',
        title: 'Former',
        description: null,
        createdAt,
      });
      action.changeStatus(ActionStatus.IN_PROGRESS, { userId: 'user-gone', role: Role.ADMIN }, at);
      await actions.save(action);

      const detail = await queries.getActionDetail(alice, 'action-1');

      expect(detail.history[0].author).toEqual({ userId: 'user-gone', name: null });
    });

    it('ne révèle pas l’action d’une autre organisation', async () => {
      await expect(queries.getActionDetail(outsider, 'action-1')).rejects.toThrow(NotFoundError);
    });
  });
});
