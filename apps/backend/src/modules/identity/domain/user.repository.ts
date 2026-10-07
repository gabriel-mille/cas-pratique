import { User } from './user';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  /** Recherche par forme de comparaison (`Email.key`). */
  findByEmail(emailKey: string): Promise<User | null>;
  findByIds(ids: string[]): Promise<User[]>;
  /** Lève `ConflictError` si l'email est déjà pris, `StaleVersionError` si la version est périmée. */
  save(user: User): Promise<void>;
}
