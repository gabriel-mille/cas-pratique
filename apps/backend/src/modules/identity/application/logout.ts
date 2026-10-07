import { Clock } from '../../../shared/domain/clock';
import { UserRepository } from '../domain/user.repository';

/** Déconnexion (ASVS 7.4.1, D16) : tous les jetons déjà émis pour ce compte sont refusés. */
export class Logout {
  constructor(
    private readonly users: UserRepository,
    private readonly clock: Clock,
  ) {}

  async execute(userId: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (user) {
      user.revokeSessions(this.clock.now());
      await this.users.save(user);
    }
  }
}
