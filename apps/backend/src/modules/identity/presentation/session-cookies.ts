import { JwtService } from '@nestjs/jwt';
import type { CookieOptions, Request, Response } from 'express';
import { Clock } from '../../../shared/domain/clock';
import { AuthenticationError } from '../../../shared/domain/errors';

// Durées choisies pour le projet (D34), sans valeur imposée par l'ASVS : il demande de les fixer (7.3.1, 7.3.2).
/** Inactivité : le jeton expire 30 min après la dernière requête (renouvellement glissant). */
export const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
/** Durée maximale depuis la connexion, renouvellements compris : une journée de travail. */
export const SESSION_MAX_DURATION_MS = 12 * 60 * 60 * 1000;

const SESSION_EXPIRED = 'Session expirée ou révoquée';

interface SessionClaims {
  sub: string;
  /** Émission à la milliseconde : `iat` est en secondes, `sessionsValidAfter` en millisecondes (D16). */
  iat_ms: number;
  /** Date de connexion, en secondes (claim `auth_time` d'OpenID Connect Core §2). */
  auth_time: number;
}

export interface SessionToken {
  userId: string;
  issuedAt: Date;
  authenticatedAt: Date;
}

/**
 * Session dans un JWT signé (HS256), transporté par un cookie HttpOnly (D13, D16).
 * Le jeton ne porte ni rôle ni organisation : le guard les relit en base à chaque requête.
 */
export class SessionCookies {
  private readonly name: string;
  private readonly options: CookieOptions;

  constructor(
    private readonly jwt: JwtService,
    private readonly clock: Clock,
    secure: boolean,
  ) {
    // Préfixe __Host- : cookie lié à l'hôte, Secure et Path=/ imposés par le navigateur (ASVS 3.3.1, RFC 6265bis).
    this.name = secure ? '__Host-session' : 'session';
    this.options = { httpOnly: true, secure, sameSite: 'strict', path: '/' };
  }

  async issue(response: Response, userId: string, authenticatedAt: Date): Promise<void> {
    const claims: Omit<SessionClaims, 'sub'> = {
      iat_ms: this.clock.now().getTime(),
      auth_time: Math.floor(authenticatedAt.getTime() / 1000),
    };
    const token = await this.jwt.signAsync(claims, {
      subject: userId,
      expiresIn: SESSION_IDLE_TIMEOUT_MS / 1000,
    });
    response.cookie(this.name, token, { ...this.options, maxAge: SESSION_IDLE_TIMEOUT_MS });
  }

  clear(response: Response): void {
    response.clearCookie(this.name, this.options);
  }

  async read(request: Request): Promise<SessionToken> {
    const token: unknown = request.cookies?.[this.name];
    if (typeof token !== 'string' || !token) {
      throw new AuthenticationError('Authentification requise');
    }
    const claims = await this.verify(token);
    const authenticatedAt = new Date(claims.auth_time * 1000);
    if (this.clock.now().getTime() - authenticatedAt.getTime() > SESSION_MAX_DURATION_MS) {
      throw new AuthenticationError(SESSION_EXPIRED);
    }
    return { userId: claims.sub, issuedAt: new Date(claims.iat_ms), authenticatedAt };
  }

  private async verify(token: string): Promise<SessionClaims> {
    try {
      const claims = await this.jwt.verifyAsync<SessionClaims>(token, { algorithms: ['HS256'] });
      if (typeof claims.sub === 'string' && Number.isFinite(claims.iat_ms) && Number.isFinite(claims.auth_time)) {
        return claims;
      }
    } catch {
      // Signature, format ou expiration : même réponse, sans détail (D13).
    }
    throw new AuthenticationError(SESSION_EXPIRED);
  }
}
