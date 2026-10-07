import {
  Check,
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
  VersionColumn,
} from 'typeorm';
import { NAME_MAX_LENGTH } from '../../../../shared/domain/text';
import { EMAIL_MAX_LENGTH } from '../../domain/email';

// Entités de persistance, distinctes des agrégats du domaine (mappers dans les repositories).
// Les contraintes portent des noms fixes : les erreurs PostgreSQL sont traduites d'après ce nom.

export const USERS_PK = 'pk_users';
export const USERS_EMAIL_KEY_UNIQUE = 'uq_users_email_key';
export const ONE_ACTIVE_MEMBERSHIP_PER_USER = 'uq_memberships_active_user';

@Entity('organizations')
export class OrganizationEntity {
  @PrimaryColumn({ type: 'uuid', primaryKeyConstraintName: 'pk_organizations' })
  id!: string;

  @Column({ type: 'varchar', length: NAME_MAX_LENGTH })
  name!: string;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

@Entity('users')
@Unique(USERS_EMAIL_KEY_UNIQUE, ['emailKey'])
export class UserEntity {
  @PrimaryColumn({ type: 'uuid', primaryKeyConstraintName: USERS_PK })
  id!: string;

  @Column({ type: 'varchar', length: EMAIL_MAX_LENGTH })
  email!: string;

  /** Forme de comparaison de l'email, unique (D8, D32). */
  @Column({ name: 'email_key', type: 'varchar', length: EMAIL_MAX_LENGTH })
  emailKey!: string;

  @Column({ type: 'varchar', length: NAME_MAX_LENGTH })
  name!: string;

  @Column({ name: 'password_hash', type: 'text' })
  passwordHash!: string;

  @Column({ name: 'must_change_password', type: 'boolean' })
  mustChangePassword!: boolean;

  @Column({ name: 'sessions_valid_after', type: 'timestamptz', nullable: true })
  sessionsValidAfter!: Date | null;

  @VersionColumn()
  version!: number;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

@Entity('memberships')
@Check('ck_memberships_role', `"role" IN ('MEMBER', 'MANAGER', 'ADMIN')`)
// Une seule appartenance active par compte (D10) : garantie par la base, pas seulement par le code.
@Index(ONE_ACTIVE_MEMBERSHIP_PER_USER, ['userId'], {
  unique: true,
  where: '"removed_at" IS NULL',
})
@Index('ix_memberships_organization', ['organizationId', 'createdAt'])
export class MembershipEntity {
  @PrimaryColumn({ type: 'uuid', primaryKeyConstraintName: 'pk_memberships' })
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'organization_id',
    foreignKeyConstraintName: 'fk_memberships_organization',
  })
  organization?: OrganizationEntity;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'fk_memberships_user',
  })
  user?: UserEntity;

  @Column({ type: 'varchar', length: 20 })
  role!: string;

  @VersionColumn()
  version!: number;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  /** Retrait (D9) : exclu des lectures par TypeORM, comme une suppression logique. */
  @DeleteDateColumn({ name: 'removed_at', type: 'timestamptz', nullable: true })
  removedAt!: Date | null;

  @Column({ name: 'removed_by', type: 'uuid', nullable: true })
  removedBy!: string | null;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'removed_by',
    foreignKeyConstraintName: 'fk_memberships_removed_by',
  })
  remover?: UserEntity;
}

export const IDENTITY_ENTITIES = [
  OrganizationEntity,
  UserEntity,
  MembershipEntity,
];
