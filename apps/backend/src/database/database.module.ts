import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { DynamicModule, Global, Module } from '@nestjs/common';
import {
  getDataSourceToken,
  TypeOrmModule,
  TypeOrmModuleAsyncOptions,
} from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { TRANSACTION_RUNNER } from '../shared/application/transaction-runner';
import { TypeOrmTransactionRunner } from '../shared/infrastructure/typeorm/typeorm-transaction-runner';

export type DatabaseModuleOptions = Pick<
  TypeOrmModuleAsyncOptions,
  'inject' | 'useFactory'
>;

/**
 * Connexion PostgreSQL et transactions propagées par `nestjs-cls` (D33) :
 * `TransactionHost` est fourni globalement aux repositories, `TRANSACTION_RUNNER` aux cas d'usage.
 */
@Global()
@Module({})
export class DatabaseModule {
  static forRoot(options: DatabaseModuleOptions): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRootAsync(options),
        ClsModule.forRoot({
          global: true,
          plugins: [
            new ClsPluginTransactional({
              imports: [TypeOrmModule],
              adapter: new TransactionalAdapterTypeOrm({
                dataSourceToken: getDataSourceToken(),
              }),
            }),
          ],
        }),
      ],
      providers: [
        { provide: TRANSACTION_RUNNER, useClass: TypeOrmTransactionRunner },
      ],
      exports: [TRANSACTION_RUNNER],
    };
  }
}
