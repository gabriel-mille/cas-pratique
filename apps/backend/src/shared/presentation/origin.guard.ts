import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { HttpProblem } from './http-problem';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Défense CSRF en complément de `SameSite=Strict` (D25, OWASP *CSRF Prevention Cheat Sheet*,
 * « Verifying Origin with standard headers ») : une écriture doit venir de l'origine du front.
 * Les navigateurs envoient `Origin` sur toute requête autre que GET/HEAD ; son absence est refusée.
 */
export function isAllowedOrigin(method: string, origin: string | undefined, allowedOrigin: string): boolean {
  return SAFE_METHODS.has(method) || origin === allowedOrigin;
}

@Injectable()
export class OriginGuard implements CanActivate {
  private readonly allowedOrigin: string;

  constructor(config: ConfigService) {
    this.allowedOrigin = config.getOrThrow<string>('APP_ORIGIN');
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (!isAllowedOrigin(request.method, request.headers.origin, this.allowedOrigin)) {
      throw new HttpProblem(HttpStatus.FORBIDDEN, 'origin-not-allowed', 'Origine de la requête non autorisée');
    }
    return true;
  }
}
