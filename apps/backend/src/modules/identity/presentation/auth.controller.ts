import { Body, Controller, HttpCode, HttpStatus, Inject, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import type { Actor } from '../../../shared/domain/actor';
import { CLOCK, type Clock } from '../../../shared/domain/clock';
import { AuthenticationError } from '../../../shared/domain/errors';
import { CurrentActor } from '../../../shared/presentation/authenticated-request';
import { securityLog } from '../../../shared/presentation/security-log';
import { ChangePassword } from '../application/change-password';
import { Login, LoginResult } from '../application/login';
import { Logout } from '../application/logout';
import { Register } from '../application/register';
import { ChangePasswordRequest, LoginRequest, RegisterRequest, SessionResponse } from './identity.dto';
import { AllowsPendingPasswordChange, Public } from './route-access';
import { SessionCookies } from './session-cookies';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly register: Register,
    private readonly login: Login,
    private readonly logout: Logout,
    private readonly changePassword: ChangePassword,
    private readonly sessions: SessionCookies,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** US1 : crée l'organisation et son administrateur, puis le connecte. */
  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('register')
  @ApiCreatedResponse({ type: SessionResponse })
  async signUp(@Body() body: RegisterRequest, @Res({ passthrough: true }) response: Response): Promise<SessionResponse> {
    const { userId } = await this.register.execute(body);
    await this.sessions.issue(response, userId, this.clock.now());
    return { mustChangePassword: false };
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: SessionResponse })
  async signIn(
    @Body() body: LoginRequest,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SessionResponse> {
    let result: LoginResult;
    try {
      result = await this.login.execute(body);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        securityLog.loginFailed(request.ip);
      }
      throw error;
    }
    securityLog.loginSucceeded(result.userId, result.organizationId, request.ip);
    await this.sessions.issue(response, result.userId, this.clock.now());
    return { mustChangePassword: result.mustChangePassword };
  }

  /** Invalide toutes les sessions du compte (ASVS 7.4.1), pas seulement ce cookie. */
  @AllowsPendingPasswordChange()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async signOut(@CurrentActor() actor: Actor, @Res({ passthrough: true }) response: Response): Promise<void> {
    await this.logout.execute(actor.userId);
    this.sessions.clear(response);
  }

  /** Ferme les autres sessions (D8) et en rouvre une pour ce navigateur. */
  @AllowsPendingPasswordChange()
  @UseGuards(ThrottlerGuard)
  @Post('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async updatePassword(
    @CurrentActor() actor: Actor,
    @Body() body: ChangePasswordRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.changePassword.execute({ userId: actor.userId, ...body });
    await this.sessions.issue(response, actor.userId, this.clock.now());
  }
}
