import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import type { TestProject } from 'vitest/node';
import {
  DatabaseSettings,
  typeOrmOptions,
} from '../../database/typeorm-options';

declare module 'vitest' {
  export interface ProvidedContext {
    database: DatabaseSettings;
  }
}

let container: StartedPostgreSqlContainer | undefined;

/** Démarre un PostgreSQL 16 jetable et lui applique les migrations, comme au démarrage de l'application. */
export async function setup(project: TestProject) {
  container = await new PostgreSqlContainer('postgres:16-alpine').start();
  const settings: DatabaseSettings = {
    host: container.getHost(),
    port: container.getPort(),
    username: container.getUsername(),
    password: container.getPassword(),
    database: container.getDatabase(),
  };
  const dataSource = await new DataSource(
    typeOrmOptions(settings)
  ).initialize();
  await dataSource.runMigrations();
  await dataSource.destroy();
  project.provide('database', settings);
}

export async function teardown() {
  await container?.stop();
}
