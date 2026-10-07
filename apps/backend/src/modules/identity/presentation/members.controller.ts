import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Req } from '@nestjs/common';
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Actor } from '../../../shared/domain/actor';
import { type AuthenticatedRequest, CurrentActor } from '../../../shared/presentation/authenticated-request';
import { AddMember } from '../application/add-member';
import { IdentityQueries } from '../application/identity-queries';
import { ChangeMemberRole, RemoveMember } from '../application/manage-members';
import {
  AddedMemberResponse,
  AddMemberRequest,
  ChangeRoleRequest,
  CurrentMemberResponse,
  MemberResponse,
} from './identity.dto';
import { AllowsPendingPasswordChange } from './route-access';

@ApiTags('members')
@Controller()
export class MembersController {
  constructor(
    private readonly queries: IdentityQueries,
    private readonly addMember: AddMember,
    private readonly changeMemberRole: ChangeMemberRole,
    private readonly removeMember: RemoveMember,
  ) {}

  /** Le membre connecté : le front s'en sert pour savoir s'il est connecté et ce qu'il peut faire. */
  @AllowsPendingPasswordChange()
  @Get('me')
  @ApiOkResponse({ type: CurrentMemberResponse })
  async me(@CurrentActor() actor: Actor, @Req() request: AuthenticatedRequest): Promise<CurrentMemberResponse> {
    return { ...(await this.queries.currentMember(actor)), mustChangePassword: request.mustChangePassword ?? false };
  }

  @Get('members')
  @ApiOkResponse({ type: [MemberResponse] })
  list(@CurrentActor() actor: Actor): Promise<MemberResponse[]> {
    return this.queries.listMembers(actor);
  }

  @Post('members')
  @ApiCreatedResponse({ type: AddedMemberResponse })
  add(@CurrentActor() actor: Actor, @Body() body: AddMemberRequest): Promise<AddedMemberResponse> {
    return this.addMember.execute({ actor, ...body });
  }

  @Patch('members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  changeRole(
    @CurrentActor() actor: Actor,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: ChangeRoleRequest,
  ): Promise<void> {
    return this.changeMemberRole.execute({ actor, userId, role: body.role });
  }

  @Delete('members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@CurrentActor() actor: Actor, @Param('userId', ParseUUIDPipe) userId: string): Promise<void> {
    return this.removeMember.execute({ actor, userId });
  }
}
