import {
  EntityManager,
  EntityTarget,
  ObjectLiteral,
  QueryFailedError,
} from 'typeorm';
import { StaleVersionError } from '../../domain/errors';

/** Code SQLSTATE `unique_violation` (doc PostgreSQL, annexe A). */
const UNIQUE_VIOLATION = '23505';

/** Nom de la contrainte d'unicité violée, ou `null` si l'erreur n'en est pas une. */
export function violatedUniqueConstraint(error: unknown): string | null {
  if (!(error instanceof QueryFailedError)) {
    return null;
  }
  const driverError = error.driverError as {
    code?: string;
    constraint?: string;
  };
  return driverError.code === UNIQUE_VIOLATION
    ? driverError.constraint ?? ''
    : null;
}

/**
 * Verrou optimiste (D14, D24) : TypeORM ne vérifie pas la version à l'écriture, d'où l'update conditionnel.
 * - Mise à jour `WHERE id = :id AND version = :version` ; `@VersionColumn` incrémente la version.
 * - Si aucune ligne n'est touchée et que l'agrégat est en version 1, c'est une création : insertion.
 *   Une clé primaire déjà prise signifie qu'un autre l'a créé entre-temps : version périmée.
 * Même comportement que `InMemoryVersionedStore`, vérifié par les contrats de repository.
 */
export async function saveVersioned<
  Row extends ObjectLiteral & { id: string; version: number }
>(
  manager: EntityManager,
  target: EntityTarget<Row>,
  row: Row,
  primaryKeyConstraint: string
): Promise<void> {
  const { id, version, ...changes } = row;
  const updated = await manager
    .createQueryBuilder()
    .update(target)
    .set(changes as never)
    .where('id = :id AND version = :version', { id, version })
    .execute();
  if (updated.affected) {
    return;
  }
  if (version !== 1) {
    throw new StaleVersionError(`${id} a été modifié entre-temps`);
  }
  try {
    await manager
      .createQueryBuilder()
      .insert()
      .into(target)
      .values(row)
      .execute();
  } catch (error) {
    if (violatedUniqueConstraint(error) === primaryKeyConstraint) {
      throw new StaleVersionError(`${id} a été modifié entre-temps`);
    }
    throw error;
  }
}
