import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { fileURLToPath } from 'node:url';
import { Actor } from '../../../shared/domain/actor';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../shared/domain/errors';
import { Role } from '../../../shared/domain/role';
import { FixedClock } from '../../../shared/testing/fixed-clock';
import { Action, ActionProps } from '../domain/action';
import { ActionPlan } from '../domain/action-plan';
import { InMemoryActionPlanRepository } from '../infrastructure/in-memory-action-plan.repository';
import { InMemoryActionRepository } from '../infrastructure/in-memory-action.repository';
import { statusFromLabel } from '../testing/status-labels';
import { ActionPlanQueries } from './action-plan-queries';
import { AddAction } from './add-action';
import { CreateActionPlan } from './create-action-plan';
import { DeleteAction } from './delete-action';
import { UpdateAction } from './update-action';
import { UpdateActionPlan } from './update-action-plan';

const feature = await loadFeature(
  fileURLToPath(new URL('../../../../../../docs/specs/features/action-plans.feature', import.meta.url)),
  { language: 'fr' },
);

const PLAN_TITLE = 'Audit hygiène 2026';
const ACTION_TITLE = 'Former au lavage des mains';
const ACTION_DESCRIPTION = 'Session de 30 minutes pour chaque service';

describeFeature(feature, ({ Background, Rule }) => {
  let organizationId: string;
  let members: Map<string, Actor>;
  let plans: InMemoryActionPlanRepository;
  let actions: InMemoryActionRepository;
  let clock: FixedClock;
  let queries: ActionPlanQueries;
  let planId: string;
  let actionId: string;
  let error: unknown;
  let seen: { plans: string[]; actions: string[]; detail: unknown };

  const member = (name: string): Actor => {
    const actor = members.get(name);
    if (!actor) throw new Error(`Membre inconnu : ${name}`);
    return actor;
  };
  const alice = () => member('Alice');

  const attempt = async (run: () => Promise<unknown>) => {
    try {
      await run();
    } catch (e) {
      error = e;
    }
  };

  // Préparation par les vrais cas d'usage, au nom d'Alice (Admin).
  const givenPlan = async (title = PLAN_TITLE) => {
    planId = await new CreateActionPlan(plans, clock).execute({ actor: alice(), title, description: null });
  };
  const givenAction = async (title = ACTION_TITLE, description: string | null = ACTION_DESCRIPTION) => {
    actionId = await new AddAction(plans, actions, clock).execute({ actor: alice(), planId, title, description });
  };
  const version = async (id: string) => (await queries.getAction(alice(), id)).version;
  const planVersion = async () => (await queries.listPlans(alice())).find((plan) => plan.id === planId)?.version ?? 0;

  const OPERATIONS: Record<string, (actor: Actor) => Promise<unknown>> = {
    'créer un plan': async (actor) =>
      new CreateActionPlan(plans, clock).execute({ actor, title: PLAN_TITLE, description: null }),
    'modifier un plan': async (actor) =>
      new UpdateActionPlan(plans).execute({
        actor,
        planId,
        title: 'Audit hygiène 2027',
        description: null,
        expectedVersion: await planVersion(),
      }),
    'ajouter une action': async (actor) =>
      new AddAction(plans, actions, clock).execute({ actor, planId, title: ACTION_TITLE, description: null }),
    'modifier une action': async (actor) =>
      new UpdateAction(actions).execute({
        actor,
        actionId,
        title: 'Autre titre',
        description: null,
        expectedVersion: await version(actionId),
      }),
  };

  // Le Contexte est rejoué avant chaque scénario : l'état est remis à zéro ici (cf. action-lifecycle).
  Background(({ Given }) => {
    Given(`l'organisation "Clinique des Lilas" avec Alice (Admin), Bob (Gestionnaire) et Carla (Utilisateur)`, () => {
      organizationId = 'org-lilas';
      const roles: [string, Role][] = [
        ['Alice', Role.ADMIN],
        ['Bob', Role.MANAGER],
        ['Carla', Role.MEMBER],
      ];
      members = new Map(roles.map(([name, role]) => [name, { userId: `user-${name}`, organizationId, role }]));
      plans = new InMemoryActionPlanRepository();
      actions = new InMemoryActionRepository();
      clock = new FixedClock(new Date('2026-10-07T10:00:00Z'));
      queries = new ActionPlanQueries(plans, actions, { namesOf: async () => new Map() });
      error = undefined;
    });
  });

  Rule(`Seul l'Administrateur crée et modifie les plans et les actions`, ({ RuleScenario, RuleScenarioOutline }) => {
    RuleScenario(`Alice crée un plan vide puis y ajoute une action`, ({ When, Then }) => {
      When(`Alice crée le plan "${PLAN_TITLE}"`, () => givenPlan());
      Then(`le plan "${PLAN_TITLE}" existe et ne contient aucune action`, async () => {
        expect((await queries.listPlans(alice())).map((plan) => plan.title)).toEqual([PLAN_TITLE]);
        expect(await queries.listPlanActions(alice(), planId)).toEqual([]);
      });
      When(`Alice ajoute l'action "${ACTION_TITLE}" au plan`, () => givenAction());
      Then(`l'action "${ACTION_TITLE}" est "À faire"`, async () => {
        expect(await queries.listPlanActions(alice(), planId)).toMatchObject([
          { title: ACTION_TITLE, status: statusFromLabel('À faire') },
        ]);
      });
    });

    RuleScenarioOutline(`Un non-administrateur ne crée ni ne modifie rien`, ({ When, Then }, variables) => {
      When(`<membre> tente de <opération>`, async () => {
        await givenPlan();
        await givenAction();
        await attempt(() => OPERATIONS[variables.opération](member(variables.membre)));
      });
      Then(`l'opération est refusée car interdite`, () => expect(error).toBeInstanceOf(ForbiddenError));
    });

    RuleScenario(`Modifier une action ne change pas son état`, ({ Given, When, Then }) => {
      Given(`l'action "${ACTION_TITLE}" est "En cours"`, async () => {
        await givenPlan();
        await givenAction();
        const snapshot = actions.stored(organizationId, actionId) as ActionProps;
        actions.seed(Action.restore({ ...snapshot, status: statusFromLabel('En cours') }));
      });
      When(`Alice renomme l'action en "Former tout le personnel au lavage des mains"`, async () =>
        new UpdateAction(actions).execute({
          actor: alice(),
          actionId,
          title: 'Former tout le personnel au lavage des mains',
          description: ACTION_DESCRIPTION,
          expectedVersion: await version(actionId),
        }),
      );
      Then(`l'action est "En cours"`, async () => {
        expect(await queries.getAction(alice(), actionId)).toMatchObject({
          title: 'Former tout le personnel au lavage des mains',
          status: statusFromLabel('En cours'),
        });
      });
    });

    RuleScenario(`Alice modifie un plan`, ({ Given, When, Then }) => {
      Given(`le plan "${PLAN_TITLE}"`, () => givenPlan());
      When(`Alice renomme le plan en "Audit hygiène 2026 - suivi"`, async () =>
        new UpdateActionPlan(plans).execute({
          actor: alice(),
          planId,
          title: 'Audit hygiène 2026 - suivi',
          description: null,
          expectedVersion: await planVersion(),
        }),
      );
      Then(`le plan "Audit hygiène 2026 - suivi" existe`, async () => {
        expect(await queries.listPlans(alice())).toMatchObject([{ title: 'Audit hygiène 2026 - suivi', version: 2 }]);
      });
    });
  });

  Rule(`Le titre est obligatoire, la description facultative`, ({ RuleScenario }) => {
    RuleScenario(`Plan sans titre`, ({ When, Then }) => {
      When(`Alice crée un plan avec le titre ""`, () => attempt(() => givenPlan('')));
      Then(`l'opération est refusée car le titre est obligatoire`, async () => {
        expect(error).toBeInstanceOf(ValidationError);
        expect(await queries.listPlans(alice())).toEqual([]);
      });
    });

    RuleScenario(`Action sans description`, ({ Given, When, Then }) => {
      Given(`le plan "${PLAN_TITLE}"`, () => givenPlan());
      When(`Alice ajoute l'action "Afficher les consignes" sans description`, () =>
        givenAction('Afficher les consignes', null),
      );
      Then(`l'action "Afficher les consignes" existe`, async () => {
        expect(await queries.getAction(alice(), actionId)).toMatchObject({
          title: 'Afficher les consignes',
          description: null,
        });
      });
    });
  });

  Rule(`La suppression d'une action est logique et réservée à l'Administrateur`, ({ RuleScenario }) => {
    RuleScenario(`Alice supprime une action`, ({ Given, When, Then, And }) => {
      Given(`l'action "${ACTION_TITLE}" dans le plan "${PLAN_TITLE}"`, async () => {
        await givenPlan();
        await givenAction();
      });
      When(`Alice supprime l'action`, async () =>
        new DeleteAction(actions, clock).execute({ actor: alice(), actionId, expectedVersion: await version(actionId) }),
      );
      Then(`l'action n'apparaît plus dans le plan ni en détail`, async () => {
        expect(await queries.listPlanActions(alice(), planId)).toEqual([]);
        await expect(queries.getAction(alice(), actionId)).rejects.toThrow(NotFoundError);
      });
      And(`la suppression est enregistrée avec son auteur et sa date`, () => {
        expect(actions.stored(organizationId, actionId)).toMatchObject({
          title: ACTION_TITLE,
          deletedBy: alice().userId,
          deletedAt: clock.now(),
        });
      });
    });

    RuleScenario(`Bob ne peut pas supprimer`, ({ When, Then }) => {
      When(`Bob supprime l'action "${ACTION_TITLE}"`, async () => {
        await givenPlan();
        await givenAction();
        const expectedVersion = await version(actionId);
        await attempt(() => new DeleteAction(actions, clock).execute({ actor: member('Bob'), actionId, expectedVersion }));
      });
      Then(`l'opération est refusée car interdite`, async () => {
        expect(error).toBeInstanceOf(ForbiddenError);
        expect(actions.stored(organizationId, actionId)?.deletedAt).toBeNull();
      });
    });
  });

  Rule(`Tout membre consulte les plans et les actions de son organisation uniquement`, ({ RuleScenario }) => {
    RuleScenario(`Carla consulte`, ({ Given, When, Then }) => {
      Given(`le plan "${PLAN_TITLE}" contenant l'action "${ACTION_TITLE}"`, async () => {
        await givenPlan();
        await givenAction();
      });
      When(`Carla consulte la liste des plans, puis les actions du plan, puis le détail de l'action`, async () => {
        const carla = member('Carla');
        const [plan] = await queries.listPlans(carla);
        const [action] = await queries.listPlanActions(carla, plan.id);
        seen = {
          plans: [plan.title],
          actions: [action.title],
          detail: await queries.getAction(carla, action.id),
        };
      });
      Then(`elle voit le titre, la description et l'état de l'action`, () => {
        expect(seen).toEqual({
          plans: [PLAN_TITLE],
          actions: [ACTION_TITLE],
          detail: expect.objectContaining({
            title: ACTION_TITLE,
            description: ACTION_DESCRIPTION,
            status: statusFromLabel('À faire'),
          }),
        });
      });
    });

    RuleScenario(`Action d'une autre organisation`, ({ Given, When, Then }) => {
      Given(`une action de l'organisation "Hôpital du Lac"`, () => {
        const createdAt = clock.now();
        plans.seed(ActionPlan.create({ id: 'plan-lac', organizationId: 'org-lac', title: 'Plan', description: null, createdAt }));
        const action = Action.create({
          id: 'action-lac',
          organizationId: 'org-lac',
          planId: 'plan-lac',
          title: 'Action du Lac',
          description: null,
          createdAt,
        });
        actions.seed(action);
        actionId = action.id;
        planId = 'plan-lac';
      });
      When(`Carla consulte cette action`, () => attempt(() => queries.getAction(member('Carla'), actionId)));
      Then(`l'action est introuvable`, async () => {
        expect(error).toBeInstanceOf(NotFoundError);
        await expect(queries.listPlanActions(member('Carla'), planId)).rejects.toThrow(NotFoundError);
      });
    });
  });
});
