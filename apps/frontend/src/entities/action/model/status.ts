import type { ActionStatus, Role } from '@/shared/api';

export const STATUS_LABELS: Record<ActionStatus, string> = {
  TODO: 'À faire',
  IN_PROGRESS: 'En cours',
  TO_VALIDATE: 'À valider',
  DONE: 'Terminé',
};

/**
 * Copie de la table de `docs/specs/state-transitions.md` (D2) pour n'afficher que les boutons utiles.
 * Confort uniquement : le back reste la seule autorité et refuse tout le reste.
 */
const TRANSITIONS: readonly { from: ActionStatus; to: ActionStatus; roles: readonly Role[] }[] = [
  { from: 'TODO', to: 'IN_PROGRESS', roles: ['MANAGER', 'ADMIN'] },
  { from: 'IN_PROGRESS', to: 'TO_VALIDATE', roles: ['MANAGER', 'ADMIN'] },
  { from: 'TO_VALIDATE', to: 'DONE', roles: ['ADMIN'] },
];

export const availableTransitions = (status: ActionStatus, role: Role): ActionStatus[] =>
  TRANSITIONS.filter((transition) => transition.from === status && transition.roles.includes(role)).map(
    (transition) => transition.to,
  );

/** Refus de validation (D4) : À valider → En cours, par l'Administrateur, avec un motif. */
export const canRejectValidation = (status: ActionStatus, role: Role): boolean =>
  status === 'TO_VALIDATE' && role === 'ADMIN';
