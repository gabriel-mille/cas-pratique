import { ForbiddenError } from '../../../shared/domain/errors';
import { Role } from '../../../shared/domain/role';

export interface MembershipProps {
  id: string;
  organizationId: string;
  userId: string;
  role: Role;
  version: number;
  createdAt: Date;
  /** Retrait logique et tracé (D9) : l'appartenance reste en base, le repository l'exclut des lectures. */
  removedAt: Date | null;
  removedBy: string | null;
}

export type NewMembershipProps = Omit<MembershipProps, 'version' | 'removedAt' | 'removedBy'>;

/**
 * Appartenance d'un compte à une organisation, porteuse du rôle (D12).
 * Personne ne change son propre rôle ni ne se retire (D9) : il reste donc toujours un admin.
 */
export class Membership {
  private constructor(private readonly props: MembershipProps) {}

  static create(props: NewMembershipProps): Membership {
    return new Membership({ ...props, version: 1, removedAt: null, removedBy: null });
  }

  static restore(props: MembershipProps): Membership {
    return new Membership({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get role(): Role {
    return this.props.role;
  }

  snapshot(): MembershipProps {
    return { ...this.props };
  }

  changeRole(role: Role, by: string): void {
    if (by === this.props.userId) {
      throw new ForbiddenError('On ne peut pas modifier son propre rôle');
    }
    this.props.role = role;
  }

  remove(by: string, at: Date): void {
    if (by === this.props.userId) {
      throw new ForbiddenError('On ne peut pas se retirer soi-même');
    }
    this.props.removedAt = at;
    this.props.removedBy = by;
  }
}
