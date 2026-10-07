import { readFileSync } from 'node:fs';
import { PasswordBlocklist } from '../domain/password-policy';

/** Liste interdite chargée une fois en mémoire ; comparaison sans tenir compte de la casse (D32). */
export class FilePasswordBlocklist implements PasswordBlocklist {
  private readonly passwords: Set<string>;

  constructor(passwords: Iterable<string>) {
    this.passwords = new Set([...passwords].map((password) => password.normalize('NFC').toLowerCase()));
  }

  /** Une entrée par ligne (cf. common-passwords.NOTICE.md). */
  static fromFile(path: string): FilePasswordBlocklist {
    return new FilePasswordBlocklist(readFileSync(path, 'utf8').split(/\r?\n/).filter(Boolean));
  }

  get size(): number {
    return this.passwords.size;
  }

  has(password: string): boolean {
    return this.passwords.has(password.normalize('NFC').toLowerCase());
  }
}
