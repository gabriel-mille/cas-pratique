import { validateEnvironment } from './environment';

const SECRET = 'x'.repeat(32);

describe('validateEnvironment', () => {
  it('applique les valeurs par défaut', () => {
    expect(validateEnvironment({ JWT_SECRET: SECRET })).toMatchObject({
      JWT_SECRET: SECRET,
      APP_ORIGIN: 'http://localhost:4200',
      COOKIE_SECURE: true,
      AUTH_RATE_LIMIT_PER_IP: 20,
    });
  });

  it('lit les valeurs fournies', () => {
    expect(
      validateEnvironment({
        JWT_SECRET: SECRET,
        APP_ORIGIN: 'https://qualite.example',
        COOKIE_SECURE: 'false',
        AUTH_RATE_LIMIT_PER_IP: '100',
        DATABASE_HOST: 'db',
      }),
    ).toMatchObject({
      APP_ORIGIN: 'https://qualite.example',
      COOKIE_SECURE: false,
      AUTH_RATE_LIMIT_PER_IP: 100,
      DATABASE_HOST: 'db',
    });
  });

  // ASVS 13.3.1 : pas de secret par défaut dans le code ; HS256 demande une clé d'au moins 256 bits (RFC 7518 §3.2).
  it.each([[undefined], ['trop-court']])('refuse de démarrer sans secret JWT suffisant (%j)', (secret) => {
    expect(() => validateEnvironment({ JWT_SECRET: secret })).toThrow(/JWT_SECRET/);
  });

  it.each([['oui'], ['1']])('refuse une valeur booléenne ambiguë (%j)', (value) => {
    expect(() => validateEnvironment({ JWT_SECRET: SECRET, COOKIE_SECURE: value })).toThrow(/COOKIE_SECURE/);
  });

  it.each([['0'], ['abc']])('refuse une limite non entière positive (%j)', (value) => {
    expect(() => validateEnvironment({ JWT_SECRET: SECRET, AUTH_RATE_LIMIT_PER_IP: value })).toThrow(
      /AUTH_RATE_LIMIT_PER_IP/,
    );
  });
});
