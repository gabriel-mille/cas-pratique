import { describeFeature } from '@amiceli/vitest-cucumber';
import { act, screen, waitFor, within } from '@testing-library/react';
import { paths } from '@/shared/routes';
import {
  DEFAULT_PASSWORD,
  memberByEmail,
  organizationNamed,
  seedMember,
  signIn,
  storedMember,
} from '@/testing/fake-api';
import { loadSpecFeature } from '@/testing/feature';
import { seedLilas } from '@/testing/lilas';
import { renderApp } from '@/testing/render-app';
import { resetTestState } from '@/testing/server';

const feature = await loadSpecFeature('accounts-and-members.feature');

const TEMPORARY_PASSWORD = 'mot de passe temporaire de Bob';

describeFeature(feature, ({ AfterEachScenario, Rule }) => {
  let lilas: ReturnType<typeof seedLilas>;
  let app: ReturnType<typeof renderApp>;

  /** Champ mot de passe : sans rôle ARIA, retrouvé par son libellé (l'astérisque est masqué). */
  const passwordField = (label: string) => screen.getByLabelText(new RegExp(`^${label}( \\*)?$`));
  const textbox = (name: string) => screen.getByRole('textbox', { name });

  const register = async ({ organization = 'Clinique des Lilas', name = 'Alice', email = 'alice@lilas.fr' }, password = DEFAULT_PASSWORD) => {
    app = renderApp(paths.register);
    await app.user.type(textbox('Nom de l’organisation'), organization);
    await app.user.type(textbox('Votre nom'), name);
    await app.user.type(textbox('Email'), email);
    await app.user.type(passwordField('Mot de passe'), password);
    await app.user.click(screen.getByRole('button', { name: 'Créer l’organisation' }));
  };
  const logIn = async (email: string, password: string) => {
    app = renderApp(paths.login);
    await app.user.type(textbox('Email'), email);
    await app.user.type(passwordField('Mot de passe'), password);
    await app.user.click(screen.getByRole('button', { name: 'Se connecter' }));
  };
  const openMembersAs = async (name: string) => {
    signIn(lilas.member(name));
    app = renderApp(paths.members);
    await screen.findByRole('heading', { level: 1, name: 'Membres' });
  };
  const memberTable = () => screen.findByRole('table', { name: 'Membres de l’organisation' });

  AfterEachScenario(resetTestState);

  Rule(`Créer un compte crée une organisation et son premier administrateur`, ({ RuleScenario }) => {
    RuleScenario(`Alice crée la Clinique des Lilas`, ({ When, Then, And }) => {
      When(
        `un visiteur s'inscrit avec l'organisation "Clinique des Lilas", le nom "Alice", l'email "alice@lilas.fr" et un mot de passe valide`,
        () => register({}),
      );
      Then(`l'organisation "Clinique des Lilas" existe`, async () => {
        expect(await screen.findByText('Clinique des Lilas')).toBeInTheDocument();
        expect(organizationNamed('Clinique des Lilas')).toBeDefined();
      });
      And(`Alice en est Admin`, () => {
        expect(screen.getByText('Alice · Administrateur')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Membres' })).toBeInTheDocument();
      });
    });

    RuleScenario(`Email déjà utilisé`, ({ Given, When, Then }) => {
      Given(`un compte existant avec l'email "alice@lilas.fr"`, () => {
        seedLilas({ Alice: 'ADMIN' });
      });
      When(`un visiteur s'inscrit avec l'email "alice@lilas.fr"`, () =>
        register({ organization: 'Cabinet Martin', name: 'Alice Martin' }),
      );
      Then(`l'opération est refusée car l'email est déjà utilisé`, async () => {
        expect(await screen.findByRole('alert')).toHaveTextContent('Cet email est déjà utilisé');
        expect(organizationNamed('Cabinet Martin')).toBeUndefined();
      });
    });

    RuleScenario(`Mot de passe trop court`, ({ When, Then }) => {
      When(`un visiteur s'inscrit avec un mot de passe de 14 caractères`, () => register({}, 'a'.repeat(14)));
      Then(`l'opération est refusée car le mot de passe fait moins de 15 caractères`, () => {
        const password = passwordField('Mot de passe');
        expect(password).toBeInvalid();
        expect(password).toHaveAccessibleDescription(
          expect.stringContaining('Le mot de passe fait moins de 15 caractères'),
        );
        expect(organizationNamed('Clinique des Lilas')).toBeUndefined();
      });
    });
  });

  Rule(`Un échec de connexion ne révèle pas si l'email existe`, ({ RuleScenarioOutline }) => {
    RuleScenarioOutline(`Échec de connexion`, ({ When, Then }, variables) => {
      When(`quelqu'un se connecte avec l'email "<email>" et un mauvais mot de passe`, async () => {
        seedLilas({ Alice: 'ADMIN' });
        await logIn(variables['email'], 'un mauvais mot de passe');
      });
      Then(`le message est "Email ou mot de passe incorrect"`, async () => {
        expect(await screen.findByRole('alert')).toHaveTextContent(/^Email ou mot de passe incorrect$/);
      });
    });
  });

  Rule(`L'Administrateur ajoute des membres avec un mot de passe temporaire`, ({ RuleScenario }) => {
    RuleScenario(`Alice ajoute Bob comme Gestionnaire`, ({ Given, When, Then, And }) => {
      Given(`Alice, Admin de "Clinique des Lilas"`, () => {
        lilas = seedLilas({ Alice: 'ADMIN' });
      });
      When(`Alice ajoute "bob@lilas.fr" nommé "Bob" avec le rôle Gestionnaire`, async () => {
        await openMembersAs('Alice');
        await app.user.type(textbox('Email'), 'bob@lilas.fr');
        await app.user.type(textbox('Nom'), 'Bob');
        await app.user.selectOptions(screen.getByRole('combobox', { name: 'Rôle' }), 'Gestionnaire');
        await app.user.click(screen.getByRole('button', { name: 'Ajouter le membre' }));
      });
      Then(`Bob est Gestionnaire de "Clinique des Lilas"`, async () => {
        const table = await memberTable();
        expect(await within(table).findByRole('combobox', { name: 'Rôle de Bob' })).toHaveValue('MANAGER');
      });
      And(`Alice reçoit une seule fois le mot de passe temporaire de Bob`, async () => {
        const shown = screen.getByText((_, element) => element?.tagName === 'CODE');
        expect(shown).toHaveTextContent(storedMember(memberByEmail('bob@lilas.fr')?.id ?? '')?.password ?? '');
        await app.user.click(screen.getByRole('button', { name: 'J’ai transmis le mot de passe' }));
        expect(screen.queryByText(shown.textContent ?? '')).not.toBeInTheDocument();
      });
    });

    RuleScenario(`Bob doit changer son mot de passe temporaire`, ({ Given, When, Then }) => {
      Given(`Bob a un mot de passe temporaire`, () => {
        lilas = seedLilas({ Alice: 'ADMIN' });
        seedMember(lilas.organizationId, 'Bob', 'MANAGER', {
          email: 'bob@lilas.fr',
          password: TEMPORARY_PASSWORD,
          mustChangePassword: true,
        });
      });
      When(`Bob se connecte`, () => logIn('bob@lilas.fr', TEMPORARY_PASSWORD));
      Then(`il doit changer son mot de passe avant toute autre opération`, async () => {
        expect(
          await screen.findByRole('heading', { level: 1, name: 'Changer votre mot de passe' }),
        ).toBeInTheDocument();
        expect(screen.queryByRole('navigation', { name: 'Navigation principale' })).not.toBeInTheDocument();
        await act(() => app.router.navigate(paths.actionPlans));
        expect(
          await screen.findByRole('heading', { level: 1, name: 'Changer votre mot de passe' }),
        ).toBeInTheDocument();
        expect(app.router.state.location.pathname).toBe(paths.changePassword);
      });
    });

    RuleScenario(`Un Gestionnaire ne peut pas ajouter de membre`, ({ When, Then }) => {
      When(`Bob ajoute "carla@lilas.fr" avec le rôle Utilisateur`, async () => {
        lilas = seedLilas({ Alice: 'ADMIN', Bob: 'MANAGER' });
        await openMembersAs('Bob');
      });
      Then(`l'opération est refusée car interdite`, () => {
        expect(screen.getByRole('alert')).toHaveTextContent('Cette page est réservée aux administrateurs.');
        expect(screen.queryByRole('button', { name: 'Ajouter le membre' })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Membres' })).not.toBeInTheDocument();
      });
    });
  });

  Rule(`Personne ne modifie son propre rôle ni ne se retire`, ({ RuleBackground, RuleScenario }) => {
    RuleBackground(({ Given }) => {
      Given(
        `"Clinique des Lilas" avec Alice (Admin), Denis (Admin), Bob (Gestionnaire) et Carla (Utilisateur)`,
        () => {
          lilas = seedLilas({ Alice: 'ADMIN', Denis: 'ADMIN', Bob: 'MANAGER', Carla: 'MEMBER' });
        },
      );
    });

    RuleScenario(`Alice rétrograde un autre admin`, ({ When, Then }) => {
      When(`Alice change le rôle de Denis en Gestionnaire`, async () => {
        await openMembersAs('Alice');
        const table = await memberTable();
        await app.user.selectOptions(within(table).getByRole('combobox', { name: 'Rôle de Denis' }), 'Gestionnaire');
        await app.user.click(within(table).getByRole('button', { name: 'Enregistrer le rôle de Denis' }));
      });
      Then(`Denis est Gestionnaire`, async () => {
        expect(await screen.findByText('Rôle de Denis : Gestionnaire.')).toBeInTheDocument();
        expect(storedMember(lilas.member('Denis'))?.role).toBe('MANAGER');
      });
    });

    RuleScenario(`Alice ne peut pas changer son propre rôle`, ({ When, Then }) => {
      When(`Alice change son propre rôle en Gestionnaire`, () => openMembersAs('Alice'));
      Then(`l'opération est refusée car on ne peut pas modifier son propre rôle`, async () => {
        const table = await memberTable();
        const ownRow = within(table).getByRole('row', { name: /^Alice \(vous\)/ });
        expect(within(ownRow).queryByRole('combobox')).not.toBeInTheDocument();
        expect(within(table).queryByRole('combobox', { name: 'Rôle de Alice' })).not.toBeInTheDocument();
      });
    });

    RuleScenario(`Alice retire Carla`, ({ When, Then, And }) => {
      When(`Alice retire Carla`, async () => {
        await openMembersAs('Alice');
        await app.user.click(within(await memberTable()).getByRole('button', { name: 'Retirer Carla' }));
        const dialog = screen.getByRole('dialog', { name: 'Retirer Carla ?' });
        await app.user.click(within(dialog).getByRole('button', { name: 'Confirmer le retrait' }));
      });
      Then(`Carla n'apparaît plus dans la liste des membres`, async () => {
        const table = await memberTable();
        await waitFor(() => expect(within(table).queryByRole('rowheader', { name: 'Carla' })).not.toBeInTheDocument());
        expect(within(table).getByRole('rowheader', { name: 'Bob' })).toBeInTheDocument();
      });
      And(`Carla ne peut plus se connecter`, async () => {
        app.unmount();
        await logIn('carla@lilas.fr', DEFAULT_PASSWORD);
        expect(await screen.findByRole('alert')).toHaveTextContent('Email ou mot de passe incorrect');
      });
    });

    RuleScenario(`Alice ne peut pas se retirer`, ({ When, Then }) => {
      When(`Alice se retire de l'organisation`, () => openMembersAs('Alice'));
      Then(`l'opération est refusée car on ne peut pas se retirer soi-même`, async () => {
        const table = await memberTable();
        expect(within(table).queryByRole('button', { name: 'Retirer Alice' })).not.toBeInTheDocument();
        expect(within(table).getByRole('button', { name: 'Retirer Denis' })).toBeInTheDocument();
      });
    });

    RuleScenario(`Seul un admin liste les membres`, ({ When, Then }) => {
      When(`Bob consulte la liste des membres`, () => openMembersAs('Bob'));
      Then(`l'opération est refusée car interdite`, () => {
        expect(screen.getByRole('alert')).toHaveTextContent('Cette page est réservée aux administrateurs.');
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
      });
    });
  });
});
