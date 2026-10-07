import { requireAdmin } from '../../../shared/application/require-admin';
import { Actor } from '../../../shared/domain/actor';
import { NotFoundError } from '../../../shared/domain/errors';
import { Role } from '../../../shared/domain/role';
import { MembershipRepository } from '../domain/membership.repository';
import { OrganizationRepository } from '../domain/organization.repository';
import { UserRepository } from '../domain/user.repository';

export interface MemberView {
  userId: string;
  name: string;
  email: string;
  role: Role;
}

export interface CurrentMemberView extends MemberView {
  organizationId: string;
  organizationName: string;
}

export class IdentityQueries {
  constructor(
    private readonly users: UserRepository,
    private readonly organizations: OrganizationRepository,
    private readonly memberships: MembershipRepository,
  ) {}

  /** Réservé à l'Administrateur (permissions.md, D9). Les membres retirés n'apparaissent plus. */
  async listMembers(actor: Actor): Promise<MemberView[]> {
    requireAdmin(actor, 'lister les membres');
    const memberships = await this.memberships.listActive(actor.organizationId);
    const users = new Map((await this.users.findByIds(memberships.map((m) => m.userId))).map((u) => [u.id, u]));
    return memberships.flatMap((membership) => {
      const user = users.get(membership.userId)?.snapshot();
      return user ? [{ userId: user.id, name: user.name, email: user.email, role: membership.role }] : [];
    });
  }

  /** Le membre connecté et son organisation. */
  async currentMember(actor: Actor): Promise<CurrentMemberView> {
    const user = (await this.users.findById(actor.userId))?.snapshot();
    const organization = (await this.organizations.findById(actor.organizationId))?.snapshot();
    if (!user || !organization) {
      throw new NotFoundError(`Membre ${actor.userId} introuvable`);
    }
    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: actor.role,
      organizationId: organization.id,
      organizationName: organization.name,
    };
  }
}
