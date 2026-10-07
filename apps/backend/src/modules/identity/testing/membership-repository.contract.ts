import { randomUUID } from 'node:crypto';
import { Role } from '../../../shared/domain/role';
import { ALICE, BOB, ORG_A, ORG_B, XAVIER } from '../../../shared/testing/test-ids';
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
      Membership.create({ id: randomUUID(), organizationId, userId, role: Role.MEMBER, createdAt: new Date(createdAt) });

    beforeEach(async () => {
      repository = await createRepository();
      await repository.save(newMembership(BOB, ORG_A, '2026-10-08T10:00:00Z'));
      await repository.save(newMembership(ALICE, ORG_A, '2026-10-07T10:00:00Z'));
      await repository.save(newMembership(XAVIER, ORG_B, '2026-10-07T10:00:00Z'));
    });

    it('liste les membres de l’organisation, par date d’arrivée', async () => {
      expect((await repository.listActive(ORG_A)).map((membership) => membership.userId)).toEqual([ALICE, BOB]);
    });

    it('ne renvoie pas l’appartenance d’une autre organisation', async () => {
      expect(await repository.findActive(ORG_B, ALICE)).toBeNull();
      expect((await repository.findActiveByUser(XAVIER))?.organizationId).toBe(ORG_B);
    });

    it('enregistre un changement de rôle et incrémente la version', async () => {
      const membership = (await repository.findActive(ORG_A, BOB)) as Membership;
      membership.changeRole(Role.MANAGER, ALICE);
      await repository.save(membership);
      expect((await repository.findActive(ORG_A, BOB))?.snapshot()).toMatchObject({ role: Role.MANAGER, version: 2 });
    });

    it('n’expose plus une appartenance retirée, dans aucune lecture (D9)', async () => {
      const membership = (await repository.findActive(ORG_A, BOB)) as Membership;
      membership.remove(ALICE, new Date('2026-10-09T10:00:00Z'));
      await repository.save(membership);

      expect(await repository.findActive(ORG_A, BOB)).toBeNull();
      expect(await repository.findActiveByUser(BOB)).toBeNull();
      expect((await repository.listActive(ORG_A)).map((m) => m.userId)).toEqual([ALICE]);
    });
  });
}
