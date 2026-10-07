import { Clock } from '../../../shared/domain/clock';
import { NotFoundError, ValidationError } from '../../../shared/domain/errors';
import { PasswordHasher } from '../domain/password-hasher';
import { PasswordBlocklist } from '../domain/password-policy';
import { UserRepository } from '../domain/user.repository';
import { checkPasswordInContext } from './new-password';

export interface ChangePasswordCommand {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

/**
 * Changement de mot de passe (US0, D8) : exige l'actuel (ASVS 6.2.3), applique la politique,
 * lève l'obligation de changer un mot de passe temporaire et ferme les autres sessions.
 */
export class ChangePassword {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly blocklist: PasswordBlocklist,
    private readonly clock: Clock,
  ) {}

  async execute(command: ChangePasswordCommand): Promise<void> {
    const user = await this.users.findById(command.userId);
    if (!user) {
      throw new NotFoundError(`Compte ${command.userId} introuvable`);
    }
    if (!(await this.hasher.verify(command.currentPassword, user.passwordHash))) {
      throw new ValidationError('Le mot de passe actuel est incorrect');
    }
    const { email, name } = user.snapshot();
    const password = checkPasswordInContext(command.newPassword, this.blocklist, { address: email }, [name]);
    user.changePassword(await this.hasher.hash(password), this.clock.now());
    await this.users.save(user);
  }
}
