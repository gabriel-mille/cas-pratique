import { domainToASCII } from 'node:url';
import { ValidationError } from '../../../shared/domain/errors';
import { length } from '../../../shared/domain/text';

/** Longueur maximale d'une adresse utilisable (RFC 5321 §4.5.3.1, chemin de 256 octets moins les chevrons). */
export const EMAIL_MAX_LENGTH = 254;

export interface Email {
  /** Adresse telle que saisie (espaces en bord retirés), pour l'affichage. */
  address: string;
  /** Forme de comparaison, sur laquelle porte l'unicité (D8, D32). */
  key: string;
}

/**
 * Le domaine ne rejette que les adresses clairement invalides ; le format fin est contrôlé
 * sur le DTO par une bibliothèque éprouvée (OWASP Email Validation and Verification Cheat Sheet).
 * Comparaison (D32) : NFC, domaine en punycode, adresse entière en minuscules.
 */
export function parseEmail(value: string): Email {
  const address = value.trim().normalize('NFC');
  const at = address.lastIndexOf('@');
  const local = address.slice(0, at);
  const domain = domainToASCII(address.slice(at + 1));
  if (at < 1 || !domain || /\s/.test(address) || length(address) > EMAIL_MAX_LENGTH) {
    throw new ValidationError('L’adresse email est invalide');
  }
  return { address, key: `${local}@${domain}`.toLowerCase() };
}
