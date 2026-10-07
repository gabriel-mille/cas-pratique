import { NotFoundError, StaleVersionError } from '../../../shared/domain/errors';
import { Role } from '../../../shared/domain/role';
import { Action } from '../domain/action';
import { InMemoryActionRepository } from '../infrastructure/in-memory-action.repository';
import { loadActionForUpdate } from './load-action-for-update';

describe('loadActionForUpdate', () => {
  const actions = new InMemoryActionRepository();
  actions.seed(
    Action.create({ id: 'a1', organizationId: 'org-a', planId: 'p1', title: 'T', description: null, createdAt: new Date() }),
  );

  it('rend introuvable une action d’une autre organisation, sans révéler son existence', async () => {
    const outsider = { userId: 'eve', organizationId: 'org-b', role: Role.ADMIN };

    await expect(loadActionForUpdate(actions, outsider, 'a1', 1)).rejects.toThrow(NotFoundError);
  });

  it('refuse une version attendue différente de la version courante', async () => {
    const admin = { userId: 'alice', organizationId: 'org-a', role: Role.ADMIN };

    await expect(loadActionForUpdate(actions, admin, 'a1', 2)).rejects.toThrow(StaleVersionError);
  });
});
