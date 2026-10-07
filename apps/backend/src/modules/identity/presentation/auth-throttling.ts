import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerModuleOptions } from '@nestjs/throttler';
import { AuthenticatedRequest } from '../../../shared/presentation/authenticated-request';

/** Tentatives par compte sur 15 minutes, toutes IP confondues (D17, choix du projet). */
export const ACCOUNT_RATE_LIMIT = 10;
const ACCOUNT_WINDOW_MS = 15 * 60 * 1000;
const IP_WINDOW_MS = 60 * 1000;

/** Compte visé : l'email saisi (connexion, inscription) ou le membre connecté (changement de mot de passe). */
export function accountKey(request: Pick<AuthenticatedRequest, 'body' | 'actor'>): string | null {
  const email: unknown = request.body?.email;
  if (typeof email === 'string' && email.trim()) {
    return `email:${email.trim().toLowerCase()}`;
  }
  return request.actor ? `user:${request.actor.userId}` : null;
}

const requestOf = (context: ExecutionContext) => context.switchToHttp().getRequest<AuthenticatedRequest>();

/**
 * `@nestjs/throttler` (D17) sur les routes d'authentification uniquement (`@UseGuards(ThrottlerGuard)`) :
 * par IP contre le balayage, par compte contre le ciblage d'un compte depuis plusieurs IP.
 * Pas de verrouillage du compte, qu'un tiers pourrait provoquer (ASVS 6.3.1).
 */
export function authThrottling(config: ConfigService): ThrottlerModuleOptions {
  return {
    throttlers: [
      { name: 'ip', ttl: IP_WINDOW_MS, limit: config.getOrThrow<number>('AUTH_RATE_LIMIT_PER_IP') },
      {
        name: 'account',
        ttl: ACCOUNT_WINDOW_MS,
        limit: ACCOUNT_RATE_LIMIT,
        skipIf: (context) => accountKey(requestOf(context)) === null,
        getTracker: (request) => accountKey(request as AuthenticatedRequest) ?? '',
      },
    ],
  };
}
