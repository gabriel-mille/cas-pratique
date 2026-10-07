import { ConflictError, StaleVersionError } from '../../../shared/domain/errors';
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
        name: id,
        passwordHash: 'hash',
        mustChangePassword: false,
        createdAt: new Date(createdAt),
      });

    beforeEach(async () => {
      repository = await createRepository();
      await repository.save(newUser('alice', 'Alice@Lilas.fr'));
    });

    it('retrouve un compte par sa forme de comparaison', async () => {
      expect((await repository.findByEmail('alice@lilas.fr'))?.id).toBe('alice');
      expect(await repository.findByEmail('inconnu@lilas.fr')).toBeNull();
    });

    it('refuse un second compte avec le même email, quelle que soit la casse (D8)', async () => {
      await expect(repository.save(newUser('alice-bis', 'ALICE@lilas.fr'))).rejects.toThrow(ConflictError);
    });

    it('retrouve plusieurs comptes par leurs ids', async () => {
      await repository.save(newUser('bob', 'bob@lilas.fr', '2026-10-08T10:00:00Z'));
      const users = await repository.findByIds(['bob', 'alice', 'absent']);
      expect(users.map((user) => user.id).sort()).toEqual(['alice', 'bob']);
    });

    it('enregistre un changement et incrémente la version', async () => {
      const user = (await repository.findById('alice')) as User;
      user.revokeSessions(new Date('2026-10-07T12:00:00Z'));
      await repository.save(user);
      expect((await repository.findById('alice'))?.snapshot()).toMatchObject({
        sessionsValidAfter: new Date('2026-10-07T12:00:00Z'),
        version: 2,
      });
    });

    it('rejette la seconde de deux sauvegardes concurrentes de la même version (D14)', async () => {
      const first = (await repository.findById('alice')) as User;
      const second = (await repository.findById('alice')) as User;
      await repository.save(first);
      await expect(repository.save(second)).rejects.toThrow(StaleVersionError);
    });
  });
}
