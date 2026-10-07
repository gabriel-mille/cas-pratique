import { ForbiddenError, InvalidTransitionError, ValidationError } from '../../../shared/domain/errors';
import { Role } from '../../../shared/domain/role';
import { Action } from './action';
import { ActionStatus } from './action-status';

const { TODO, IN_PROGRESS, TO_VALIDATE, DONE } = ActionStatus;
const createdAt = new Date('2026-10-01T08:00:00Z');
const at = new Date('2026-10-02T09:00:00Z');
const admin = { userId: 'alice', role: Role.ADMIN };
const manager = { userId: 'bob', role: Role.MANAGER };
const member = { userId: 'carla', role: Role.MEMBER };

function actionIn(status: ActionStatus): Action {
  return Action.restore({
    id: 'a1',
    organizationId: 'org',
    planId: 'p1',
    title: 'Former au lavage des mains',
    description: null,
    status,
    version: 3,
    createdAt,
    statusChanges: [],
  });
}

describe('Action', () => {
  it('est créée à l’état À faire, en version 1, sans historique (D3)', () => {
    const action = Action.create({ id: 'a1', organizationId: 'org', planId: 'p1', title: 'T', description: null, createdAt });

    expect(action.status).toBe(TODO);
    expect(action.version).toBe(1);
    expect(action.statusChanges).toEqual([]);
  });

  it('change d’état et trace le changement : de, vers, auteur, date (D5)', () => {
    const action = actionIn(TODO);

    action.changeStatus(IN_PROGRESS, manager, at);

    expect(action.status).toBe(IN_PROGRESS);
    expect(action.statusChanges).toEqual([{ from: TODO, to: IN_PROGRESS, by: 'bob', at, reason: null }]);
  });

  it('refuse une transition hors cycle sans rien modifier', () => {
    const action = actionIn(TODO);

    expect(() => action.changeStatus(DONE, admin, at)).toThrow(InvalidTransitionError);
    expect(action.status).toBe(TODO);
    expect(action.statusChanges).toEqual([]);
  });

  it('refuse une transition à un rôle non autorisé sans rien modifier', () => {
    const action = actionIn(TO_VALIDATE);

    expect(() => action.changeStatus(DONE, manager, at)).toThrow(ForbiddenError);
    expect(action.status).toBe(TO_VALIDATE);
  });

  it('refuse toute transition à un Utilisateur', () => {
    expect(() => actionIn(TODO).changeStatus(IN_PROGRESS, member, at)).toThrow(ForbiddenError);
  });

  it('refuse une validation avec un motif, tracé dans l’historique (D4)', () => {
    const action = actionIn(TO_VALIDATE);

    action.rejectValidation(admin, '  Preuve manquante ', at);

    expect(action.status).toBe(IN_PROGRESS);
    expect(action.statusChanges).toEqual([{ from: TO_VALIDATE, to: IN_PROGRESS, by: 'alice', at, reason: 'Preuve manquante' }]);
  });

  it.each([[''], ['   '], [null]])('exige un motif non vide pour refuser une validation (%j)', (reason) => {
    const action = actionIn(TO_VALIDATE);

    expect(() => action.rejectValidation(admin, reason, at)).toThrow(ValidationError);
    expect(action.status).toBe(TO_VALIDATE);
  });

  it('ne permet pas de contourner le motif par un simple changement d’état', () => {
    expect(() => actionIn(TO_VALIDATE).changeStatus(IN_PROGRESS, admin, at)).toThrow(ValidationError);
  });

  it('ne permet pas à un Gestionnaire de refuser une validation', () => {
    expect(() => actionIn(TO_VALIDATE).rejectValidation(manager, 'Incomplet', at)).toThrow(ForbiddenError);
  });

  it('expose un historique non modifiable de l’extérieur', () => {
    const action = actionIn(TODO);
    action.changeStatus(IN_PROGRESS, admin, at);

    (action.statusChanges as unknown[]).length = 0;

    expect(action.statusChanges).toHaveLength(1);
  });
});
