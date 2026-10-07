import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { fileURLToPath } from 'node:url';
import { Actor } from '../../../shared/domain/actor';
import { AuthenticationError, ConflictError, ForbiddenError, ValidationError } from '../../../shared/domain/errors';
import { Role } from '../../../shared/domain/role';
import { ImmediateTransactionRunner } from '../../../shared/infrastructure/immediate-transaction-runner';
import { FixedClock } from '../../../shared/testing/fixed-clock';
import { FilePasswordBlocklist } from '../infrastructure/file-password-blocklist';
import { InMemoryMembershipRepository } from '../infrastructure/in-memory-membership.repository';
import { InMemoryOrganizationRepository } from '../infrastructure/in-memory-organization.repository';
import { InMemoryUserRepository } from '../infrastructure/in-memory-user.repository';
import { FastPasswordHasher } from '../testing/fast-password-hasher';
import { roleFromLabel } from '../testing/role-labels';
import { AddMember } from './add-member';
import { ChangePassword } from './change-password';
import { IdentityQueries } from './identity-queries';
import { INVALID_CREDENTIALS, Login, LoginResult } from './login';
import { ChangeMemberRole, RemoveMember } from './manage-members';
import { Register } from './register';
import { ResolveSession } from './resolve-session';

const feature = await loadFeature(
  fileURLToPath(new URL('../../../../../../docs/specs/features/accounts-and-members.feature', import.meta.url)),
  { language: 'fr' },
);

const blocklist = FilePasswordBlocklist.fromFile(
  fileURLToPath(new URL('../infrastructure/common-passwords.txt', import.meta.url)),
);

const LILAS = 'Clinique des Lilas';
const VALID_PASSWORD = 'cheval agrafe pile correcte';

interface Member {
  actor: Actor;
  email: string;
  password: string;
}

