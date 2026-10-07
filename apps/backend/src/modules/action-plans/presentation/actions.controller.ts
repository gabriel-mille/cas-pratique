import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Put, Res } from '@nestjs/common';
import { ApiHeader, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type { Actor } from '../../../shared/domain/actor';
import { CurrentActor } from '../../../shared/presentation/authenticated-request';
import { IF_MATCH_HEADER, IfMatch, withVersion } from '../../../shared/presentation/version-precondition';
import { ActionPlanQueries } from '../application/action-plan-queries';
import { ChangeActionStatus } from '../application/change-action-status';
import { DeleteAction } from '../application/delete-action';
import { RejectValidation } from '../application/reject-validation';
import { UpdateAction } from '../application/update-action';
import { ActionDetailResponse, ChangeStatusRequest, RejectionRequest, TitledRequest } from './action-plans.dto';

/** Chaque écriture exige la version lue (If-Match) et rend la nouvelle avec son ETag (D14). */
@ApiTags('actions')
@Controller('actions')
export class ActionsController {
  constructor(
    private readonly queries: ActionPlanQueries,
    private readonly updateAction: UpdateAction,
    private readonly changeStatus: ChangeActionStatus,
    private readonly rejectValidation: RejectValidation,
    private readonly deleteAction: DeleteAction,
  ) {}

  @Get(':actionId')
  @ApiOkResponse({ type: ActionDetailResponse })
  async get(
    @CurrentActor() actor: Actor,
    @Param('actionId', ParseUUIDPipe) actionId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ActionDetailResponse> {
    return withVersion(response, await this.queries.getActionDetail(actor, actionId));
  }

  @Put(':actionId')
  @ApiHeader(IF_MATCH_HEADER)
  @ApiOkResponse({ type: ActionDetailResponse })
  async update(
    @CurrentActor() actor: Actor,
    @Param('actionId', ParseUUIDPipe) actionId: string,
    @IfMatch() expectedVersion: number,
    @Body() body: TitledRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ActionDetailResponse> {
    await this.updateAction.execute({
      actor,
      actionId,
      title: body.title,
      description: body.description ?? null,
      expectedVersion,
    });
    return withVersion(response, await this.queries.getActionDetail(actor, actionId));
  }

  @Post(':actionId/status')
  @HttpCode(HttpStatus.OK)
  @ApiHeader(IF_MATCH_HEADER)
  @ApiOkResponse({ type: ActionDetailResponse })
  async transition(
    @CurrentActor() actor: Actor,
    @Param('actionId', ParseUUIDPipe) actionId: string,
    @IfMatch() expectedVersion: number,
    @Body() body: ChangeStatusRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ActionDetailResponse> {
    await this.changeStatus.execute({ actor, actionId, to: body.to, expectedVersion });
    return withVersion(response, await this.queries.getActionDetail(actor, actionId));
  }

  /** Refus de validation, motif obligatoire (D4). */
  @Post(':actionId/rejection')
  @HttpCode(HttpStatus.OK)
  @ApiHeader(IF_MATCH_HEADER)
  @ApiOkResponse({ type: ActionDetailResponse })
  async reject(
    @CurrentActor() actor: Actor,
    @Param('actionId', ParseUUIDPipe) actionId: string,
    @IfMatch() expectedVersion: number,
    @Body() body: RejectionRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ActionDetailResponse> {
    await this.rejectValidation.execute({ actor, actionId, reason: body.reason, expectedVersion });
    return withVersion(response, await this.queries.getActionDetail(actor, actionId));
  }

  @Delete(':actionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiHeader(IF_MATCH_HEADER)
  @ApiNoContentResponse()
  remove(
    @CurrentActor() actor: Actor,
    @Param('actionId', ParseUUIDPipe) actionId: string,
    @IfMatch() expectedVersion: number,
  ): Promise<void> {
    return this.deleteAction.execute({ actor, actionId, expectedVersion });
  }
}
