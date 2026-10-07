import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { saveVersioned } from '../../../../shared/infrastructure/typeorm/versioned-save';
import { Action, ActionStatusChange } from '../../domain/action';
import { ActionPlan } from '../../domain/action-plan';
import { ActionPlanRepository } from '../../domain/action-plan.repository';
import { ActionStatus } from '../../domain/action-status';
import { ActionRepository } from '../../domain/action.repository';
import {
  ACTION_PLANS_PK,
  ACTIONS_PK,
  ActionEntity,
  ActionPlanEntity,
  ActionStatusChangeEntity,
} from './action-plans.orm-entities';

const toActionPlan = (row: ActionPlanEntity) =>
  ActionPlan.restore({
    id: row.id,
    organizationId: row.organizationId,
    title: row.title,
    description: row.description,
    version: row.version,
    createdAt: row.createdAt,
  });

/** Toutes les lectures sont filtrées par organisation (D30, ASVS 8.4.1). */
@Injectable()
export class TypeOrmActionPlanRepository implements ActionPlanRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>
  ) {}

  private get rows() {
    return this.txHost.tx.getRepository(ActionPlanEntity);
  }

  async findById(
    organizationId: string,
    id: string
  ): Promise<ActionPlan | null> {
    const row = await this.rows.findOneBy({ organizationId, id });
    return row ? toActionPlan(row) : null;
  }

  async findAll(organizationId: string): Promise<ActionPlan[]> {
    return (
      await this.rows.find({
        where: { organizationId },
        order: { createdAt: 'ASC' },
      })
    ).map(toActionPlan);
  }

  async save(plan: ActionPlan): Promise<void> {
    await saveVersioned(
      this.txHost.tx,
      ActionPlanEntity,
      plan.snapshot(),
      ACTION_PLANS_PK
    );
  }
}

const toChange = (row: ActionStatusChangeEntity): ActionStatusChange => ({
  from: row.fromStatus as ActionStatus,
  to: row.toStatus as ActionStatus,
  by: row.changedBy,
  at: row.changedAt,
  reason: row.reason,
});

/**
 * L'action et son historique forment un agrégat (D28) : écrits dans la même transaction.
 * Les actions supprimées sont exclues de toutes les lectures par `@DeleteDateColumn` (D7).
 */
@Injectable()
export class TypeOrmActionRepository implements ActionRepository {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>
  ) {}

  async findById(organizationId: string, id: string): Promise<Action | null> {
    const row = await this.txHost.tx
      .getRepository(ActionEntity)
      .findOneBy({ organizationId, id });
    return row ? (await this.withHistory([row]))[0] : null;
  }

  async findByPlan(organizationId: string, planId: string): Promise<Action[]> {
    const rows = await this.txHost.tx
      .getRepository(ActionEntity)
      .find({ where: { organizationId, planId }, order: { createdAt: 'ASC' } });
    return this.withHistory(rows);
  }

  async save(action: Action): Promise<void> {
    const { statusChanges, ...row } = action.snapshot();
    await this.txHost.withTransaction(async () => {
      await saveVersioned(this.txHost.tx, ActionEntity, row, ACTIONS_PK);
      if (!statusChanges.length) {
        return;
      }
      // Ajout seul : la version vient d'être vérifiée, seules les entrées nouvelles sont insérées.
      await this.txHost.tx
        .createQueryBuilder()
        .insert()
        .into(ActionStatusChangeEntity)
        .values(
          statusChanges.map((change, position) => ({
            actionId: row.id,
            position,
            fromStatus: change.from,
            toStatus: change.to,
            changedBy: change.by,
            changedAt: change.at,
            reason: change.reason,
          }))
        )
        .orIgnore()
        .execute();
    });
  }

  /** Charge l'historique de toutes les actions en une requête. */
  private async withHistory(rows: ActionEntity[]): Promise<Action[]> {
    const changes = rows.length
      ? await this.txHost.tx.getRepository(ActionStatusChangeEntity).find({
          where: { actionId: In(rows.map((row) => row.id)) },
          order: { position: 'ASC' },
        })
      : [];
    return rows.map((row) =>
      Action.restore({
        id: row.id,
        organizationId: row.organizationId,
        planId: row.planId,
        title: row.title,
        description: row.description,
        status: row.status as ActionStatus,
        version: row.version,
        createdAt: row.createdAt,
        deletedAt: row.deletedAt,
        deletedBy: row.deletedBy,
        statusChanges: changes
          .filter((change) => change.actionId === row.id)
          .map(toChange),
      })
    );
  }
}
