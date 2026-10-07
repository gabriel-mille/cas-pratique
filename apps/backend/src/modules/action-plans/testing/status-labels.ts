import { ActionStatus } from '../domain/action-status';

// Libellés de l'interface utilisés dans les .feature (langage ubiquitaire, docs/specs/README.md).
const LABELS: Record<string, ActionStatus> = {
  'À faire': ActionStatus.TODO,
  'En cours': ActionStatus.IN_PROGRESS,
  'À valider': ActionStatus.TO_VALIDATE,
  Terminé: ActionStatus.DONE,
};

export function statusFromLabel(label: string): ActionStatus {
  const status = LABELS[label];
  if (!status) {
    throw new Error(`Libellé d'état inconnu : ${label}`);
  }
  return status;
}
