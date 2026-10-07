import { Actor } from '../../../shared/domain/actor';
import { AuthenticationError, ConflictError, NotFoundError, ValidationError } from '../../../shared/domain/errors';
import { Role } from '../../../shared/domain/role';
import { FixedClock } from '../../../shared/testing/fixed-clock';
import { commonPasswords, IdentityFixture, VALID_PASSWORD } from '../testing/identity-fixture';
import { ChangePassword } from './change-password';
import { IdentityQueries } from './identity-queries';
import { INVALID_CREDENTIALS, Login } from './login';
import { Logout } from './logout';
import { ChangeMemberRole, RemoveMember } from './manage-members';
import { ResolveSession } from './resolve-session';

describe('Cas d’usage identity, hors scénarios de la spec', () => {
  let fixture: IdentityFixture;
  let alice: Actor;

  const resolve = (userId: string, issuedAt: Date) =>
    new ResolveSession(fixture.users, fixture.memberships).execute({ userId, issuedAt });
  const changePassword = (userId: string, currentPassword: string, newPassword: string, at = fixture.clock) =>
    new ChangePassword(fixture.users, fixture.hasher, commonPasswords, at).execute({ userId, currentPassword, newPassword });

  beforeEach(async () => {
    fixture = new IdentityFixture();
    alice = await fixture.registerAdmin();
  });

  describe('Register', () => {
    it.each([
      ['l’email', 'alice.martin@lilas.fr'],
      ['le nom du service', 'QUALINEO'],
    ])('refuse un mot de passe égal à un mot du contexte : %s (ASVS 6.2.11)', async (_, password) => {
      await expect(fixture.registerAdmin({ email: 'alice.martin@lilas.fr', password })).rejects.toThrow(ValidationError);
    });

    it('refuse un mot de passe courant de la liste interdite (ASVS 6.2.4)', async () => {
      await expect(fixture.registerAdmin({ email: 'zoe@lac.fr', password: 'PasswordPassword' })).rejects.toThrow(
        'trop courant',
      );
    });

    it('refuse un email déjà pris, quelle que soit sa casse', async () => {
      await expect(fixture.registerAdmin({ email: 'ALICE@lilas.fr' })).rejects.toThrow(ConflictError);
    });
  });

  describe('Login', () => {
    it.each(['pas-un-email', ''])('répond le message générique pour un email mal formé : %j', async (email) => {
      await expect(
        new Login(fixture.users, fixture.memberships, fixture.hasher).execute({ email, password: VALID_PASSWORD }),
      ).rejects.toThrow(INVALID_CREDENTIALS);
    });

    it('accepte l’email dans une autre casse', async () => {
      const result = await new Login(fixture.users, fixture.memberships, fixture.hasher).execute({
        email: ' Alice@LILAS.fr ',
        password: VALID_PASSWORD,
      });
      expect(result).toMatchObject({ userId: alice.userId, role: Role.ADMIN, mustChangePassword: false });
    });
  });

  describe('ResolveSession et Logout (D16)', () => {
    it('refuse les jetons émis avant la déconnexion, accepte ceux émis après', async () => {
      const before = new Date('2026-10-07T09:00:00Z');
      await new Logout(fixture.users, fixture.clock).execute(alice.userId);

      await expect(resolve(alice.userId, before)).rejects.toThrow(AuthenticationError);
      expect((await resolve(alice.userId, fixture.clock.now())).actor).toEqual(alice);
    });

    it('refuse un compte inconnu', async () => {
      await expect(resolve('inconnu', fixture.clock.now())).rejects.toThrow(AuthenticationError);
    });

    it('ignore la déconnexion d’un compte inconnu', async () => {
      await expect(new Logout(fixture.users, fixture.clock).execute('inconnu')).resolves.toBeUndefined();
    });
  });

  describe('ChangePassword', () => {
    it('exige le mot de passe actuel (ASVS 6.2.3)', async () => {
      await expect(changePassword(alice.userId, 'pas le bon mot de passe', 'une toute nouvelle phrase')).rejects.toThrow(
        'Le mot de passe actuel est incorrect',
      );
    });

    it('applique la politique au nouveau mot de passe', async () => {
      await expect(changePassword(alice.userId, VALID_PASSWORD, 'trop court')).rejects.toThrow(ValidationError);
      await expect(changePassword(alice.userId, VALID_PASSWORD, 'alice@lilas.fr')).rejects.toThrow(ValidationError);
    });

    it('ferme les sessions ouvertes avec l’ancien mot de passe (ASVS 7.4.3)', async () => {
      const later = new FixedClock(new Date('2026-10-07T11:00:00Z'));
      await changePassword(alice.userId, VALID_PASSWORD, 'une toute nouvelle phrase', later);
      await expect(resolve(alice.userId, fixture.clock.now())).rejects.toThrow(AuthenticationError);
    });

    it('rend introuvable un compte inconnu', async () => {
      await expect(changePassword('inconnu', VALID_PASSWORD, 'une toute nouvelle phrase')).rejects.toThrow(NotFoundError);
    });
  });

  describe('Gestion des membres entre organisations (ASVS 8.4.1)', () => {
    let xavier: Actor;

    beforeEach(async () => {
      xavier = await fixture.registerAdmin({ organizationName: 'Clinique du Lac', name: 'Xavier', email: 'xavier@lac.fr' });
    });

    it('rend introuvable le membre d’une autre organisation, sans le modifier', async () => {
      await expect(
        new ChangeMemberRole(fixture.memberships).execute({ actor: xavier, userId: alice.userId, role: Role.MEMBER }),
      ).rejects.toThrow(NotFoundError);
      await expect(
        new RemoveMember(fixture.memberships, fixture.clock).execute({ actor: xavier, userId: alice.userId }),
      ).rejects.toThrow(NotFoundError);
      expect((await fixture.memberships.findActiveByUser(alice.userId))?.role).toBe(Role.ADMIN);
    });

    it('ne liste que les membres de sa propre organisation', async () => {
      const queries = new IdentityQueries(fixture.users, fixture.organizations, fixture.memberships);
      expect((await queries.listMembers(xavier)).map((member) => member.name)).toEqual(['Xavier']);
    });

    it('trace le retrait d’un membre : qui et quand (D9)', async () => {
      const { userId } = await fixture.addMember(alice, 'carla@lilas.fr');
      const membershipId = (await fixture.memberships.findActive(alice.organizationId, userId))?.id ?? '';
      await new RemoveMember(fixture.memberships, fixture.clock).execute({ actor: alice, userId });

      expect(fixture.memberships.stored(alice.organizationId, membershipId)).toMatchObject({
        removedBy: alice.userId,
        removedAt: fixture.clock.now(),
      });
      expect(await fixture.memberships.findActive(alice.organizationId, userId)).toBeNull();
    });
  });

  describe('AddMember', () => {
    it('refuse un email déjà utilisé, même dans une autre organisation (D8)', async () => {
      await fixture.registerAdmin({ organizationName: 'Clinique du Lac', name: 'Xavier', email: 'xavier@lac.fr' });
      await expect(fixture.addMember(alice, 'Xavier@lac.fr')).rejects.toThrow(ConflictError);
    });

    it('génère un mot de passe temporaire différent à chaque ajout', async () => {
      const bob = await fixture.addMember(alice, 'bob@lilas.fr');
      const carla = await fixture.addMember(alice, 'carla@lilas.fr');
      expect(bob.temporaryPassword).not.toBe(carla.temporaryPassword);
    });
  });

  describe('IdentityQueries.currentMember', () => {
    it('rend introuvable un acteur sans compte', async () => {
      const queries = new IdentityQueries(fixture.users, fixture.organizations, fixture.memberships);
      await expect(queries.currentMember({ ...alice, userId: 'inconnu' })).rejects.toThrow(NotFoundError);
    });
  });

  describe('IdentityQueries.userNames', () => {
    it('rend le nom des comptes connus, même retirés, et ignore les autres', async () => {
      const queries = new IdentityQueries(fixture.users, fixture.organizations, fixture.memberships);
      const { userId } = await fixture.addMember(alice, 'carla@lilas.fr');
      await new RemoveMember(fixture.memberships, fixture.clock).execute({ actor: alice, userId });

      const names = await queries.userNames([alice.userId, userId, 'inconnu']);

      expect([...names.keys()]).toEqual(expect.arrayContaining([alice.userId, userId]));
      expect(names.has('inconnu')).toBe(false);
    });
  });
});
