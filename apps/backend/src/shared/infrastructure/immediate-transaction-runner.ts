import { TransactionRunner } from '../application/transaction-runner';

/** Pour les repositories en mémoire (D29) : pas de transaction. L'atomicité est testée sur PostgreSQL. */
export class ImmediateTransactionRunner implements TransactionRunner {
  run<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }
}
