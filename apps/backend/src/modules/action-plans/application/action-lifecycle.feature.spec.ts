import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { fileURLToPath } from 'node:url';
import { Actor } from '../../../shared/domain/actor';
import {
  ForbiddenError,
  InvalidTransitionError,
  StaleVersionError,
  ValidationError,
} from '../../../shared/domain/errors';
import { Role } from '../../../shared/domain/role';
import { FixedClock } from '../../../shared/testing/fixed-clock';
import { Action } from '../domain/action';
import { InMemoryActionRepository } from '../infrastructure/in-memory-action.repository';
import { statusFromLabel } from '../testing/status-labels';
import { ChangeActionStatus } from './change-action-status';
import { RejectValidation } from './reject-validation';

const feature = await loadFeature(
  fileURLToPath(new URL('../../../../../../docs/specs/features/action-lifecycle.feature', import.meta.url)),
  { language: 'fr' },
);

const ROLES: Record<string, Role> = { Admin: Role.ADMIN, Gestionnaire: Role.MANAGER, Utilisateur: Role.MEMBER };
const ACTION_ID = 'action-lavage-mains';

describeFeature(feature, ({ Background, Rule }) => {
  let organizationId: string;
  let members: Map<string, Actor>;
  let actions: InMemoryActionRepository;
  let clock: FixedClock;
  let error: unknown;

  const member = (name: string): Actor => {
    const actor = members.get(name);
    if (!actor) throw new Error(`Membre inconnu : ${name}`);
    return actor;
  };

  const current = async (): Promise<Action> => {
    const action = await actions.findById(organizationId, ACTION_ID);
    if (!action) throw new Error('Action absente');
    return action;
  };

  const setStatus = async (label: string, version?: number) => {
    const snapshot = (await current()).snapshot();
    actions.seed(Action.restore({ ...snapshot, status: statusFromLabel(label), version: version ?? snapshot.version }));
  };

  const attempt = async (run: () => Promise<void>) => {
    try {
      await run();
    } catch (e) {
      error = e;
    }
  };

  const changeStatus = (name: string, label: string, expectedVersion?: number) =>
    attempt(async () =>
      new ChangeActionStatus(actions, clock).execute({
        actor: member(name),
        actionId: ACTION_ID,
        to: statusFromLabel(label),
        expectedVersion: expectedVersion ?? (await current()).version,
      }),
    );

  const rejectValidation = (name: string, reason: string | null) =>
    attempt(async () =>
      new RejectValidation(actions, clock).execute({
        actor: member(name),
        actionId: ACTION_ID,
        reason,
        expectedVersion: (await current()).version,
      }),
    );

  const expectStatus = async (label: string) => expect((await current()).status).toBe(statusFromLabel(label));

  const expectLastChange = async (from: string, to: string, name: string, reason: string | null = null) =>
    expect((await current()).statusChanges.at(-1)).toEqual({
      from: statusFromLabel(from),
      to: statusFromLabel(to),
      by: member(name).userId,
      at: clock.now(),
      reason,
    });

  // Le Contexte est rejoué avant chaque scénario, et avant BeforeEachScenario : l'état est remis à zéro ici.
  Background(({ Given, And }) => {
    Given(`l'organisation "Clinique des Lilas"`, () => {
      organizationId = 'org-lilas';
      members = new Map();
      actions = new InMemoryActionRepository();
      clock = new FixedClock(new Date('2026-10-07T10:00:00Z'));
      error = undefined;
    });
    And(`les membres suivants :`, (_ctx, table: { nom: string; rôle: string }[]) => {
      for (const row of table) {
        members.set(row.nom, { userId: `user-${row.nom}`, organizationId, role: ROLES[row.rôle] });
      }
    });
    And(`le plan "Audit hygiène 2026" contenant l'action "Former au lavage des mains"`, () => {
      actions.seed(
        Action.create({
          id: ACTION_ID,
          organizationId,
          planId: 'plan-audit-hygiene',
          title: 'Former au lavage des mains',
          description: null,
          createdAt: clock.now(),
        }),
      );
    });
  });

  Rule(`Le Gestionnaire et l'Administrateur démarrent et soumettent une action`, ({ RuleScenarioOutline }) => {
    RuleScenarioOutline(`Transition autorisée`, ({ Given, When, Then, And }, variables) => {
      Given(`l'action est "<depuis>"`, () => setStatus(variables.depuis));
      When(`<membre> passe l'action à "<vers>"`, () => changeStatus(variables.membre, variables.vers));
      Then(`l'action est "<vers>"`, () => expectStatus(variables.vers));
      And(`l'historique contient "<depuis>" → "<vers>" par <membre>`, () =>
        expectLastChange(variables.depuis, variables.vers, variables.membre),
      );
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
      Then(`l'opération est refusée car interdite`, () => expect(error).toBeInstanceOf(ForbiddenError));
      And(`l'action est "À valider"`, () => expectStatus('À valider'));
    });
  });

  Rule(`Les transitions hors cycle sont refusées`, ({ RuleScenarioOutline }) => {
    RuleScenarioOutline(`Transition interdite`, ({ Given, When, Then, And }, variables) => {
      Given(`l'action est "<depuis>"`, () => setStatus(variables.depuis));
      When(`Alice passe l'action à "<vers>"`, () => changeStatus('Alice', variables.vers));
      Then(`l'opération est refusée car la transition est invalide`, () =>
        expect(error).toBeInstanceOf(InvalidTransitionError),
      );
      And(`l'action est "<depuis>"`, () => expectStatus(variables.depuis));
    });
  });

  Rule(`Un Utilisateur ne change jamais l'état d'une action`, ({ RuleScenarioOutline }) => {
    RuleScenarioOutline(`Carla tente une transition`, ({ Given, When, Then }, variables) => {
      Given(`l'action est "<depuis>"`, () => setStatus(variables.depuis));
      When(`Carla passe l'action à "<vers>"`, () => changeStatus('Carla', variables.vers));
      Then(`l'opération est refusée car interdite`, () => expect(error).toBeInstanceOf(ForbiddenError));
    });
  });

  Rule(`Un refus de validation exige un motif et est tracé`, ({ RuleScenario }) => {
    RuleScenario(`Alice refuse avec un motif`, ({ Given, When, Then, And }) => {
      Given(`l'action est "À valider"`, () => setStatus('À valider'));
      When(`Alice refuse la validation avec le motif "Preuve de formation manquante"`, () =>
        rejectValidation('Alice', 'Preuve de formation manquante'),
      );
      Then(`l'action est "En cours"`, () => expectStatus('En cours'));
      And(
        `l'historique contient "À valider" → "En cours" par Alice avec le motif "Preuve de formation manquante"`,
        () => expectLastChange('À valider', 'En cours', 'Alice', 'Preuve de formation manquante'),
      );
    });

    RuleScenario(`Alice refuse sans motif`, ({ Given, When, Then, And }) => {
      Given(`l'action est "À valider"`, () => setStatus('À valider'));
      When(`Alice refuse la validation sans motif`, () => rejectValidation('Alice', null));
      Then(`l'opération est refusée car le motif est obligatoire`, () =>
        expect(error).toBeInstanceOf(ValidationError),
      );
      And(`l'action est "À valider"`, () => expectStatus('À valider'));
    });

    RuleScenario(`Bob ne peut pas refuser une validation`, ({ Given, When, Then }) => {
      Given(`l'action est "À valider"`, () => setStatus('À valider'));
      When(`Bob refuse la validation avec le motif "Incomplet"`, () => rejectValidation('Bob', 'Incomplet'));
      Then(`l'opération est refusée car interdite`, () => expect(error).toBeInstanceOf(ForbiddenError));
    });
  });

  Rule(`Une modification basée sur une version périmée est rejetée`, ({ RuleScenario }) => {
    RuleScenario(`Deux changements simultanés`, ({ Given, When, Then, And }) => {
      Given(`l'action est "À faire" en version 1`, () => setStatus('À faire', 1));
      And(`Bob passe l'action à "En cours" depuis la version 1`, async () => {
        await changeStatus('Bob', 'En cours', 1);
        expect(error).toBeUndefined();
      });
      When(`Alice passe l'action à "En cours" depuis la version 1`, () => changeStatus('Alice', 'En cours', 1));
      Then(`l'opération est refusée car la version est périmée`, () =>
        expect(error).toBeInstanceOf(StaleVersionError),
      );
    });
  });
});
