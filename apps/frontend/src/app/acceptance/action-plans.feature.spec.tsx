import { describeFeature } from '@amiceli/vitest-cucumber';
import { act, screen, within } from '@testing-library/react';
import { paths } from '@/shared/routes';
import {
  seedAction,
  seedMember,
  seedOrganization,
  seedPlan,
  signIn,
  storedAction,
} from '@/testing/fake-api';
import { loadSpecFeature } from '@/testing/feature';
import { seedLilas } from '@/testing/lilas';
import { renderApp } from '@/testing/render-app';
import { resetTestState } from '@/testing/server';

const feature = await loadSpecFeature('action-plans.feature');

const PLAN_TITLE = 'Audit hygiène 2026';
const ACTION_TITLE = 'Former au lavage des mains';
const ACTION_DESCRIPTION = 'Session de 30 minutes pour chaque service';

/**
 * Côté interface, « refusée car interdite » se traduit par l'absence du bouton : l'écran ne propose
 * que ce que le rôle permet. Le refus par l'API elle-même est testé par les `.feature` du back.
 */
describeFeature(feature, ({ AfterEachScenario, Background, Rule }) => {
  let lilas: ReturnType<typeof seedLilas>;
  let app: ReturnType<typeof renderApp>;
  let planId: string;
  let actionId: string;

  const openAs = async (name: string, url: string) => {
    signIn(lilas.member(name));
    app = renderApp(url);
    await screen.findByRole('heading', { level: 1 });
  };
  const fillTitledForm = async (title: string) => {
    const field = screen.getByRole('textbox', { name: 'Titre' });
    await app.user.clear(field);
    if (title) await app.user.type(field, title);
  };
  const givenPlanWithAction = () => {
    planId = seedPlan(lilas.organizationId, PLAN_TITLE);
    actionId = seedAction(planId, ACTION_TITLE, { description: ACTION_DESCRIPTION });
  };

  AfterEachScenario(resetTestState);

  Background(({ Given }) => {
    Given(`l'organisation "Clinique des Lilas" avec Alice (Admin), Bob (Gestionnaire) et Carla (Utilisateur)`, () => {
      lilas = seedLilas({ Alice: 'ADMIN', Bob: 'MANAGER', Carla: 'MEMBER' });
    });
  });

  Rule(`Seul l'Administrateur crée et modifie les plans et les actions`, ({ RuleScenario, RuleScenarioOutline }) => {
    RuleScenario(`Alice crée un plan vide puis y ajoute une action`, ({ When, Then }) => {
      When(`Alice crée le plan "${PLAN_TITLE}"`, async () => {
        await openAs('Alice', paths.actionPlans);
        await app.user.click(screen.getByRole('button', { name: 'Nouveau plan' }));
        await fillTitledForm(PLAN_TITLE);
        await app.user.click(screen.getByRole('button', { name: 'Créer le plan' }));
      });
      Then(`le plan "${PLAN_TITLE}" existe et ne contient aucune action`, async () => {
        expect(await screen.findByRole('heading', { level: 1, name: PLAN_TITLE })).toBeInTheDocument();
        expect(await screen.findByText('Aucune action dans ce plan.')).toBeInTheDocument();
      });
      When(`Alice ajoute l'action "${ACTION_TITLE}" au plan`, async () => {
        await app.user.click(screen.getByRole('button', { name: 'Ajouter une action' }));
        await fillTitledForm(ACTION_TITLE);
        await app.user.click(screen.getByRole('button', { name: 'Ajouter l’action' }));
      });
      Then(`l'action "${ACTION_TITLE}" est "À faire"`, async () => {
        const row = await screen.findByRole('row', { name: (name) => name.startsWith(ACTION_TITLE) });
        expect(within(row).getByText('À faire')).toBeInTheDocument();
      });
    });

    const OPERATIONS: Record<string, { url: () => string; button: string }> = {
      'créer un plan': { url: () => paths.actionPlans, button: 'Nouveau plan' },
      'modifier un plan': { url: () => paths.actionPlan(planId), button: 'Modifier le plan' },
      'ajouter une action': { url: () => paths.actionPlan(planId), button: 'Ajouter une action' },
      'modifier une action': { url: () => paths.action(actionId), button: 'Modifier l’action' },
    };
    RuleScenarioOutline(`Un non-administrateur ne crée ni ne modifie rien`, ({ When, Then }, variables) => {
      const operation = OPERATIONS[variables['opération']];
      When(`<membre> tente de <opération>`, async () => {
        givenPlanWithAction();
        await openAs(variables['membre'], operation.url());
      });
      Then(`l'opération est refusée car interdite`, () => {
        expect(screen.queryByRole('button', { name: operation.button })).not.toBeInTheDocument();
      });
    });

    RuleScenario(`Modifier une action ne change pas son état`, ({ Given, When, Then }) => {
      Given(`l'action "${ACTION_TITLE}" est "En cours"`, () => {
        planId = seedPlan(lilas.organizationId, PLAN_TITLE);
        actionId = seedAction(planId, ACTION_TITLE, { status: 'IN_PROGRESS' });
      });
      When(`Alice renomme l'action en "Former tout le personnel au lavage des mains"`, async () => {
        await openAs('Alice', paths.action(actionId));
        await app.user.click(screen.getByRole('button', { name: 'Modifier l’action' }));
        await fillTitledForm('Former tout le personnel au lavage des mains');
        await app.user.click(screen.getByRole('button', { name: 'Enregistrer' }));
      });
      Then(`l'action est "En cours"`, async () => {
        expect(
          await screen.findByRole('heading', { level: 1, name: 'Former tout le personnel au lavage des mains' }),
        ).toBeInTheDocument();
        expect(screen.getByText('État : En cours')).toBeInTheDocument();
      });
    });

    RuleScenario(`Alice modifie un plan`, ({ Given, When, Then }) => {
      Given(`le plan "${PLAN_TITLE}"`, () => {
        planId = seedPlan(lilas.organizationId, PLAN_TITLE);
      });
      When(`Alice renomme le plan en "Audit hygiène 2026 - suivi"`, async () => {
        await openAs('Alice', paths.actionPlan(planId));
        await app.user.click(screen.getByRole('button', { name: 'Modifier le plan' }));
        await fillTitledForm('Audit hygiène 2026 - suivi');
        await app.user.click(screen.getByRole('button', { name: 'Enregistrer' }));
      });
      Then(`le plan "Audit hygiène 2026 - suivi" existe`, async () => {
        expect(
          await screen.findByRole('heading', { level: 1, name: 'Audit hygiène 2026 - suivi' }),
        ).toBeInTheDocument();
      });
    });
  });

  Rule(`Le titre est obligatoire, la description facultative`, ({ RuleScenario }) => {
    RuleScenario(`Plan sans titre`, ({ When, Then }) => {
      When(`Alice crée un plan avec le titre ""`, async () => {
        await openAs('Alice', paths.actionPlans);
        await app.user.click(screen.getByRole('button', { name: 'Nouveau plan' }));
        await app.user.click(screen.getByRole('button', { name: 'Créer le plan' }));
      });
      Then(`l'opération est refusée car le titre est obligatoire`, () => {
        const title = screen.getByRole('textbox', { name: 'Titre' });
        expect(title).toBeInvalid();
        expect(title).toHaveAccessibleDescription('Le titre est obligatoire');
        expect(screen.getByText('Aucun plan d’actions pour l’instant.')).toBeInTheDocument();
      });
    });

    RuleScenario(`Action sans description`, ({ Given, When, Then }) => {
      Given(`le plan "${PLAN_TITLE}"`, () => {
        planId = seedPlan(lilas.organizationId, PLAN_TITLE);
      });
      When(`Alice ajoute l'action "Afficher les consignes" sans description`, async () => {
        await openAs('Alice', paths.actionPlan(planId));
        await app.user.click(screen.getByRole('button', { name: 'Ajouter une action' }));
        await fillTitledForm('Afficher les consignes');
        await app.user.click(screen.getByRole('button', { name: 'Ajouter l’action' }));
      });
      Then(`l'action "Afficher les consignes" existe`, async () => {
        await app.user.click(await screen.findByRole('link', { name: 'Afficher les consignes' }));
        expect(await screen.findByRole('heading', { level: 1, name: 'Afficher les consignes' })).toBeInTheDocument();
        expect(screen.getByText('État : À faire')).toBeInTheDocument();
      });
    });
  });

  Rule(`La suppression d'une action est logique et réservée à l'Administrateur`, ({ RuleScenario }) => {
    RuleScenario(`Alice supprime une action`, ({ Given, When, Then, And }) => {
      Given(`l'action "${ACTION_TITLE}" dans le plan "${PLAN_TITLE}"`, () => givenPlanWithAction());
      When(`Alice supprime l'action`, async () => {
        await openAs('Alice', paths.action(actionId));
        await app.user.click(screen.getByRole('button', { name: 'Supprimer l’action' }));
        const dialog = screen.getByRole('dialog', { name: 'Supprimer l’action ?' });
        await app.user.click(within(dialog).getByRole('button', { name: 'Supprimer' }));
      });
      Then(`l'action n'apparaît plus dans le plan ni en détail`, async () => {
        expect(await screen.findByText('Aucune action dans ce plan.')).toBeInTheDocument();
        await act(() => app.router.navigate(paths.action(actionId)));
        expect(await screen.findByRole('heading', { level: 1, name: 'Action introuvable' })).toBeInTheDocument();
      });
      // L'écran ne montre pas la trace : on la lit dans la fausse API, comme le back la conserve (D7).
      And(`la suppression est enregistrée avec son auteur et sa date`, () => {
        expect(storedAction(actionId).deleted).toEqual({ by: lilas.member('Alice'), at: expect.any(String) });
      });
    });

    RuleScenario(`Bob ne peut pas supprimer`, ({ When, Then }) => {
      When(`Bob supprime l'action "${ACTION_TITLE}"`, async () => {
        givenPlanWithAction();
        await openAs('Bob', paths.action(actionId));
      });
      Then(`l'opération est refusée car interdite`, () => {
        expect(screen.queryByRole('button', { name: 'Supprimer l’action' })).not.toBeInTheDocument();
      });
    });
  });

  Rule(`Tout membre consulte les plans et les actions de son organisation uniquement`, ({ RuleScenario }) => {
    RuleScenario(`Carla consulte`, ({ Given, When, Then }) => {
      Given(`le plan "${PLAN_TITLE}" contenant l'action "${ACTION_TITLE}"`, () => givenPlanWithAction());
      When(`Carla consulte la liste des plans, puis les actions du plan, puis le détail de l'action`, async () => {
        await openAs('Carla', paths.actionPlans);
        await app.user.click(await screen.findByRole('link', { name: PLAN_TITLE }));
        await app.user.click(await screen.findByRole('link', { name: ACTION_TITLE }));
      });
      Then(`elle voit le titre, la description et l'état de l'action`, async () => {
        expect(await screen.findByRole('heading', { level: 1, name: ACTION_TITLE })).toBeInTheDocument();
        expect(screen.getByText(ACTION_DESCRIPTION)).toBeInTheDocument();
        expect(screen.getByText('État : À faire')).toBeInTheDocument();
      });
    });

    RuleScenario(`Action d'une autre organisation`, ({ Given, When, Then }) => {
      Given(`une action de l'organisation "Hôpital du Lac"`, () => {
        const lac = seedOrganization('Hôpital du Lac');
        seedMember(lac, 'Paul', 'ADMIN');
        actionId = seedAction(seedPlan(lac, 'Plan du Lac'), 'Action du Lac');
      });
      When(`Carla consulte cette action`, () => openAs('Carla', paths.action(actionId)));
      Then(`l'action est introuvable`, () => {
        expect(screen.getByRole('heading', { level: 1, name: 'Action introuvable' })).toBeInTheDocument();
        expect(screen.queryByText('Action du Lac')).not.toBeInTheDocument();
      });
    });
  });
});
