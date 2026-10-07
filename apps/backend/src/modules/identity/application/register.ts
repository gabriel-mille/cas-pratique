import { randomUUID } from 'node:crypto';
import { TransactionRunner } from '../../../shared/application/transaction-runner';
import { Clock } from '../../../shared/domain/clock';
import { ConflictError } from '../../../shared/domain/errors';
import { Role } from '../../../shared/domain/role';
import { parseEmail } from '../domain/email';
import { Membership } from '../domain/membership';
import { MembershipRepository } from '../domain/membership.repository';
import { Organization } from '../domain/organization';
import { OrganizationRepository } from '../domain/organization.repository';
import { PasswordHasher } from '../domain/password-hasher';
import { PasswordBlocklist } from '../domain/password-policy';
import { User } from '../domain/user';
import { UserRepository } from '../domain/user.repository';
import { checkPasswordInContext } from './new-password';

export interface RegisterCommand {
  organizationName: string;
  name: string;
  email: string;
  password: string;
}

export interface Registration {
  userId: string;
  organizationId: string;
}

/** Inscription (US1, D8) : crée l'organisation et son premier administrateur, tout ou rien. */
export class Register {
  constructor(
    private readonly users: UserRepository,
    private readonly organizations: OrganizationRepository,
    private readonly memberships: MembershipRepository,
    private readonly hasher: PasswordHasher,
    private readonly blocklist: PasswordBlocklist,
    private readonly transactions: TransactionRunner,
    private readonly clock: Clock,
  ) {}

  async execute(command: RegisterCommand): Promise<Registration> {
    const now = this.clock.now();
    const email = parseEmail(command.email);
    const organization = Organization.create({ id: randomUUID(), name: command.organizationName, createdAt: now });
    const password = checkPasswordInContext(command.password, this.blocklist, email, [
      command.name,
      command.organizationName,
    ]);
    // Écart connu (ASVS 6.3.8, compliance.md) : l'inscription révèle qu'un email est déjà pris.
    if (await this.users.findByEmail(email.key)) {
      throw new ConflictError('Cet email est déjà utilisé');
    }
    const user = User.create({
      id: randomUUID(),
      email,
      name: command.name,
      passwordHash: await this.hasher.hash(password),
      mustChangePassword: false,
      createdAt: now,
    });
    const membership = Membership.create({
      id: randomUUID(),
      organizationId: organization.id,
      userId: user.id,
      role: Role.ADMIN,
      createdAt: now,
    });
    await this.transactions.run(async () => {
      await this.organizations.save(organization);
      await this.users.save(user);
      await this.memberships.save(membership);
    });
    return { userId: user.id, organizationId: organization.id };
  }
}
