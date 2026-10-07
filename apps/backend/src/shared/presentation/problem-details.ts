import { HttpException, HttpStatus } from '@nestjs/common';
import {
  AuthenticationError,
  ConflictError,
  DomainError,
  ForbiddenError,
  InvalidTransitionError,
  NotFoundError,
  StaleVersionError,
  ValidationError,
} from '../domain/errors';
import { HttpProblem } from './http-problem';

/**
 * Corps `application/problem+json` (RFC 9457). `type` est une URI relative avec chemin complet,
 * comme le permet le §3.1.1 ; `code` est un membre d'extension (§3.2) pour le front.
 */
export interface Problem {
  type: string;
  title: string;
  status: number;
  detail: string;
  code: string;
  /** Erreurs de format renvoyées par le `ValidationPipe`. */
  errors?: string[];
}

const DOMAIN_ERRORS: [abstract new (...args: never[]) => DomainError, number, string, string][] = [
  [ValidationError, HttpStatus.BAD_REQUEST, 'validation-failed', 'Données invalides'],
  [AuthenticationError, HttpStatus.UNAUTHORIZED, 'authentication-failed', 'Authentification refusée'],
  [ForbiddenError, HttpStatus.FORBIDDEN, 'forbidden', 'Opération interdite'],
  [NotFoundError, HttpStatus.NOT_FOUND, 'not-found', 'Ressource introuvable'],
  [InvalidTransitionError, HttpStatus.CONFLICT, 'invalid-transition', 'Transition d’état invalide'],
  [ConflictError, HttpStatus.CONFLICT, 'conflict', 'Conflit avec une donnée existante'],
  [StaleVersionError, HttpStatus.PRECONDITION_FAILED, 'stale-version', 'Version périmée'],
];

const HTTP_CODES: Record<number, [string, string]> = {
  [HttpStatus.BAD_REQUEST]: ['validation-failed', 'Données invalides'],
  [HttpStatus.UNAUTHORIZED]: ['authentication-failed', 'Authentification refusée'],
  [HttpStatus.FORBIDDEN]: ['forbidden', 'Opération interdite'],
  [HttpStatus.NOT_FOUND]: ['not-found', 'Ressource introuvable'],
  [HttpStatus.PAYLOAD_TOO_LARGE]: ['payload-too-large', 'Requête trop volumineuse'],
  [HttpStatus.TOO_MANY_REQUESTS]: ['too-many-requests', 'Trop de requêtes'],
};

const problem = (status: number, code: string, title: string, detail: string, errors?: string[]): Problem => ({
  type: `/problems/${code}`,
  title,
  status,
  detail,
  code,
  ...(errors ? { errors } : {}),
});

function fromHttpException(exception: HttpException): Problem {
  const status = exception.getStatus();
  const [defaultCode, title] = HTTP_CODES[status] ?? [`http-${status}`, 'Requête refusée'];
  if (exception instanceof HttpProblem) {
    return problem(status, exception.code, title, exception.message);
  }
  const body = exception.getResponse();
  const messages = typeof body === 'object' && body !== null ? (body as { message?: unknown }).message : undefined;
  if (Array.isArray(messages)) {
    return problem(status, defaultCode, title, 'Le format de la requête est invalide', messages.map(String));
  }
  return problem(status, defaultCode, title, exception.message);
}

/** Traduit toute exception en Problem Details ; une erreur inattendue ne révèle rien (ASVS 16.5.1). */
export function toProblem(exception: unknown): Problem {
  const known = DOMAIN_ERRORS.find(([type]) => exception instanceof type);
  if (known && exception instanceof DomainError) {
    const [, status, code, title] = known;
    return problem(status, code, title, exception.message);
  }
  if (exception instanceof HttpException) {
    return fromHttpException(exception);
  }
  return problem(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'internal-error',
    'Erreur interne',
    'Une erreur inattendue est survenue',
  );
}
