import { Role } from '../../../shared/domain/role';

export const ActionStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  TO_VALIDATE: 'TO_VALIDATE',
  DONE: 'DONE',
} as const;

export type ActionStatus = (typeof ActionStatus)[keyof typeof ActionStatus];

export interface Transition {
  from: ActionStatus;
  to: ActionStatus;
  allowedRoles: readonly Role[];
  reasonRequired: boolean;
}

// Table de docs/specs/state-transitions.md (D2, D3, D4). Toute paire absente est interdite.
const TRANSITIONS: readonly Transition[] = [
  { from: ActionStatus.TODO, to: ActionStatus.IN_PROGRESS, allowedRoles: [Role.MANAGER, Role.ADMIN], reasonRequired: false },
  { from: ActionStatus.IN_PROGRESS, to: ActionStatus.TO_VALIDATE, allowedRoles: [Role.MANAGER, Role.ADMIN], reasonRequired: false },
  { from: ActionStatus.TO_VALIDATE, to: ActionStatus.DONE, allowedRoles: [Role.ADMIN], reasonRequired: false },
  // Refus de validation (D4).
  { from: ActionStatus.TO_VALIDATE, to: ActionStatus.IN_PROGRESS, allowedRoles: [Role.ADMIN], reasonRequired: true },
];

export function findTransition(from: ActionStatus, to: ActionStatus): Transition | undefined {
  return TRANSITIONS.find((t) => t.from === from && t.to === to);
}
