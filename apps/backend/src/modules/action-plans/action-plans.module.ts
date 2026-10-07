import { Module } from '@nestjs/common';
import { CLOCK } from '../../shared/domain/clock';
import { SystemClock } from '../../shared/infrastructure/system-clock';
import { useCaseProvider } from '../../shared/presentation/use-case.provider';
import { IdentityQueries } from '../identity/application/identity-queries';
import { IdentityModule } from '../identity/identity.module';
import { ActionPlanQueries } from './application/action-plan-queries';
import { AddAction } from './application/add-action';
import { AUTHOR_DIRECTORY, AuthorDirectory } from './application/author-directory';
import { ChangeActionStatus } from './application/change-action-status';
import { CreateActionPlan } from './application/create-action-plan';
import { DeleteAction } from './application/delete-action';
import { RejectValidation } from './application/reject-validation';
import { UpdateAction } from './application/update-action';
import { UpdateActionPlan } from './application/update-action-plan';
import { ACTION_PLAN_REPOSITORY } from './domain/action-plan.repository';
import { ACTION_REPOSITORY } from './domain/action.repository';
import {
  TypeOrmActionPlanRepository,
  TypeOrmActionRepository,
} from './infrastructure/typeorm/typeorm-action-plans.repositories';
import { ActionPlansController } from './presentation/action-plans.controller';
import { ActionsController } from './presentation/actions.controller';

const PLANS = ACTION_PLAN_REPOSITORY;
const ACTIONS = ACTION_REPOSITORY;

@Module({
  // Seul le câblage connaît `identity` (noms des auteurs) : domaine et cas d'usage l'ignorent (D30, D34).
  imports: [IdentityModule],
  controllers: [ActionPlansController, ActionsController],
  providers: [
    { provide: PLANS, useClass: TypeOrmActionPlanRepository },
    { provide: ACTIONS, useClass: TypeOrmActionRepository },
    { provide: CLOCK, useClass: SystemClock },
    {
      provide: AUTHOR_DIRECTORY,
      inject: [IdentityQueries],
      useFactory: (identity: IdentityQueries): AuthorDirectory => ({ namesOf: (ids) => identity.userNames(ids) }),
    },
    useCaseProvider(ActionPlanQueries, [PLANS, ACTIONS, AUTHOR_DIRECTORY]),
    useCaseProvider(CreateActionPlan, [PLANS, CLOCK]),
    useCaseProvider(UpdateActionPlan, [PLANS]),
    useCaseProvider(AddAction, [PLANS, ACTIONS, CLOCK]),
    useCaseProvider(UpdateAction, [ACTIONS]),
    useCaseProvider(ChangeActionStatus, [ACTIONS, CLOCK]),
    useCaseProvider(RejectValidation, [ACTIONS, CLOCK]),
    useCaseProvider(DeleteAction, [ACTIONS, CLOCK]),
  ],
  exports: [PLANS, ACTIONS],
})
export class ActionPlansModule {}
