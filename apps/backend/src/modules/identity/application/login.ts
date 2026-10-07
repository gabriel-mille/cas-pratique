import { randomBytes } from 'node:crypto';
import { AuthenticationError, ValidationError } from '../../../shared/domain/errors';
import { Role } from '../../../shared/domain/role';
import { parseEmail } from '../domain/email';
import { MembershipRepository } from '../domain/membership.repository';
import { PasswordHasher } from '../domain/password-hasher';
import { UserRepository } from '../domain/user.repository';

export const INVALID_CREDENTIALS = 'Email ou mot de passe incorrect';

export interface LoginCommand {
  email: string;
  password: string;
}

export interface LoginResult {
  userId: string;
  organizationId: string;
  role: Role;
  /** Vrai avec un mot de passe temporaire : seul le changement de mot de passe est permis (D8). */
  mustChangePassword: boolean;
}

/**
 * Connexion (US0, D13). Tout échec donne le même message (OWASP Authentication Cheat Sheet) :
 * email inconnu ou mal formé, mauvais mot de passe, membre retiré de son organisation.
 * Un email inconnu coûte aussi un hachage, pour ne pas se trahir par le temps de réponse.
 */
export class Login {
  private dummyHash?: Promise<string>;

  constructor(
    private readonly users: UserRepository,
    private readonly memberships: MembershipRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    const user = await this.findUser(command.email);
    const passwordMatches = await this.hasher.verify(command.password, user?.passwordHash ?? (await this.dummy()));
    const membership = user && passwordMatches ? await this.memberships.findActiveByUser(user.id) : null;
    if (!user || !membership) {
      throw new AuthenticationError(INVALID_CREDENTIALS);
    }
    return {
      userId: user.id,
      organizationId: membership.organizationId,
      role: membership.role,
      mustChangePassword: user.mustChangePassword,
    };
  }

  private async findUser(email: string) {
    try {
      return await this.users.findByEmail(parseEmail(email).key);
    } catch (error) {
      if (error instanceof ValidationError) return null;
      throw error;
    }
  }

  private dummy(): Promise<string> {
    this.dummyHash ??= this.hasher.hash(randomBytes(32).toString('base64'));
    return this.dummyHash;
  }
}
