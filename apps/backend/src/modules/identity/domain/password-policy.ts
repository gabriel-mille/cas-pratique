import { ValidationError } from '../../../shared/domain/errors';
import { length } from '../../../shared/domain/text';

// NIST SP 800-63B rev 4 §3.1.1.2 et ASVS 6.2.1, 6.2.9 (D13). Le maximum est un choix du projet (D32).
export const PASSWORD_MIN_LENGTH = 15;
export const PASSWORD_MAX_LENGTH = 128;

export const PASSWORD_BLOCKLIST = Symbol('PASSWORD_BLOCKLIST');

/** Mots de passe courants (ASVS 6.2.4, D18). L'implémentation compare sans tenir compte de la casse. */
export interface PasswordBlocklist {
  has(password: string): boolean;
}

/**
 * NIST : normaliser en NFC avant de compter et de hacher, compter un point de code par caractère,
 * comparer le mot de passe entier (pas des sous-chaînes) à la liste interdite et aux mots du contexte
 * (nom du service, identifiant…), donner la raison du refus, n'imposer aucune règle de composition.
 */
export function checkNewPassword(password: string, blocklist: PasswordBlocklist, contextWords: string[]): string {
  const normalized = password.normalize('NFC');
  if (length(normalized) < PASSWORD_MIN_LENGTH) {
    throw new ValidationError(`Le mot de passe fait moins de ${PASSWORD_MIN_LENGTH} caractères`);
  }
  if (length(normalized) > PASSWORD_MAX_LENGTH) {
    throw new ValidationError(`Le mot de passe dépasse ${PASSWORD_MAX_LENGTH} caractères`);
  }
  const lowered = normalized.toLowerCase();
  if (blocklist.has(normalized) || contextWords.some((word) => word.normalize('NFC').toLowerCase() === lowered)) {
    throw new ValidationError('Ce mot de passe est trop courant ou trop facile à deviner');
  }
  return normalized;
}
