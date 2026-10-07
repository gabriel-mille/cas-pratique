import { ForbiddenError } from '../../../shared/domain/errors';
import { Role } from '../../../shared/domain/role';
import { Membership } from './membership';

describe('Membership (D9)', () => {
  const at = new Date('2026-10-07T10:00:00Z');
  const denis = () =>
    Membership.create({ id: 'm-denis', organizationId: 'org', userId: 'denis', role: Role.ADMIN, createdAt: at });

  it('un admin change le rôle d’un autre membre', () => {
    const membership = denis();
    membership.changeRole(Role.MANAGER, 'alice');
    expect(membership.role).toBe(Role.MANAGER);
  });

  it('personne ne change son propre rôle', () => {
    expect(() => denis().changeRole(Role.MANAGER, 'denis')).toThrow(ForbiddenError);
  });

  it('un retrait est tracé : qui et quand', () => {
    const membership = denis();
    membership.remove('alice', at);
    expect(membership.snapshot()).toMatchObject({ removedAt: at, removedBy: 'alice' });
  });

  it('personne ne se retire soi-même', () => {
    expect(() => denis().remove('denis', at)).toThrow('On ne peut pas se retirer soi-même');
  });
});
