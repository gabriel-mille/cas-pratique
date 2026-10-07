import { ConflictError } from '../../../shared/domain/errors';
import { InMemoryVersionedStore } from '../../../shared/infrastructure/in-memory-versioned-store';
import { User, UserProps } from '../domain/user';
import { UserRepository } from '../domain/user.repository';

/** Implémentation en mémoire (D29). L'unicité de l'email imite la contrainte UNIQUE de la base. */
export class InMemoryUserRepository implements UserRepository {
  private readonly store = new InMemoryVersionedStore<UserProps>();

  async findById(id: string): Promise<User | null> {
    const row = this.store.find(id);
    return row ? User.restore(row) : null;
  }

  async findByEmail(emailKey: string): Promise<User | null> {
    const [row] = this.store.where((user) => user.emailKey === emailKey);
    return row ? User.restore(row) : null;
  }

  async findByIds(ids: string[]): Promise<User[]> {
    return this.store.where((user) => ids.includes(user.id)).map((row) => User.restore(row));
  }

  async save(user: User): Promise<void> {
    const row = user.snapshot();
    if (this.store.where((other) => other.emailKey === row.emailKey && other.id !== row.id).length) {
      throw new ConflictError('Cet email est déjà utilisé');
    }
    this.store.save(row);
  }
}
