import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { join } from 'node:path';
import { TRANSACTION_RUNNER } from '../../shared/application/transaction-runner';
import { CLOCK, Clock } from '../../shared/domain/clock';
import { SystemClock } from '../../shared/infrastructure/system-clock';
import { useCaseProvider } from '../../shared/presentation/use-case.provider';
import { AddMember } from './application/add-member';
import { ChangePassword } from './application/change-password';
import { IdentityQueries } from './application/identity-queries';
import { Login } from './application/login';
import { Logout } from './application/logout';
import { ChangeMemberRole, RemoveMember } from './application/manage-members';
import { Register } from './application/register';
import { ResolveSession } from './application/resolve-session';
import { MEMBERSHIP_REPOSITORY } from './domain/membership.repository';
import { ORGANIZATION_REPOSITORY } from './domain/organization.repository';
import { PASSWORD_HASHER } from './domain/password-hasher';
import { PASSWORD_BLOCKLIST } from './domain/password-policy';
import { USER_REPOSITORY } from './domain/user.repository';
import { FilePasswordBlocklist } from './infrastructure/file-password-blocklist';
import { ScryptPasswordHasher } from './infrastructure/scrypt-password-hasher';
import {
  TypeOrmMembershipRepository,
  TypeOrmOrganizationRepository,
  TypeOrmUserRepository,
} from './infrastructure/typeorm/typeorm-identity.repositories';
import { AuthController } from './presentation/auth.controller';
import { authThrottling } from './presentation/auth-throttling';
import { MembersController } from './presentation/members.controller';
import { SessionCookies } from './presentation/session-cookies';

const USERS = USER_REPOSITORY;
const ORGANIZATIONS = ORGANIZATION_REPOSITORY;
const MEMBERSHIPS = MEMBERSHIP_REPOSITORY;

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { algorithm: 'HS256' },
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: authThrottling,
    }),
  ],
  controllers: [AuthController, MembersController],
  providers: [
    { provide: USERS, useClass: TypeOrmUserRepository },
    { provide: ORGANIZATIONS, useClass: TypeOrmOrganizationRepository },
    { provide: MEMBERSHIPS, useClass: TypeOrmMembershipRepository },
    { provide: CLOCK, useClass: SystemClock },
    { provide: PASSWORD_HASHER, useClass: ScryptPasswordHasher },
    {
      provide: PASSWORD_BLOCKLIST,
      // Copié à côté du code compilé par la cible build (asset), même chemin relatif qu'en source.
      useFactory: () => FilePasswordBlocklist.fromFile(join(__dirname, 'infrastructure', 'common-passwords.txt')),
    },
    {
      provide: SessionCookies,
      inject: [JwtService, CLOCK, ConfigService],
      useFactory: (jwt: JwtService, clock: Clock, config: ConfigService) =>
        new SessionCookies(jwt, clock, config.getOrThrow<boolean>('COOKIE_SECURE')),
    },
    useCaseProvider(Register, [USERS, ORGANIZATIONS, MEMBERSHIPS, PASSWORD_HASHER, PASSWORD_BLOCKLIST, TRANSACTION_RUNNER, CLOCK]),
    useCaseProvider(Login, [USERS, MEMBERSHIPS, PASSWORD_HASHER]),
    useCaseProvider(Logout, [USERS, CLOCK]),
    useCaseProvider(ChangePassword, [USERS, PASSWORD_HASHER, PASSWORD_BLOCKLIST, CLOCK]),
    useCaseProvider(ResolveSession, [USERS, MEMBERSHIPS]),
    useCaseProvider(AddMember, [USERS, MEMBERSHIPS, PASSWORD_HASHER, TRANSACTION_RUNNER, CLOCK]),
    useCaseProvider(ChangeMemberRole, [MEMBERSHIPS]),
    useCaseProvider(RemoveMember, [MEMBERSHIPS, CLOCK]),
    useCaseProvider(IdentityQueries, [USERS, ORGANIZATIONS, MEMBERSHIPS]),
  ],
  exports: [USERS, ORGANIZATIONS, MEMBERSHIPS, IdentityQueries, ResolveSession, SessionCookies],
})
export class IdentityModule {}
