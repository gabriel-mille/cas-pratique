// Erreurs métier typées (D30). Le filtre HTTP les traduit en Problem Details (RFC 9457).
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Le rôle de l'acteur ne permet pas l'opération. */
export class ForbiddenError extends DomainError {}

/** La transition d'état ne fait pas partie du cycle de vie. */
export class InvalidTransitionError extends DomainError {}

/** Une donnée ne respecte pas une règle métier (champ obligatoire, longueur…). */
export class ValidationError extends DomainError {}

/** La ressource n'existe pas ou n'appartient pas à l'organisation de l'acteur. */
export class NotFoundError extends DomainError {}

/** La modification part d'une version périmée (D14). */
export class StaleVersionError extends DomainError {}

/** L'opération contredit une donnée existante (email déjà utilisé). */
export class ConflictError extends DomainError {}

/** Identifiants refusés ou session invalide. Le message reste générique (D13). */
export class AuthenticationError extends DomainError {}
