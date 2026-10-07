import { Role } from '../../../shared/domain/role';
import { ActionStatus, findTransition } from './action-status';

const { TODO, IN_PROGRESS, TO_VALIDATE, DONE } = ActionStatus;

// Table de docs/specs/state-transitions.md (ISTQB « all transitions »).
describe('table de transitions', () => {
  it.each([
    [TODO, IN_PROGRESS, [Role.MANAGER, Role.ADMIN], false],
    [IN_PROGRESS, TO_VALIDATE, [Role.MANAGER, Role.ADMIN], false],
    [TO_VALIDATE, DONE, [Role.ADMIN], false],
    [TO_VALIDATE, IN_PROGRESS, [Role.ADMIN], true],
  ])('%s → %s est permise à %j (motif requis : %s)', (from, to, roles, reasonRequired) => {
    expect(findTransition(from, to)).toEqual({ from, to, allowedRoles: roles, reasonRequired });
  });

  it.each([
    [TODO, TODO],
    [TODO, TO_VALIDATE],
    [TODO, DONE],
    [IN_PROGRESS, TODO],
    [IN_PROGRESS, IN_PROGRESS],
    [IN_PROGRESS, DONE],
    [TO_VALIDATE, TODO],
    [TO_VALIDATE, TO_VALIDATE],
    [DONE, TODO],
    [DONE, IN_PROGRESS],
    [DONE, TO_VALIDATE],
    [DONE, DONE],
  ])('%s → %s est interdite', (from, to) => {
    expect(findTransition(from, to)).toBeUndefined();
  });
});
