import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';
import { AuthenticatedRequest } from '../../../shared/presentation/authenticated-request';
import { HttpProblem } from '../../../shared/presentation/http-problem';
import { ResolveSession } from '../application/resolve-session';
import { ALLOWS_PENDING_PASSWORD_CHANGE, IS_PUBLIC } from './route-access';
import { SessionCookies } from './session-cookies';

/**
 * Guard global (doc NestJS *Authentication*, `APP_GUARD` + `@Public()`) : toute route exige une session.
 * L'appartenance et le rôle sont relus en base à chaque requête (D16) et le jeton est renouvelé (inactivité, D34).
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: SessionCookies,
    private readonly resolveSession: ResolveSession,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets)) {
      return true;
    }
    const http = context.switchToHttp();
    const request = http.getRequest<AuthenticatedRequest>();
    const token = await this.sessions.read(request);
    const session = await this.resolveSession.execute({ userId: token.userId, issuedAt: token.issuedAt });
    request.actor = session.actor;
    request.mustChangePassword = session.mustChangePassword;

    if (session.mustChangePassword && !this.reflector.getAllAndOverride<boolean>(ALLOWS_PENDING_PASSWORD_CHANGE, targets)) {
      throw new HttpProblem(
        HttpStatus.FORBIDDEN,
        'password-change-required',
        'Changez votre mot de passe temporaire pour continuer',
      );
    }
    await this.sessions.issue(http.getResponse<Response>(), token.userId, token.authenticatedAt);
    return true;
  }
}
