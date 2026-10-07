import { ForbiddenError, InvalidTransitionError, ValidationError } from '../../../shared/domain/errors';
import { Role } from '../../../shared/domain/role';
import { ActionStatus, findTransition } from './action-status';

export interface StatusChanger {
  userId: string;
  role: Role;
}

/** Entrée de l'historique (D5). */
export interface ActionStatusChange {
  from: ActionStatus;
  to: ActionStatus;
  by: string;
  at: Date;
  reason: string | null;
}

export interface ActionProps {
  id: string;
  organizationId: string;
  planId: string;
  title: string;
  description: string | null;
  status: ActionStatus;
  version: number;
  createdAt: Date;
  statusChanges: ActionStatusChange[];
}

export type NewActionProps = Omit<ActionProps, 'status' | 'version' | 'statusChanges'>;

/** Agrégat (D28) : l'action et son historique de changements d'état. */
export class Action {
  private constructor(private readonly props: ActionProps) {}

  static create(props: NewActionProps): Action {
    return new Action({ ...props, status: ActionStatus.TODO, version: 1, statusChanges: [] });
  }

  static restore(props: ActionProps): Action {
    return new Action({ ...props, statusChanges: [...props.statusChanges] });
  }

  get id(): string {
    return this.props.id;
  }

  get status(): ActionStatus {
    return this.props.status;
  }

  get version(): number {
    return this.props.version;
  }

  get statusChanges(): readonly ActionStatusChange[] {
    return [...this.props.statusChanges];
  }

  /** Copie de l'état complet, pour la persistance. */
  snapshot(): ActionProps {
    return { ...this.props, statusChanges: this.props.statusChanges.map((change) => ({ ...change })) };
  }

  changeStatus(to: ActionStatus, by: StatusChanger, at: Date): void {
    this.transition(to, by, at, null);
  }

  /** Refus de validation : À valider → En cours, motif obligatoire (D4). */
  rejectValidation(by: StatusChanger, reason: string | null, at: Date): void {
    this.transition(ActionStatus.IN_PROGRESS, by, at, reason);
  }

  private transition(to: ActionStatus, by: StatusChanger, at: Date, reason: string | null): void {
    const from = this.props.status;
    const transition = findTransition(from, to);
    if (!transition) {
      throw new InvalidTransitionError(`Transition ${from} → ${to} invalide`);
    }
    if (!transition.allowedRoles.includes(by.role)) {
      throw new ForbiddenError(`Le rôle ${by.role} ne peut pas faire ${from} → ${to}`);
    }
    const trimmedReason = reason?.trim() || null;
    if (transition.reasonRequired && !trimmedReason) {
      throw new ValidationError('Le motif est obligatoire');
    }
    this.props.status = to;
    this.props.statusChanges.push({ from, to, by: by.userId, at, reason: trimmedReason });
  }
}
