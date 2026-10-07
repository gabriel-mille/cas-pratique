export const TRANSACTION_RUNNER = Symbol('TRANSACTION_RUNNER');

/**
 * Exécute un travail qui écrit plusieurs agrégats de façon atomique : tout ou rien.
 * Réservé aux créations liées (inscription : organisation, compte, appartenance), cf. D32.
 */
export interface TransactionRunner {
  run<T>(work: () => Promise<T>): Promise<T>;
}
