export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');

/** Hachage lent et salé des mots de passe (ASVS 11.4.2, D13). */
export interface PasswordHasher {
  hash(password: string): Promise<string>;
  /** Faux pour un mot de passe différent ou une empreinte illisible ; jamais d'exception. */
  verify(password: string, hash: string): Promise<boolean>;
}
