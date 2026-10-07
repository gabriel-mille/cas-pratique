import { randomBytes, randomUUID } from 'node:crypto';
import { requireAdmin } from '../../../shared/application/require-admin';
import { TransactionRunner } from '../../../shared/application/transaction-runner';
import { Actor } from '../../../shared/domain/actor';
import { Clock } from '../../../shared/domain/clock';
import { ConflictError } from '../../../shared/domain/errors';
import { Role } from '../../../shared/domain/role';
import { parseEmail } from '../domain/email';
import { Membership } from '../domain/membership';
import { MembershipRepository } from '../domain/membership.repository';
import { PasswordHasher } from '../domain/password-hasher';
import { User } from '../domain/user';
import { UserRepository } from '../domain/user.repository';

export interface AddMemberCommand {
  actor: Actor;
  email: string;
  name: string;
  role: Role;
}

export interface AddedMember {
  userId: string;
  /** Rendu une seule fois à l'admin, qui le transmet ; seule son empreinte est stockée (D8). */
  temporaryPassword: string;
}

/** 18 octets aléatoires (144 bits) : 24 caractères en base64url, au-dessus du minimum de 15. */
const generateTemporaryPassword = () => randomBytes(18).toString('base64url');

/** Ajout d'un membre par un admin (US2, D8), avec un mot de passe temporaire à changer. */
export class AddMember {
  constructor(
    private readonly users: UserRepository,
    private readonly memberships: MembershipRepository,
    private readonly hasher: PasswordHasher,
    private readonly transactions: TransactionRunner,
    private readonly clock: Clock,
  ) {}

  async execute(command: AddMemberCommand): Promise<AddedMember> {
    requireAdmin(command.actor, 'ajouter un membre');
    const now = this.clock.now();
    const email = parseEmail(command.email);
    if (await this.users.findByEmail(email.key)) {
      throw new ConflictError('Cet email est déjà utilisé');
    }
    const temporaryPassword = generateTemporaryPassword();
    const user = User.create({
      id: randomUUID(),
      email,
      name: command.name,
      passwordHash: await this.hasher.hash(temporaryPassword),
      mustChangePassword: true,
      createdAt: now,
    });
    const membership = Membership.create({
      id: randomUUID(),
      organizationId: command.actor.organizationId,
      userId: user.id,
      role: command.role,
      createdAt: now,
    });
    await this.transactions.run(async () => {
      await this.users.save(user);
      await this.memberships.save(membership);
    });
    return { userId: user.id, temporaryPassword };
  }
}
