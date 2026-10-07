import { randomUUID } from 'node:crypto';
import { ConflictError, StaleVersionError } from '../../../shared/domain/errors';
import { ALICE, BOB } from '../../../shared/testing/test-ids';
import { parseEmail } from '../domain/email';
import { User } from '../domain/user';
import { UserRepository } from '../domain/user.repository';

/** Contrat commun à toutes les implémentations d'`UserRepository` (rejoué sur PostgreSQL en tranche 4). */
export function describeUserRepositoryContract(name: string, createRepository: () => Promise<UserRepository>) {
  describe(`UserRepository (${name})`, () => {
    let repository: UserRepository;

    const newUser = (id: string, email: string, createdAt = '2026-10-07T10:00:00Z') =>
      User.create({
        id,
        email: parseEmail(email),
        name: 'Nom',
        passwordHash: 'hash',
        mustChangePassword: false,
        createdAt: new Date(createdAt),
      });

    beforeEach(async () => {
      repository = await createRepository();
      await repository.save(newUser(ALICE, 'Alice@Lilas.fr'));
    });

    it('retrouve un compte par sa forme de comparaison', async () => {
      expect((await repository.findByEmail('alice@lilas.fr'))?.id).toBe(ALICE);
      expect(await repository.findByEmail('inconnu@lilas.fr')).toBeNull();
    });

    it('refuse un second compte avec le même email, quelle que soit la casse (D8)', async () => {
      await expect(repository.save(newUser(randomUUID(), 'ALICE@lilas.fr'))).rejects.toThrow(ConflictError);
    });

    it('retrouve plusieurs comptes par leurs ids', async () => {
      await repository.save(newUser(BOB, 'bob@lilas.fr', '2026-10-08T10:00:00Z'));
      const users = await repository.findByIds([BOB, ALICE, randomUUID()]);
      expect(users.map((user) => user.id).sort()).toEqual([ALICE, BOB].sort());
    });

    it('enregistre un changement et incrémente la version', async () => {
      const user = (await repository.findById(ALICE)) as User;
      user.revokeSessions(new Date('2026-10-07T12:00:00Z'));
      await repository.save(user);
      expect((await repository.findById(ALICE))?.snapshot()).toMatchObject({
        sessionsValidAfter: new Date('2026-10-07T12:00:00Z'),
        version: 2,
      });
    });

    it('rejette la seconde de deux sauvegardes concurrentes de la même version (D14)', async () => {
      const first = (await repository.findById(ALICE)) as User;
      const second = (await repository.findById(ALICE)) as User;
      await repository.save(first);
      await expect(repository.save(second)).rejects.toThrow(StaleVersionError);
    });
  });
}
