import { createHash } from 'node:crypto';
import { PasswordHasher } from '../domain/password-hasher';

/**
 * Hacheur rapide pour les scénarios (D29) : scrypt coûte environ 350 ms par appel.
 * Ne garde pas le mot de passe en clair, pour que les tests le vérifient comme en production.
 */
export class FastPasswordHasher implements PasswordHasher {
  readonly calls: string[] = [];

  async hash(password: string): Promise<string> {
    return `sha256$${createHash('sha256').update(password.normalize('NFC')).digest('base64')}`;
  }

  async verify(password: string, hash: string): Promise<boolean> {
    this.calls.push(hash);
    return (await this.hash(password)) === hash;
  }
}
