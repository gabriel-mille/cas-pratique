import { Module } from '@nestjs/common';
import { MEMBERSHIP_REPOSITORY } from './domain/membership.repository';
import { ORGANIZATION_REPOSITORY } from './domain/organization.repository';
import { USER_REPOSITORY } from './domain/user.repository';
import {
  TypeOrmMembershipRepository,
  TypeOrmOrganizationRepository,
  TypeOrmUserRepository,
} from './infrastructure/typeorm/typeorm-identity.repositories';

/** Ports du domaine liés à leurs implémentations PostgreSQL. Les cas d'usage s'y ajoutent avec l'API HTTP. */
@Module({
  providers: [
    { provide: USER_REPOSITORY, useClass: TypeOrmUserRepository },
    { provide: ORGANIZATION_REPOSITORY, useClass: TypeOrmOrganizationRepository },
    { provide: MEMBERSHIP_REPOSITORY, useClass: TypeOrmMembershipRepository },
  ],
  exports: [USER_REPOSITORY, ORGANIZATION_REPOSITORY, MEMBERSHIP_REPOSITORY],
})
export class IdentityModule {}
