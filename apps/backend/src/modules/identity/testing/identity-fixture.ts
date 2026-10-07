import { fileURLToPath } from 'node:url';
import { Actor } from '../../../shared/domain/actor';
import { Role } from '../../../shared/domain/role';
import { ImmediateTransactionRunner } from '../../../shared/infrastructure/immediate-transaction-runner';
import { FixedClock } from '../../../shared/testing/fixed-clock';
import { AddMember } from '../application/add-member';
import { Register, RegisterCommand } from '../application/register';
import { FilePasswordBlocklist } from '../infrastructure/file-password-blocklist';
import { InMemoryMembershipRepository } from '../infrastructure/in-memory-membership.repository';
import { InMemoryOrganizationRepository } from '../infrastructure/in-memory-organization.repository';
import { InMemoryUserRepository } from '../infrastructure/in-memory-user.repository';
import { FastPasswordHasher } from './fast-password-hasher';

export const VALID_PASSWORD = 'cheval agrafe pile correcte';

export const commonPasswords = FilePasswordBlocklist.fromFile(
  fileURLToPath(new URL('../infrastructure/common-passwords.txt', import.meta.url)),
);

/** Dépendances en mémoire des cas d'usage `identity`, et préparation par les vrais cas d'usage. */
export class IdentityFixture {
  readonly users = new InMemoryUserRepository();
  readonly organizations = new InMemoryOrganizationRepository();
  readonly memberships = new InMemoryMembershipRepository();
  readonly hasher = new FastPasswordHasher();
  readonly transactions = new ImmediateTransactionRunner();
  readonly clock = new FixedClock(new Date('2026-10-07T10:00:00Z'));

  /** Inscrit un admin et renvoie son acteur. */
  async registerAdmin(command: Partial<RegisterCommand> = {}): Promise<Actor> {
    const { userId, organizationId } = await new Register(
      this.users,
      this.organizations,
      this.memberships,
      this.hasher,
      commonPasswords,
      this.transactions,
      this.clock,
    ).execute({
      organizationName: 'Clinique des Lilas',
      name: 'Alice',
      email: 'alice@lilas.fr',
      password: VALID_PASSWORD,
      ...command,
    });
    return { userId, organizationId, role: Role.ADMIN };
  }

  async addMember(admin: Actor, email: string, role: Role = Role.MEMBER) {
    return new AddMember(this.users, this.memberships, this.hasher, this.transactions, this.clock).execute({
      actor: admin,
      email,
      name: email.split('@')[0],
      role,
    });
  }
}
