import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import { AuthenticationError } from '../../../shared/domain/errors';
import { Clock } from '../../../shared/domain/clock';
import { SESSION_IDLE_TIMEOUT_MS, SESSION_MAX_DURATION_MS, SessionCookies } from './session-cookies';

const SECRET = 's'.repeat(32);

class MovableClock implements Clock {
  constructor(public current: Date) {}
  now() {
    return this.current;
  }
}

/** Réponse Express réduite à ce que le service utilise : il suffit de relire le cookie posé. */
function fakeResponse() {
  const cookies = new Map<string, { value: string; options: Record<string, unknown> }>();
  const response = {
    cookie: (name: string, value: string, options: Record<string, unknown>) => cookies.set(name, { value, options }),
    clearCookie: (name: string, options: Record<string, unknown>) => cookies.set(name, { value: '', options }),
  } as unknown as Response;
  return { response, cookies };
}

const requestWith = (cookies: Record<string, string>) => ({ cookies }) as unknown as Request;

describe('SessionCookies (D16, ASVS 3.3 et 7.3)', () => {
  const loginAt = new Date('2026-10-07T08:00:00.123Z');
  let clock: MovableClock;
  let sessions: SessionCookies;

  beforeEach(() => {
    clock = new MovableClock(loginAt);
    sessions = new SessionCookies(new JwtService({ secret: SECRET }), clock, true);
  });

  it('pose un cookie __Host- HttpOnly, Secure, SameSite=Strict, limité à la durée d’inactivité', async () => {
    const { response, cookies } = fakeResponse();

    await sessions.issue(response, 'user-alice', loginAt);

    expect(cookies.get('__Host-session')?.options).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: SESSION_IDLE_TIMEOUT_MS,
    });
  });

  it('relit le compte et la date d’émission à la milliseconde', async () => {
    const { response, cookies } = fakeResponse();
    await sessions.issue(response, 'user-alice', loginAt);

    const session = await sessions.read(requestWith({ '__Host-session': cookies.get('__Host-session')?.value ?? '' }));

    expect(session).toEqual({ userId: 'user-alice', issuedAt: loginAt, authenticatedAt: new Date('2026-10-07T08:00:00Z') });
  });

  it('refuse une requête sans cookie', async () => {
    await expect(sessions.read(requestWith({}))).rejects.toThrow(AuthenticationError);
  });

  it('refuse un jeton altéré ou signé avec une autre clé', async () => {
    const forged = await new JwtService({ secret: 'autre'.repeat(8) }).signAsync({ sub: 'user-alice', iat_ms: 0, auth_time: 0 });

    await expect(sessions.read(requestWith({ '__Host-session': forged }))).rejects.toThrow(AuthenticationError);
    await expect(sessions.read(requestWith({ '__Host-session': 'pas-un-jwt' }))).rejects.toThrow(AuthenticationError);
  });

  it('refuse une session renouvelée au-delà de la durée maximale depuis la connexion', async () => {
    clock.current = new Date(loginAt.getTime() + SESSION_MAX_DURATION_MS + 1000);
    const { response, cookies } = fakeResponse();
    await sessions.issue(response, 'user-alice', loginAt);

    await expect(
      sessions.read(requestWith({ '__Host-session': cookies.get('__Host-session')?.value ?? '' })),
    ).rejects.toThrow(AuthenticationError);
  });

  it('utilise un cookie sans préfixe __Host- quand Secure est désactivé (local en http)', async () => {
    const local = new SessionCookies(new JwtService({ secret: SECRET }), clock, false);
    const { response, cookies } = fakeResponse();

    await local.issue(response, 'user-alice', loginAt);
    local.clear(response);

    expect(cookies.get('session')).toEqual({ value: '', options: { httpOnly: true, secure: false, sameSite: 'strict', path: '/' } });
  });
});
