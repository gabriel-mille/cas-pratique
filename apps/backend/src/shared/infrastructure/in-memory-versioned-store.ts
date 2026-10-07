import { StaleVersionError } from '../domain/errors';

export interface VersionedRow {
  id: string;
  organizationId: string;
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

  get(organizationId: string, id: string): Row | undefined {
    const row = this.rows.get(id);
    return row?.organizationId === organizationId ? row : undefined;
  }

  /** Lignes de l'organisation, par date de création. */
  list(organizationId: string): Row[] {
    return [...this.rows.values()]
      .filter((row) => row.organizationId === organizationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
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
