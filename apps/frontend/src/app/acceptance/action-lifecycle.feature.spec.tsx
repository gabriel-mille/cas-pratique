import { describeFeature } from '@amiceli/vitest-cucumber';
import { screen, within } from '@testing-library/react';
import { STATUS_LABELS } from '@/entities/action';
import type { ActionStatus } from '@/shared/api';
import { paths } from '@/shared/routes';
import { changeStatusAs, seedAction, seedPlan, signIn, storedAction } from '@/testing/fake-api';
import { loadSpecFeature } from '@/testing/feature';
import { ROLES, seedLilas } from '@/testing/lilas';
import { renderApp } from '@/testing/render-app';
import { resetTestState } from '@/testing/server';

const feature = await loadSpecFeature('action-lifecycle.feature');

const STATUSES = Object.fromEntries(
  Object.entries(STATUS_LABELS).map(([status, label]) => [label, status as ActionStatus]),
);

/**
 * Côté interface, une transition interdite ou hors cycle n'est pas proposée : « refusée » se vérifie
 * par l'absence du bouton. Le refus par l'API elle-même est testé par les `.feature` du back.
 */
describeFeature(feature, ({ AfterEachScenario, Background, Rule }) => {
  let lilas: ReturnType<typeof seedLilas>;
  let app: ReturnType<typeof renderApp>;
  let actionId: string;

  const setStatus = (label: string) => {
    storedAction(actionId).status = STATUSES[label];
  };
  const openAs = async (name: string) => {
    signIn(lilas.member(name));
    app = renderApp(paths.action(actionId));
    await screen.findByRole('heading', { level: 1, name: 'Former au lavage des mains' });
  };
  const transitionButton = (label: string) => screen.queryByRole('button', { name: `Passer à ${label}` });
  const changeStatus = async (name: string, label: string) => {
    await openAs(name);
    const button = transitionButton(label);
    if (button) await app.user.click(button);
  };
  const expectStatus = async (label: string) => {
    expect(await screen.findByText(`État : ${label}`)).toBeInTheDocument();
  };
  const history = () => screen.getByRole('list', { name: 'Historique des changements d’état' });

  AfterEachScenario(resetTestState);

  Background(({ Given, And }) => {
    Given(`l'organisation "Clinique des Lilas"`, () => undefined);
    And(`les membres suivants :`, (_ctx, table: { nom: string; rôle: string }[]) => {
      lilas = seedLilas(Object.fromEntries(table.map((row) => [row.nom, ROLES[row.rôle]])));
    });
    And(`le plan "Audit hygiène 2026" contenant l'action "Former au lavage des mains"`, () => {
      actionId = seedAction(seedPlan(lilas.organizationId, 'Audit hygiène 2026'), 'Former au lavage des mains');
    });
  });

  Rule(`Le Gestionnaire et l'Administrateur démarrent et soumettent une action`, ({ RuleScenarioOutline }) => {
    RuleScenarioOutline(`Transition autorisée`, ({ Given, When, Then, And }, variables) => {
      Given(`l'action est "<depuis>"`, () => setStatus(variables['depuis']));
      When(`<membre> passe l'action à "<vers>"`, () => changeStatus(variables['membre'], variables['vers']));
      Then(`l'action est "<vers>"`, () => expectStatus(variables['vers']));
      And(`l'historique contient "<depuis>" → "<vers>" par <membre>`, () => {
        const entry = `${variables['depuis']} → ${variables['vers']} par ${variables['membre']}, le`;
        expect(within(history()).getByText(entry, { exact: false })).toBeInTheDocument();
      });
    });
  });

  Rule(`Seul l'Administrateur termine une action, et uniquement depuis À valider`, ({ RuleScenario }) => {
    RuleScenario(`Alice termine une action à valider`, ({ Given, When, Then }) => {
      Given(`l'action est "À valider"`, () => setStatus('À valider'));
      When(`Alice passe l'action à "Terminé"`, () => changeStatus('Alice', 'Terminé'));
      Then(`l'action est "Terminé"`, () => expectStatus('Terminé'));
    });

    RuleScenario(`Bob ne peut pas terminer une action`, ({ Given, When, Then, And }) => {
      Given(`l'action est "À valider"`, () => setStatus('À valider'));
      When(`Bob passe l'action à "Terminé"`, () => changeStatus('Bob', 'Terminé'));
      Then(`l'opération est refusée car interdite`, () => {
        expect(transitionButton('Terminé')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Refuser la validation' })).not.toBeInTheDocument();
      });
      And(`l'action est "À valider"`, () => expectStatus('À valider'));
    });
  });

  Rule(`Les transitions hors cycle sont refusées`, ({ RuleScenarioOutline }) => {
    RuleScenarioOutline(`Transition interdite`, ({ Given, When, Then, And }, variables) => {
      Given(`l'action est "<depuis>"`, () => setStatus(variables['depuis']));
      When(`Alice passe l'action à "<vers>"`, () => changeStatus('Alice', variables['vers']));
      Then(`l'opération est refusée car la transition est invalide`, () => {
        expect(transitionButton(variables['vers'])).not.toBeInTheDocument();
      });
      And(`l'action est "<depuis>"`, () => expectStatus(variables['depuis']));
    });
  });

  Rule(`Un Utilisateur ne change jamais l'état d'une action`, ({ RuleScenarioOutline }) => {
    RuleScenarioOutline(`Carla tente une transition`, ({ Given, When, Then }, variables) => {
      Given(`l'action est "<depuis>"`, () => setStatus(variables['depuis']));
      When(`Carla passe l'action à "<vers>"`, () => changeStatus('Carla', variables['vers']));
      Then(`l'opération est refusée car interdite`, () => {
        expect(screen.queryAllByRole('button', { name: /^Passer à / })).toHaveLength(0);
        expect(screen.getByText(`État : ${variables['depuis']}`)).toBeInTheDocument();
      });
    });
  });

  Rule(`Un refus de validation exige un motif et est tracé`, ({ RuleScenario }) => {
    const rejectValidation = async (name: string, reason: string | null) => {
      await openAs(name);
      const button = screen.queryByRole('button', { name: 'Refuser la validation' });
      if (!button) return;
      await app.user.click(button);
      if (reason) await app.user.type(screen.getByRole('textbox', { name: 'Motif du refus' }), reason);
      await app.user.click(screen.getByRole('button', { name: 'Confirmer le refus' }));
    };

    RuleScenario(`Alice refuse avec un motif`, ({ Given, When, Then, And }) => {
      Given(`l'action est "À valider"`, () => setStatus('À valider'));
      When(`Alice refuse la validation avec le motif "Preuve de formation manquante"`, () =>
        rejectValidation('Alice', 'Preuve de formation manquante'),
      );
      Then(`l'action est "En cours"`, () => expectStatus('En cours'));
      And(
        `l'historique contient "À valider" → "En cours" par Alice avec le motif "Preuve de formation manquante"`,
        () => {
          const entry = within(history()).getByText('À valider → En cours par Alice, le', { exact: false });
          expect(entry).toHaveTextContent('Motif : Preuve de formation manquante');
        },
      );
    });

    RuleScenario(`Alice refuse sans motif`, ({ Given, When, Then, And }) => {
      Given(`l'action est "À valider"`, () => setStatus('À valider'));
      When(`Alice refuse la validation sans motif`, () => rejectValidation('Alice', null));
      Then(`l'opération est refusée car le motif est obligatoire`, () => {
        const reason = screen.getByRole('textbox', { name: 'Motif du refus' });
        expect(reason).toBeInvalid();
        expect(reason).toHaveAccessibleDescription('Le motif est obligatoire');
      });
      And(`l'action est "À valider"`, () => {
        expect(storedAction(actionId).status).toBe('TO_VALIDATE');
      });
    });

    RuleScenario(`Bob ne peut pas refuser une validation`, ({ Given, When, Then }) => {
      Given(`l'action est "À valider"`, () => setStatus('À valider'));
      When(`Bob refuse la validation avec le motif "Incomplet"`, () => rejectValidation('Bob', 'Incomplet'));
      Then(`l'opération est refusée car interdite`, () => {
        expect(screen.queryByRole('button', { name: 'Refuser la validation' })).not.toBeInTheDocument();
      });
    });
  });

  Rule(`Une modification basée sur une version périmée est rejetée`, ({ RuleScenario }) => {
    RuleScenario(`Deux changements simultanés`, ({ Given, When, Then, And }) => {
      // Alice ouvre l'action en version 1 avant que Bob ne la modifie ailleurs.
      Given(`l'action est "À faire" en version 1`, async () => {
        expect(storedAction(actionId)).toMatchObject({ status: 'TODO', version: 1 });
        await openAs('Alice');
      });
      And(`Bob passe l'action à "En cours" depuis la version 1`, () => {
        changeStatusAs(lilas.member('Bob'), actionId, 'IN_PROGRESS');
      });
      When(`Alice passe l'action à "En cours" depuis la version 1`, async () => {
        await app.user.click(screen.getByRole('button', { name: 'Passer à En cours' }));
      });
      Then(`l'opération est refusée car la version est périmée`, async () => {
        expect(await screen.findByRole('alert')).toHaveTextContent('modifiées entre-temps par quelqu’un d’autre');
        // L'action est relue : Alice voit l'état réel et le changement de Bob.
        await expectStatus('En cours');
        expect(within(history()).getByText('À faire → En cours par Bob, le', { exact: false })).toBeInTheDocument();
        expect(storedAction(actionId).history).toHaveLength(1);
      });
    });
  });
});
