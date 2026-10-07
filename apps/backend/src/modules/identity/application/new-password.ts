import { Email } from '../domain/email';
import { checkNewPassword, PasswordBlocklist } from '../domain/password-policy';

/** Nom du service : premier des mots du contexte cités par NIST SP 800-63B rev 4 (ASVS 6.2.11). */
export const SERVICE_NAME = 'Qualineo';

/**
 * Mots du contexte (liste documentée en D32) : le service, l'email et sa partie locale,
 * les noms saisis. Le mot de passe entier ne doit égaler aucun d'eux.
 */
export function checkPasswordInContext(
  password: string,
  blocklist: PasswordBlocklist,
  email: Pick<Email, 'address'>,
  names: string[],
): string {
  const local = email.address.slice(0, email.address.lastIndexOf('@'));
  return checkNewPassword(password, blocklist, [SERVICE_NAME, email.address, local, ...names]);
}
