import { DataSourceOptions } from 'typeorm';
import { ACTION_PLANS_ENTITIES } from '../modules/action-plans/infrastructure/typeorm/action-plans.orm-entities';
import { IDENTITY_ENTITIES } from '../modules/identity/infrastructure/typeorm/identity.orm-entities';
import { MIGRATIONS } from './migrations';

export interface DatabaseSettings {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

/** Variables d'environnement documentées dans le README ; valeurs par défaut = `docker-compose.yml`. */
export function databaseSettingsFromEnv(
  env: Record<string, string | undefined>
): DatabaseSettings {
  return {
    host: env['DATABASE_HOST'] ?? 'localhost',
    port: Number(env['DATABASE_PORT'] ?? 5432),
    username: env['DATABASE_USER'] ?? 'postgres',
    password: env['DATABASE_PASSWORD'] ?? 'postgres',
    database: env['DATABASE_NAME'] ?? 'cas_pratique',
  };
}

/**
 * Options communes à l'application, à la CLI TypeORM et aux tests d'intégration.
 * Le schéma vient uniquement des migrations : `synchronize` est interdit hors prototype (typeorm.io, *Migrations*).
 */
export function typeOrmOptions(settings: DatabaseSettings): DataSourceOptions {
  return {
    type: 'postgres',
    ...settings,
    entities: [...IDENTITY_ENTITIES, ...ACTION_PLANS_ENTITIES],
    migrations: MIGRATIONS,
    synchronize: false,
  };
}
