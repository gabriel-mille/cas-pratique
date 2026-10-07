/** Longueur minimale du secret : RFC 7518 §3.2 exige une clé d'au moins 256 bits pour HS256. */
const JWT_SECRET_MIN_LENGTH = 32;

export interface Environment {
  JWT_SECRET: string;
  /** Seule origine autorisée à écrire (D25) : celle du front. */
  APP_ORIGIN: string;
  /** Cookie de session `Secure` ; à `false` seulement en local sur un navigateur qui le refuse en http. */
  COOKIE_SECURE: boolean;
  /** Requêtes d'authentification par minute et par IP (D17). */
  AUTH_RATE_LIMIT_PER_IP: number;
  [key: string]: unknown;
}

function booleanVariable(name: string, value: unknown, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  if (value === 'true' || value === 'false') return value === 'true';
  throw new Error(`${name} doit valoir "true" ou "false"`);
}

function positiveIntegerVariable(name: string, value: unknown, fallback: number): number {
  if (value === undefined || value === '') return fallback;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    throw new Error(`${name} doit être un entier positif`);
  }
  return number;
}

/**
 * Validation au démarrage (`ConfigModule.forRoot({ validate })`, doc NestJS *Configuration*) :
 * l'application refuse de démarrer sans secret plutôt que d'en prendre un par défaut (ASVS 13.3.1).
 */
export function validateEnvironment(env: Record<string, unknown>): Environment {
  const secret = env['JWT_SECRET'];
  if (typeof secret !== 'string' || secret.length < JWT_SECRET_MIN_LENGTH) {
    throw new Error(
      `JWT_SECRET doit faire au moins ${JWT_SECRET_MIN_LENGTH} caractères (ex. : openssl rand -base64 48)`,
    );
  }
  return {
    ...env,
    JWT_SECRET: secret,
    APP_ORIGIN: typeof env['APP_ORIGIN'] === 'string' && env['APP_ORIGIN'] ? env['APP_ORIGIN'] : 'http://localhost:4200',
    COOKIE_SECURE: booleanVariable('COOKIE_SECURE', env['COOKIE_SECURE'], true),
    AUTH_RATE_LIMIT_PER_IP: positiveIntegerVariable('AUTH_RATE_LIMIT_PER_IP', env['AUTH_RATE_LIMIT_PER_IP'], 20),
  };
}
