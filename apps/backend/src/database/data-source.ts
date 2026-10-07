import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { databaseSettingsFromEnv, typeOrmOptions } from './typeorm-options';

/** DataSource de la CLI TypeORM (`nx run backend:migration-*`), lancée sur le build. */
export default new DataSource(
  typeOrmOptions(databaseSettingsFromEnv(process.env))
);
