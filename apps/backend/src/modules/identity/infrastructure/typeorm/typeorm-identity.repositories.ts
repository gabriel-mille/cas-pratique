import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { ConflictError } from '../../../../shared/domain/errors';
import { Role } from '../../../../shared/domain/role';
import {
  saveVersioned,
  violatedUniqueConstraint,
} from '../../../../shared/infrastructure/typeorm/versioned-save';
import { Membership } from '../../domain/membership';
import { MembershipRepository } from '../../domain/membership.repository';
import { Organization } from '../../domain/organization';
import { OrganizationRepository } from '../../domain/organization.repository';
import { User } from '../../domain/user';
import { UserRepository } from '../../domain/user.repository';
import {
  MembershipEntity,
  ONE_ACTIVE_MEMBERSHIP_PER_USER,
  OrganizationEntity,
  USERS_EMAIL_KEY_UNIQUE,
  USERS_PK,
  UserEntity,
} from './identity.orm-entities';

// Les repositories lisent et écrivent via `txHost.tx` : la transaction en cours s'il y en a une (D33).
// Type écrit en entier dans les constructeurs : SWC n'émet pas la métadonnée d'injection d'un alias de type.

@Injectable()
export class TypeOrmOrganizationRepository implements OrganizationRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>
  ) {}

  async findById(id: string): Promise<Organization | null> {
    const row = await this.txHost.tx
      .getRepository(OrganizationEntity)
      .findOneBy({ id });
    return row
      ? Organization.restore({
          id: row.id,
          name: row.name,
          createdAt: row.createdAt,
        })
      : null;
  }

  async save(organization: Organization): Promise<void> {
    await this.txHost.tx
      .getRepository(OrganizationEntity)
      .upsert(organization.snapshot(), ['id']);
  }
}

const toUser = (row: UserEntity) =>
  User.restore({
    id: row.id,
    email: row.email,
    emailKey: row.emailKey,
    name: row.name,
    passwordHash: row.passwordHash,
    mustChangePassword: row.mustChangePassword,
    sessionsValidAfter: row.sessionsValidAfter,
    version: row.version,
    createdAt: row.createdAt,
  });

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>
  ) {}

  private get rows() {
    return this.txHost.tx.getRepository(UserEntity);
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.rows.findOneBy({ id });
    return row ? toUser(row) : null;
  }

  async findByEmail(emailKey: string): Promise<User | null> {
    const row = await this.rows.findOneBy({ emailKey });
    return row ? toUser(row) : null;
  }

  async findByIds(ids: string[]): Promise<User[]> {
    return ids.length
      ? (await this.rows.findBy({ id: In(ids) })).map(toUser)
      : [];
  }

  async save(user: User): Promise<void> {
    try {
      await saveVersioned(
        this.txHost.tx,
        UserEntity,
        user.snapshot(),
        USERS_PK
      );
    } catch (error) {
      // La contrainte UNIQUE tranche les inscriptions simultanées avec le même email (D8).
      if (violatedUniqueConstraint(error) === USERS_EMAIL_KEY_UNIQUE) {
        throw new ConflictError('Cet email est déjà utilisé');
      }
      throw error;
    }
  }
}

const toMembership = (row: MembershipEntity) =>
  Membership.restore({
    id: row.id,
    organizationId: row.organizationId,
    userId: row.userId,
    role: row.role as Role,
    version: row.version,
    createdAt: row.createdAt,
    removedAt: row.removedAt,
    removedBy: row.removedBy,
  });

/** Les appartenances retirées sont exclues de toutes les lectures par `@DeleteDateColumn` (D9). */
@Injectable()
export class TypeOrmMembershipRepository implements MembershipRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>
  ) {}

  private get rows() {
    return this.txHost.tx.getRepository(MembershipEntity);
  }

  async findActiveByUser(userId: string): Promise<Membership | null> {
    const row = await this.rows.findOneBy({ userId });
    return row ? toMembership(row) : null;
  }

  async findActive(
    organizationId: string,
    userId: string
  ): Promise<Membership | null> {
    const row = await this.rows.findOneBy({ organizationId, userId });
    return row ? toMembership(row) : null;
  }

  async listActive(organizationId: string): Promise<Membership[]> {
    return (
      await this.rows.find({
        where: { organizationId },
        order: { createdAt: 'ASC' },
      })
    ).map(toMembership);
  }

  async save(membership: Membership): Promise<void> {
    try {
      await saveVersioned(
        this.txHost.tx,
        MembershipEntity,
        membership.snapshot(),
        'pk_memberships'
      );
    } catch (error) {
      if (violatedUniqueConstraint(error) === ONE_ACTIVE_MEMBERSHIP_PER_USER) {
        throw new ConflictError('Ce compte appartient déjà à une organisation');
      }
      throw error;
    }
  }
}
