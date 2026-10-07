import { Membership } from './membership';

export const MEMBERSHIP_REPOSITORY = Symbol('MEMBERSHIP_REPOSITORY');

/** Les appartenances retirées sont exclues de toutes les lectures (D9). */
export interface MembershipRepository {
  /** Appartenance active du compte. Un compte n'a qu'une organisation en v1 (D10). */
  findActiveByUser(userId: string): Promise<Membership | null>;
  findActive(organizationId: string, userId: string): Promise<Membership | null>;
  listActive(organizationId: string): Promise<Membership[]>;
  save(membership: Membership): Promise<void>;
}
