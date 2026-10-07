import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { inject } from 'vitest';
import { validateEnvironment } from '../../app/environment';
import { DatabaseModule } from '../../database/database.module';
import { typeOrmOptions } from '../../database/typeorm-options';
import { ActionPlansModule } from '../../modules/action-plans/action-plans.module';
import { IdentityModule } from '../../modules/identity/identity.module';
import {
  ALICE,
  BOB,
  ORG_A,
  ORG_B,
  PLAN_1,
  PLAN_2,
  PLAN_3,
  XAVIER,
} from './test-ids';

/** Secret de test uniquement (32 caractères minimum, cf. `validateEnvironment`). */
export const TEST_JWT_SECRET = 'integration-test-secret-not-for-production';

/**
 * Monte les modules de persistance réels (TypeORM + nestjs-cls) sur la base du conteneur.
 * Chaque test vide la base avec `reset`, puis sème les parents dont il a besoin (clés étrangères).
 */
export function useIntegrationDatabase() {
  let module: TestingModule | undefined;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        // Les modules lisent leur configuration (secret JWT, throttling) : environnement de test, sans fichier .env.
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          validate: () => validateEnvironment({ JWT_SECRET: TEST_JWT_SECRET }),
        }),
        DatabaseModule.forRoot({
          useFactory: () => typeOrmOptions(inject('database')),
        }),
        IdentityModule,
        ActionPlansModule,
      ],
    }).compile();
  });

  afterAll(async () => {
    await module?.close();
  });

  const get = <T>(token: symbol | (abstract new (...args: never[]) => T)) => {
    if (!module) {
      throw new Error('Module de test non initialisé');
    }
    return module.get<T>(token);
  };
  const query = (sql: string, parameters?: unknown[]) =>
    get(DataSource).query(sql, parameters);

  return {
    get,
    query,
    /** Vide toutes les tables : chaque test part d'une base vierge. */
    reset: () =>
      query(
        'TRUNCATE action_status_changes, actions, action_plans, memberships, users, organizations'
      ),
    /** Organisations A et B. */
    seedOrganizations: () =>
      query(
        `INSERT INTO organizations (id, name, created_at)
         VALUES ($1, 'Clinique A', now()), ($2, 'Clinique B', now())`,
        [ORG_A, ORG_B]
      ),
    /** Comptes Alice, Bob et Xavier : auteurs des changements d'état, retraits et suppressions. */
    seedUsers: () =>
      query(
        `INSERT INTO users (id, email, email_key, name, password_hash, must_change_password, version, created_at)
         SELECT id, email, email, 'Nom', 'hash', false, 1, now()
         FROM (VALUES ($1::uuid, 'alice@lilas.fr'), ($2::uuid, 'bob@lilas.fr'), ($3::uuid, 'xavier@lilas.fr'))
           AS seed(id, email)`,
        [ALICE, BOB, XAVIER]
      ),
    /** Plans P1 et P2 dans l'organisation A, P3 dans l'organisation B (cf. `test-ids`). */
    seedPlans: () =>
      query(
        `INSERT INTO action_plans (id, organization_id, title, version, created_at)
         VALUES ($1, $4, 'Plan 1', 1, now()), ($2, $4, 'Plan 2', 1, now()), ($3, $5, 'Plan 3', 1, now())`,
        [PLAN_1, PLAN_2, PLAN_3, ORG_A, ORG_B]
      ),
  };
}
