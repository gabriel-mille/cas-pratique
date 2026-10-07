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
import {
  DESCRIPTION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
} from '../../../../shared/domain/text';
// Seule dépendance vers `identity` : les clés étrangères de la base commune (D33). Le domaine et
// l'application d'`action-plans` n'en dépendent pas (D30).
import {
  OrganizationEntity,
  UserEntity,
} from '../../../identity/infrastructure/typeorm/identity.orm-entities';

export const ACTION_PLANS_PK = 'pk_action_plans';
export const ACTIONS_PK = 'pk_actions';

const STATUSES = `('TODO', 'IN_PROGRESS', 'TO_VALIDATE', 'DONE')`;

@Entity('action_plans')
// Cible de la clé étrangère composite des actions : une action et son plan sont dans la même organisation.
@Unique('uq_action_plans_id_organization', ['id', 'organizationId'])
// Index des lectures : PostgreSQL n'indexe pas les clés étrangères de lui-même.
@Index('ix_action_plans_organization', ['organizationId', 'createdAt'])
export class ActionPlanEntity {
  @PrimaryColumn({ type: 'uuid', primaryKeyConstraintName: ACTION_PLANS_PK })
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'organization_id',
    foreignKeyConstraintName: 'fk_action_plans_organization',
  })
  organization?: OrganizationEntity;

  @Column({ type: 'varchar', length: TITLE_MAX_LENGTH })
  title!: string;

  @Column({ type: 'varchar', length: DESCRIPTION_MAX_LENGTH, nullable: true })
  description!: string | null;

  @VersionColumn()
  version!: number;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

@Entity('actions')
@Check('ck_actions_status', `"status" IN ${STATUSES}`)
@Index('ix_actions_plan', ['organizationId', 'planId', 'createdAt'])
export class ActionEntity {
  @PrimaryColumn({ type: 'uuid', primaryKeyConstraintName: ACTIONS_PK })
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Column({ name: 'plan_id', type: 'uuid' })
  planId!: string;

  @ManyToOne(() => ActionPlanEntity, { onDelete: 'RESTRICT' })
  @JoinColumn([
    {
      name: 'plan_id',
      referencedColumnName: 'id',
      foreignKeyConstraintName: 'fk_actions_plan_same_organization',
    },
    { name: 'organization_id', referencedColumnName: 'organizationId' },
  ])
  plan?: ActionPlanEntity;

  @Column({ type: 'varchar', length: TITLE_MAX_LENGTH })
  title!: string;

  @Column({ type: 'varchar', length: DESCRIPTION_MAX_LENGTH, nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 20 })
  status!: string;

  @VersionColumn()
  version!: number;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  /** Suppression logique (D7) : exclue de toutes les lectures par TypeORM. */
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy!: string | null;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'deleted_by',
    foreignKeyConstraintName: 'fk_actions_deleted_by',
  })
  deleter?: UserEntity;
}

/** Historique des changements d'état (D5), en ajout seul : une ligne n'est jamais modifiée. */
@Entity('action_status_changes')
@Check('ck_action_status_changes_from', `"from_status" IN ${STATUSES}`)
@Check('ck_action_status_changes_to', `"to_status" IN ${STATUSES}`)
export class ActionStatusChangeEntity {
  @PrimaryColumn({
    name: 'action_id',
    type: 'uuid',
    primaryKeyConstraintName: 'pk_action_status_changes',
  })
  actionId!: string;

  /** Rang dans l'historique de l'action, à partir de 0. */
  @PrimaryColumn({
    type: 'integer',
    primaryKeyConstraintName: 'pk_action_status_changes',
  })
  position!: number;

  @ManyToOne(() => ActionEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'action_id',
    foreignKeyConstraintName: 'fk_action_status_changes_action',
  })
  action?: ActionEntity;

  @Column({ name: 'from_status', type: 'varchar', length: 20 })
  fromStatus!: string;

  @Column({ name: 'to_status', type: 'varchar', length: 20 })
  toStatus!: string;

  @Column({ name: 'changed_by', type: 'uuid' })
  changedBy!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'changed_by',
    foreignKeyConstraintName: 'fk_action_status_changes_changed_by',
  })
  changer?: UserEntity;

  @Column({ name: 'changed_at', type: 'timestamptz' })
  changedAt!: Date;

  /** Motif d'un refus de validation (D4). */
  @Column({ type: 'text', nullable: true })
  reason!: string | null;
}

export const ACTION_PLANS_ENTITIES = [
  ActionPlanEntity,
  ActionEntity,
  ActionStatusChangeEntity,
];
