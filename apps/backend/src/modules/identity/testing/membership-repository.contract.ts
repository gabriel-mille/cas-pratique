import { Role } from '../../../shared/domain/role';
import { Membership } from '../domain/membership';
import { MembershipRepository } from '../domain/membership.repository';

/** Contrat commun à toutes les implémentations de `MembershipRepository`. */
export function describeMembershipRepositoryContract(
  name: string,
  createRepository: () => Promise<MembershipRepository>,
) {
  describe(`MembershipRepository (${name})`, () => {
    let repository: MembershipRepository;

    const newMembership = (userId: string, organizationId: string, createdAt: string) =>
      Membership.create({ id: `m-${userId}`, organizationId, userId, role: Role.MEMBER, createdAt: new Date(createdAt) });

    beforeEach(async () => {
      repository = await createRepository();
      await repository.save(newMembership('bob', 'org-a', '2026-10-08T10:00:00Z'));
      await repository.save(newMembership('alice', 'org-a', '2026-10-07T10:00:00Z'));
      await repository.save(newMembership('xavier', 'org-b', '2026-10-07T10:00:00Z'));
    });

    it('liste les membres de l’organisation, par date d’arrivée', async () => {
      expect((await repository.listActive('org-a')).map((membership) => membership.userId)).toEqual(['alice', 'bob']);
    });

    it('ne renvoie pas l’appartenance d’une autre organisation', async () => {
      expect(await repository.findActive('org-b', 'alice')).toBeNull();
      expect((await repository.findActiveByUser('xavier'))?.organizationId).toBe('org-b');
    });

    it('enregistre un changement de rôle et incrémente la version', async () => {
      const membership = (await repository.findActive('org-a', 'bob')) as Membership;
      membership.changeRole(Role.MANAGER, 'alice');
      await repository.save(membership);
      expect((await repository.findActive('org-a', 'bob'))?.snapshot()).toMatchObject({ role: Role.MANAGER, version: 2 });
    });

    it('n’expose plus une appartenance retirée, dans aucune lecture (D9)', async () => {
      const membership = (await repository.findActive('org-a', 'bob')) as Membership;
      membership.remove('alice', new Date('2026-10-09T10:00:00Z'));
      await repository.save(membership);

      expect(await repository.findActive('org-a', 'bob')).toBeNull();
      expect(await repository.findActiveByUser('bob')).toBeNull();
      expect((await repository.listActive('org-a')).map((m) => m.userId)).toEqual(['alice']);
    });
  });
}
