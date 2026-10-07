import type { ActionStatus, Role } from '@/shared/api';
import { availableTransitions, canRejectValidation } from './status';

describe('availableTransitions', () => {
  it.each<[ActionStatus, Role, ActionStatus[]]>([
    ['TODO', 'MEMBER', []],
    ['TODO', 'MANAGER', ['IN_PROGRESS']],
    ['TODO', 'ADMIN', ['IN_PROGRESS']],
    ['IN_PROGRESS', 'MEMBER', []],
    ['IN_PROGRESS', 'MANAGER', ['TO_VALIDATE']],
    ['IN_PROGRESS', 'ADMIN', ['TO_VALIDATE']],
    ['TO_VALIDATE', 'MEMBER', []],
    ['TO_VALIDATE', 'MANAGER', []],
    ['TO_VALIDATE', 'ADMIN', ['DONE']],
    ['DONE', 'ADMIN', []],
  ])('depuis %s, le rôle %s peut passer à %j', (status, role, expected) => {
    expect(availableTransitions(status, role)).toEqual(expected);
  });
});

describe('canRejectValidation', () => {
  it.each<[ActionStatus, Role, boolean]>([
    ['TO_VALIDATE', 'ADMIN', true],
    ['TO_VALIDATE', 'MANAGER', false],
    ['TO_VALIDATE', 'MEMBER', false],
    ['IN_PROGRESS', 'ADMIN', false],
  ])('depuis %s, le rôle %s : %s', (status, role, expected) => {
    expect(canRejectValidation(status, role)).toBe(expected);
  });
});
