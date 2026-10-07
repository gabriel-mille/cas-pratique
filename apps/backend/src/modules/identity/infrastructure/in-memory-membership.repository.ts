import { InMemoryTenantStore } from '../../../shared/infrastructure/in-memory-versioned-store';
import { Membership, MembershipProps } from '../domain/membership';
import { MembershipRepository } from '../domain/membership.repository';

/** Implémentation en mémoire (D29). Les appartenances retirées restent stockées mais ne sont jamais lues. */
export class InMemoryMembershipRepository implements MembershipRepository {
  private readonly store = new InMemoryTenantStore<MembershipProps>();

  async findActiveByUser(userId: string): Promise<Membership | null> {
    const [row] = this.store.where((membership) => membership.userId === userId && !membership.removedAt);
    return row ? Membership.restore(row) : null;
  }

  async findActive(organizationId: string, userId: string): Promise<Membership | null> {
    const row = this.store
      .list(organizationId)
      .find((membership) => membership.userId === userId && !membership.removedAt);
    return row ? Membership.restore(row) : null;
  }

  async listActive(organizationId: string): Promise<Membership[]> {
    return this.store
      .list(organizationId)
      .filter((membership) => !membership.removedAt)
      .map((row) => Membership.restore(row));
  }

  async save(membership: Membership): Promise<void> {
    this.store.save(membership.snapshot());
  }

  /** Ligne stockée, retirée ou non : vérifie que le retrait est tracé (tests). */
  stored(organizationId: string, id: string): MembershipProps | undefined {
    return this.store.get(organizationId, id);
  }
}
