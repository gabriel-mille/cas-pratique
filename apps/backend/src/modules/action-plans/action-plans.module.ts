import { Module } from '@nestjs/common';
import { ACTION_PLAN_REPOSITORY } from './domain/action-plan.repository';
import { ACTION_REPOSITORY } from './domain/action.repository';
import {
  TypeOrmActionPlanRepository,
  TypeOrmActionRepository,
} from './infrastructure/typeorm/typeorm-action-plans.repositories';

/** Ports du domaine liés à leurs implémentations PostgreSQL. Les cas d'usage s'y ajoutent avec l'API HTTP. */
@Module({
  providers: [
    { provide: ACTION_PLAN_REPOSITORY, useClass: TypeOrmActionPlanRepository },
    { provide: ACTION_REPOSITORY, useClass: TypeOrmActionRepository },
  ],
  exports: [ACTION_PLAN_REPOSITORY, ACTION_REPOSITORY],
})
export class ActionPlansModule {}
