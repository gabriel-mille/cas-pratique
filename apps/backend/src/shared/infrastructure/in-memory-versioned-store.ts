import { StaleVersionError } from '../domain/errors';

export interface VersionedRow {
  id: string;
  version: number;
  createdAt: Date;
}

/**
 * Table en mémoire avec verrou optimiste (D14), partagée par les repositories en mémoire (D29).
 * Insertion en version 1, puis chaque mise à jour exige la version stockée et l'incrémente,
 * comme l'update conditionnel `WHERE id = ? AND version = ?` de l'implémentation PostgreSQL.
 */
export class InMemoryVersionedStore<Row extends VersionedRow> {
  private readonly rows = new Map<string, Row>();

  find(id: string): Row | undefined {
    return this.rows.get(id);
  }

  /** Lignes qui vérifient le prédicat, par date de création. */
  where(predicate: (row: Row) => boolean): Row[] {
    return [...this.rows.values()].filter(predicate).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  save(row: Row): void {
    const stored = this.rows.get(row.id);
    if (stored && stored.version !== row.version) {
      throw new StaleVersionError(`${row.id} a été modifié entre-temps`);
    }
    this.rows.set(row.id, stored ? { ...row, version: row.version + 1 } : row);
  }

  /** Place une ligne telle quelle, sans contrôle de version (préparation des tests). */
  seed(row: Row): void {
    this.rows.set(row.id, row);
  }
}

/** Table dont chaque ligne appartient à une organisation : les lectures sont filtrées par organisation. */
export class InMemoryTenantStore<Row extends VersionedRow & { organizationId: string }> extends InMemoryVersionedStore<Row> {
  get(organizationId: string, id: string): Row | undefined {
    const row = this.find(id);
    return row?.organizationId === organizationId ? row : undefined;
  }

  list(organizationId: string): Row[] {
    return this.where((row) => row.organizationId === organizationId);
  }
}
