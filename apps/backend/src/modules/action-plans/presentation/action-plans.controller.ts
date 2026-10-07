import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Res } from '@nestjs/common';
import { ApiCreatedResponse, ApiHeader, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type { Actor } from '../../../shared/domain/actor';
import { CurrentActor } from '../../../shared/presentation/authenticated-request';
import { IF_MATCH_HEADER, IfMatch, withVersion } from '../../../shared/presentation/version-precondition';
import { ActionPlanQueries } from '../application/action-plan-queries';
import { AddAction } from '../application/add-action';
import { CreateActionPlan } from '../application/create-action-plan';
import { UpdateActionPlan } from '../application/update-action-plan';
import { ActionDetailResponse, ActionPlanResponse, ActionResponse, TitledRequest } from './action-plans.dto';

@ApiTags('action-plans')
@Controller('action-plans')
export class ActionPlansController {
  constructor(
    private readonly queries: ActionPlanQueries,
    private readonly createPlan: CreateActionPlan,
    private readonly updatePlan: UpdateActionPlan,
    private readonly addAction: AddAction,
  ) {}

  @Get()
  @ApiOkResponse({ type: [ActionPlanResponse] })
  list(@CurrentActor() actor: Actor): Promise<ActionPlanResponse[]> {
    return this.queries.listPlans(actor);
  }

  @Post()
  @ApiCreatedResponse({ type: ActionPlanResponse })
  async create(
    @CurrentActor() actor: Actor,
    @Body() body: TitledRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ActionPlanResponse> {
    const id = await this.createPlan.execute({ actor, title: body.title, description: body.description ?? null });
    response.location(`/api/action-plans/${id}`);
    return withVersion(response, await this.queries.getPlan(actor, id));
  }

  @Get(':planId')
  @ApiOkResponse({ type: ActionPlanResponse })
  async get(
    @CurrentActor() actor: Actor,
    @Param('planId', ParseUUIDPipe) planId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ActionPlanResponse> {
    return withVersion(response, await this.queries.getPlan(actor, planId));
  }

  @Put(':planId')
  @ApiHeader(IF_MATCH_HEADER)
  @ApiOkResponse({ type: ActionPlanResponse })
  async update(
    @CurrentActor() actor: Actor,
    @Param('planId', ParseUUIDPipe) planId: string,
    @IfMatch() expectedVersion: number,
    @Body() body: TitledRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ActionPlanResponse> {
    await this.updatePlan.execute({
      actor,
      planId,
      title: body.title,
      description: body.description ?? null,
      expectedVersion,
    });
    return withVersion(response, await this.queries.getPlan(actor, planId));
  }

  @Get(':planId/actions')
  @ApiOkResponse({ type: [ActionResponse] })
  listActions(@CurrentActor() actor: Actor, @Param('planId', ParseUUIDPipe) planId: string): Promise<ActionResponse[]> {
    return this.queries.listPlanActions(actor, planId);
  }

  @Post(':planId/actions')
  @ApiCreatedResponse({ type: ActionDetailResponse })
  async createAction(
    @CurrentActor() actor: Actor,
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() body: TitledRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ActionDetailResponse> {
    const id = await this.addAction.execute({ actor, planId, title: body.title, description: body.description ?? null });
    response.location(`/api/actions/${id}`);
    return withVersion(response, await this.queries.getActionDetail(actor, id));
  }
}
