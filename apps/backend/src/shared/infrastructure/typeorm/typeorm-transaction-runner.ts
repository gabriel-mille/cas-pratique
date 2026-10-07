import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { Injectable } from '@nestjs/common';
import { TransactionRunner } from '../../application/transaction-runner';

/**
 * Transaction PostgreSQL propagée par `@nestjs-cls/transactional` (D33) : les repositories
 * écrivent via `txHost.tx`, qui désigne la transaction en cours s'il y en a une.
 */
@Injectable()
export class TypeOrmTransactionRunner implements TransactionRunner {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>
  ) {}

  run<T>(work: () => Promise<T>): Promise<T> {
    return this.txHost.withTransaction(work);
  }
}
