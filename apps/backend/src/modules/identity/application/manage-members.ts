import { requireAdmin } from '../../../shared/application/require-admin';
import { Actor } from '../../../shared/domain/actor';
import { Clock } from '../../../shared/domain/clock';
import { NotFoundError } from '../../../shared/domain/errors';
import { Role } from '../../../shared/domain/role';
import { Membership } from '../domain/membership';
import { MembershipRepository } from '../domain/membership.repository';

async function loadMember(memberships: MembershipRepository, actor: Actor, userId: string): Promise<Membership> {
  const membership = await memberships.findActive(actor.organizationId, userId);
  if (!membership) {
    throw new NotFoundError(`Membre ${userId} introuvable`);
  }
  return membership;
}

export interface ChangeMemberRoleCommand {
  actor: Actor;
  userId: string;
  role: Role;
}

/** US2b, D9. Pris en compte dès la requête suivante du membre : le guard relit son rôle (D16). */
export class ChangeMemberRole {
  constructor(private readonly memberships: MembershipRepository) {}

  async execute(command: ChangeMemberRoleCommand): Promise<void> {
    requireAdmin(command.actor, 'changer le rôle d’un membre');
    const membership = await loadMember(this.memberships, command.actor, command.userId);
    membership.changeRole(command.role, command.actor.userId);
    await this.memberships.save(membership);
  }
}

export interface RemoveMemberCommand {
  actor: Actor;
  userId: string;
}

/** US2b, D9 : retrait logique et tracé ; le membre ne peut plus se connecter et ses sessions tombent. */
export class RemoveMember {
  constructor(
    private readonly memberships: MembershipRepository,
    private readonly clock: Clock,
  ) {}

  async execute(command: RemoveMemberCommand): Promise<void> {
    requireAdmin(command.actor, 'retirer un membre');
    const membership = await loadMember(this.memberships, command.actor, command.userId);
    membership.remove(command.actor.userId, this.clock.now());
    await this.memberships.save(membership);
  }
}
