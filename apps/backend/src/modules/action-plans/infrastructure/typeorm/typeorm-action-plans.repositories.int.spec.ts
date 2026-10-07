import { randomUUID } from 'node:crypto';
import { QueryFailedError } from 'typeorm';
import { useIntegrationDatabase } from '../../../../shared/testing/integration-database';
import { ORG_A, PLAN_3 } from '../../../../shared/testing/test-ids';
import { Action } from '../../domain/action';
import {
  ACTION_PLAN_REPOSITORY,
  ActionPlanRepository,
} from '../../domain/action-plan.repository';
import {
  ACTION_REPOSITORY,
  ActionRepository,
} from '../../domain/action.repository';
import { describeActionPlanRepositoryContract } from '../../testing/action-plan-repository.contract';
import { describeActionRepositoryContract } from '../../testing/action-repository.contract';

const db = useIntegrationDatabase();

describeActionPlanRepositoryContract('PostgreSQL', async () => {
  await db.reset();
  await db.seedOrganizations();
  return db.get<ActionPlanRepository>(ACTION_PLAN_REPOSITORY);
});

describeActionRepositoryContract('PostgreSQL', async () => {
  await db.reset();
  await db.seedOrganizations();
  await db.seedUsers();
  await db.seedPlans();
  return db.get<ActionRepository>(ACTION_REPOSITORY);
});

describe('Clé étrangère composite des actions (PostgreSQL, D30)', () => {
  beforeEach(async () => {
    await db.reset();
    await db.seedOrganizations();
    await db.seedUsers();
    await db.seedPlans();
  });

  // Dernier rempart de l'isolation : même un bug applicatif ne peut rattacher une action au plan d'une autre organisation.
  it('refuse une action rattachée au plan d’une autre organisation', async () => {
    const action = Action.create({
      id: randomUUID(),
      organizationId: ORG_A,
      planId: PLAN_3,
      title: 'Action',
      description: null,
      createdAt: new Date('2026-10-07T10:00:00Z'),
    });

    const saving = db.get<ActionRepository>(ACTION_REPOSITORY).save(action);

    await expect(saving).rejects.toThrow(QueryFailedError);
    await expect(saving).rejects.toMatchObject({
      driverError: { constraint: 'fk_actions_plan_same_organization' },
    });
  });
});
