import { Actor } from '../../../shared/domain/actor';
import { AuthenticationError } from '../../../shared/domain/errors';
import { MembershipRepository } from '../domain/membership.repository';
import { UserRepository } from '../domain/user.repository';

export interface SessionCommand {
  userId: string;
  /** Date d'émission du jeton. */
  issuedAt: Date;
}

export interface Session {
  actor: Actor;
  mustChangePassword: boolean;
}

/**
 * Relu à chaque requête par le guard (D16) : le rôle et l'appartenance viennent de la base, pas du jeton.
 * Un retrait ou un changement de rôle s'applique donc dès la requête suivante (ASVS 8.3.2, 7.4.2).
 */
export class ResolveSession {
  constructor(
    private readonly users: UserRepository,
    private readonly memberships: MembershipRepository,
  ) {}

  async execute(command: SessionCommand): Promise<Session> {
    const user = await this.users.findById(command.userId);
    const membership = user?.acceptsSessionIssuedAt(command.issuedAt)
      ? await this.memberships.findActiveByUser(user.id)
      : null;
    if (!user || !membership) {
      throw new AuthenticationError('Session expirée ou révoquée');
    }
    return {
      actor: { userId: user.id, organizationId: membership.organizationId, role: membership.role },
      mustChangePassword: user.mustChangePassword,
    };
  }
}