describeFeature(feature, ({ AfterEachScenario, Rule }) => {
  let users: InMemoryUserRepository;
  let organizations: InMemoryOrganizationRepository;
  let memberships: InMemoryMembershipRepository;
  let hasher: FastPasswordHasher;
  let clock: FixedClock;
  let queries: IdentityQueries;
  let members: Map<string, Member>;
  let error: unknown;
  let added: { userId: string; temporaryPassword: string };
  let loggedIn: LoginResult;

  // Remise à zéro après chaque scénario : le Contexte d'une règle s'exécute avant `BeforeEachScenario`.
  const reset = () => {
    users = new InMemoryUserRepository();
    organizations = new InMemoryOrganizationRepository();
    memberships = new InMemoryMembershipRepository();
    hasher = new FastPasswordHasher();
    clock = new FixedClock(new Date('2026-10-07T10:00:00Z'));
    queries = new IdentityQueries(users, organizations, memberships);
    members = new Map();
    error = undefined;
  };
  reset();
  AfterEachScenario(reset);

  const attempt = async (run: () => Promise<unknown>) => {
    try {
      await run();
    } catch (e) {
      error = e;
    }
  };

  const register = (command: Partial<Parameters<Register['execute']>[0]> = {}) =>
    new Register(users, organizations, memberships, hasher, blocklist, new ImmediateTransactionRunner(), clock).execute({
      organizationName: LILAS,
      name: 'Alice',
      email: 'alice@lilas.fr',
      password: VALID_PASSWORD,
      ...command,
    });
  const login = (email: string, password: string) => new Login(users, memberships, hasher).execute({ email, password });
  const resolve = (name: string) =>
    new ResolveSession(users, memberships).execute({ userId: member(name).actor.userId, issuedAt: clock.now() });
  const addMember = (actor: Actor, email: string, name: string, role: Role) =>
    new AddMember(users, memberships, hasher, new ImmediateTransactionRunner(), clock).execute({ actor, email, name, role });

  const member = (name: string): Member => {
    const found = members.get(name);
    if (!found) throw new Error(`Membre inconnu : ${name}`);
    return found;
  };
  const remember = async (name: string, email: string, password: string) => {
    const { userId, organizationId, role } = await login(email, password);
    members.set(name, { actor: { userId, organizationId, role }, email, password });
  };
  const givenAlice = async () => {
    await register();
    await remember('Alice', 'alice@lilas.fr', VALID_PASSWORD);
  };
  const givenMember = async (name: string, role: Role) => {
    const email = `${name.toLowerCase()}@lilas.fr`;
    const { temporaryPassword } = await addMember(member('Alice').actor, email, name, role);
    await remember(name, email, temporaryPassword);
  };
  const listedMembers = async () =>
    (await queries.listMembers(member('Alice').actor)).map(({ name, role }) => ({ name, role }));

  Rule(`Créer un compte crée une organisation et son premier administrateur`, ({ RuleScenario }) => {
    RuleScenario(`Alice crée la Clinique des Lilas`, ({ When, Then, And }) => {
      When(
        `un visiteur s'inscrit avec l'organisation "${LILAS}", le nom "Alice", l'email "alice@lilas.fr" et un mot de passe valide`,
        givenAlice,
      );
      Then(`l'organisation "${LILAS}" existe`, async () => {
        expect((await queries.currentMember(member('Alice').actor)).organizationName).toBe(LILAS);
      });
      And(`Alice en est Admin`, async () => {
        expect(await queries.currentMember(member('Alice').actor)).toMatchObject({ name: 'Alice', role: Role.ADMIN });
      });
    });

    RuleScenario(`Email déjà utilisé`, ({ Given, When, Then }) => {
      Given(`un compte existant avec l'email "alice@lilas.fr"`, givenAlice);
      When(`un visiteur s'inscrit avec l'email "alice@lilas.fr"`, async () => {
        await attempt(() => register({ organizationName: 'Clinique du Lac', name: 'Autre Alice' }));
      });
      Then(`l'opération est refusée car l'email est déjà utilisé`, async () => {
        expect(error).toBeInstanceOf(ConflictError);
        expect(await queries.currentMember(member('Alice').actor)).toMatchObject({ name: 'Alice', organizationName: LILAS });
      });
    });

    RuleScenario(`Mot de passe trop court`, ({ When, Then }) => {
      When(`un visiteur s'inscrit avec un mot de passe de 14 caractères`, async () => {
        await attempt(() => register({ password: 'cheval agrafe!' }));
      });
      Then(`l'opération est refusée car le mot de passe fait moins de 15 caractères`, async () => {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as Error).message).toBe('Le mot de passe fait moins de 15 caractères');
        expect(await users.findByEmail('alice@lilas.fr')).toBeNull();
      });
    });
  });

  Rule(`Un échec de connexion ne révèle pas si l'email existe`, ({ RuleScenarioOutline }) => {
    RuleScenarioOutline(`Échec de connexion`, ({ When, Then }, variables) => {
      When(`quelqu'un se connecte avec l'email "<email>" et un mauvais mot de passe`, async () => {
        await givenAlice();
        hasher.calls.length = 0;
        await attempt(() => login(variables.email, 'un mauvais mot de passe'));
      });
      Then(`le message est "${INVALID_CREDENTIALS}"`, () => {
        expect(error).toBeInstanceOf(AuthenticationError);
        expect((error as Error).message).toBe(INVALID_CREDENTIALS);
        // Un email inconnu coûte aussi une vérification de mot de passe (temps de réponse comparable).
        expect(hasher.calls).toHaveLength(1);
      });
    });
  });

  Rule(`L'Administrateur ajoute des membres avec un mot de passe temporaire`, ({ RuleScenario }) => {
    RuleScenario(`Alice ajoute Bob comme Gestionnaire`, ({ Given, When, Then, And }) => {
      Given(`Alice, Admin de "${LILAS}"`, givenAlice);
      When(`Alice ajoute "bob@lilas.fr" nommé "Bob" avec le rôle Gestionnaire`, async () => {
        added = await addMember(member('Alice').actor, 'bob@lilas.fr', 'Bob', roleFromLabel('Gestionnaire'));
      });
      Then(`Bob est Gestionnaire de "${LILAS}"`, async () => {
        expect(await listedMembers()).toContainEqual({ name: 'Bob', role: Role.MANAGER });
        const bob = await login('bob@lilas.fr', added.temporaryPassword);
        expect(bob.organizationId).toBe(member('Alice').actor.organizationId);
      });
      And(`Alice reçoit une seule fois le mot de passe temporaire de Bob`, async () => {
        expect(added.temporaryPassword.length).toBeGreaterThanOrEqual(15);
        // Seule son empreinte est stockée, et aucune lecture ne le rend.
        const stored = (await users.findById(added.userId))?.snapshot();
        expect(JSON.stringify(stored)).not.toContain(added.temporaryPassword);
        const bob = (await queries.listMembers(member('Alice').actor)).find((m) => m.userId === added.userId);
        expect(Object.keys(bob ?? {}).sort()).toEqual(['email', 'name', 'role', 'userId']);
      });
    });

    RuleScenario(`Bob doit changer son mot de passe temporaire`, ({ Given, When, Then }) => {
      Given(`Bob a un mot de passe temporaire`, async () => {
        await givenAlice();
        await givenMember('Bob', Role.MANAGER);
      });
      When(`Bob se connecte`, async () => {
        loggedIn = await login('bob@lilas.fr', member('Bob').password);
      });
      Then(`il doit changer son mot de passe avant toute autre opération`, async () => {
        // Le guard HTTP (tranche 5) bloque toute autre route tant que `mustChangePassword` est vrai.
        expect(loggedIn.mustChangePassword).toBe(true);
        expect((await resolve('Bob')).mustChangePassword).toBe(true);

        await new ChangePassword(users, hasher, blocklist, clock).execute({
          userId: loggedIn.userId,
          currentPassword: member('Bob').password,
          newPassword: VALID_PASSWORD,
        });
        expect((await login('bob@lilas.fr', VALID_PASSWORD)).mustChangePassword).toBe(false);
      });
    });

    RuleScenario(`Un Gestionnaire ne peut pas ajouter de membre`, ({ When, Then }) => {
      When(`Bob ajoute "carla@lilas.fr" avec le rôle Utilisateur`, async () => {
        await givenAlice();
        await givenMember('Bob', Role.MANAGER);
        await attempt(() => addMember(member('Bob').actor, 'carla@lilas.fr', 'Carla', roleFromLabel('Utilisateur')));
      });
      Then(`l'opération est refusée car interdite`, async () => {
        expect(error).toBeInstanceOf(ForbiddenError);
        expect(await users.findByEmail('carla@lilas.fr')).toBeNull();
      });
    });
  });

  Rule(`Personne ne modifie son propre rôle ni ne se retire`, ({ RuleBackground, RuleScenario }) => {
    RuleBackground(({ Given }) => {
      Given(
        `"${LILAS}" avec Alice (Admin), Denis (Admin), Bob (Gestionnaire) et Carla (Utilisateur)`,
        async () => {
          await givenAlice();
          await givenMember('Denis', roleFromLabel('Admin'));
          await givenMember('Bob', roleFromLabel('Gestionnaire'));
          await givenMember('Carla', roleFromLabel('Utilisateur'));
        },
      );
    });

    const changeRole = (by: string, of: string, role: Role) =>
      new ChangeMemberRole(memberships).execute({ actor: member(by).actor, userId: member(of).actor.userId, role });
    const remove = (by: string, of: string) =>
      new RemoveMember(memberships, clock).execute({ actor: member(by).actor, userId: member(of).actor.userId });

    RuleScenario(`Alice rétrograde un autre admin`, ({ When, Then }) => {
      When(`Alice change le rôle de Denis en Gestionnaire`, () => changeRole('Alice', 'Denis', Role.MANAGER));
      Then(`Denis est Gestionnaire`, async () => {
        expect(await listedMembers()).toContainEqual({ name: 'Denis', role: Role.MANAGER });
        // Sa session en cours prend le nouveau rôle dès la requête suivante (D16).
        expect((await resolve('Denis')).actor.role).toBe(Role.MANAGER);
      });
    });

    RuleScenario(`Alice ne peut pas changer son propre rôle`, ({ When, Then }) => {
      When(`Alice change son propre rôle en Gestionnaire`, async () => {
        await attempt(() => changeRole('Alice', 'Alice', Role.MANAGER));
      });
      Then(`l'opération est refusée car on ne peut pas modifier son propre rôle`, async () => {
        expect(error).toBeInstanceOf(ForbiddenError);
        expect((error as Error).message).toBe('On ne peut pas modifier son propre rôle');
        expect(await listedMembers()).toContainEqual({ name: 'Alice', role: Role.ADMIN });
      });
    });

    RuleScenario(`Alice retire Carla`, ({ When, Then, And }) => {
      When(`Alice retire Carla`, () => remove('Alice', 'Carla'));
      Then(`Carla n'apparaît plus dans la liste des membres`, async () => {
        expect((await listedMembers()).map(({ name }) => name)).toEqual(['Alice', 'Denis', 'Bob']);
      });
      And(`Carla ne peut plus se connecter`, async () => {
        await expect(login('carla@lilas.fr', member('Carla').password)).rejects.toThrow(INVALID_CREDENTIALS);
        // Sa session en cours tombe aussi (ASVS 7.4.2).
        await expect(resolve('Carla')).rejects.toThrow(AuthenticationError);
      });
    });

    RuleScenario(`Alice ne peut pas se retirer`, ({ When, Then }) => {
      When(`Alice se retire de l'organisation`, async () => {
        await attempt(() => remove('Alice', 'Alice'));
      });
      Then(`l'opération est refusée car on ne peut pas se retirer soi-même`, async () => {
        expect(error).toBeInstanceOf(ForbiddenError);
        expect((error as Error).message).toBe('On ne peut pas se retirer soi-même');
      });
    });

    RuleScenario(`Seul un admin liste les membres`, ({ When, Then }) => {
      When(`Bob consulte la liste des membres`, async () => {
        await attempt(() => queries.listMembers(member('Bob').actor));
      });
      Then(`l'opération est refusée car interdite`, () => expect(error).toBeInstanceOf(ForbiddenError));
    });
  });
});
