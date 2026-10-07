import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { Actor } from '../domain/actor';

/** Requête complétée par le guard de session (D16). */
export interface AuthenticatedRequest extends Request {
  actor?: Actor;
  mustChangePassword?: boolean;
}

/** Membre authentifié de la requête ; son organisation ne vient jamais du client. */
export const CurrentActor = createParamDecorator((_: unknown, context: ExecutionContext): Actor => {
  const actor = context.switchToHttp().getRequest<AuthenticatedRequest>().actor;
  if (!actor) {
    throw new Error('Route sans session : il manque le guard de session');
  }
  return actor;
});
