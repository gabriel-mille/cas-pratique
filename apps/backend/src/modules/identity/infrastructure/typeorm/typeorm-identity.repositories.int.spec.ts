import { randomUUID } from 'node:crypto';
import { ConflictError } from '../../../../shared/domain/errors';
import { Role } from '../../../../shared/domain/role';
import { useIntegrationDatabase } from '../../../../shared/testing/integration-database';
import { ALICE, BOB, ORG_A, ORG_B } from '../../../../shared/testing/test-ids';
import { Membership } from '../../domain/membership';
import {
  MEMBERSHIP_REPOSITORY,
  MembershipRepository,
} from '../../domain/membership.repository';
import { Organization } from '../../domain/organization';
import {
  ORGANIZATION_REPOSITORY,
  OrganizationRepository,
} from '../../domain/organization.repository';
import { USER_REPOSITORY, UserRepository } from '../../domain/user.repository';
import { describeMembershipRepositoryContract } from '../../testing/membership-repository.contract';
import { describeUserRepositoryContract } from '../../testing/user-repository.contract';

const db = useIntegrationDatabase();

describeUserRepositoryContract('PostgreSQL', async () => {
  await db.reset();
  return db.get<UserRepository>(USER_REPOSITORY);
});

describeMembershipRepositoryContract('PostgreSQL', async () => {
  await db.reset();
  await db.seedOrganizations();
  await db.seedUsers();
  return db.get<MembershipRepository>(MEMBERSHIP_REPOSITORY);
});

describe('OrganizationRepository (PostgreSQL)', () => {
  beforeEach(() => db.reset());

  it('enregistre puis retrouve une organisation', async () => {
    const repository = db.get<OrganizationRepository>(ORGANIZATION_REPOSITORY);
    const organization = Organization.create({
      id: ORG_A,
      name: 'Clinique des Lilas',
      createdAt: new Date('2026-10-07T10:00:00Z'),
    });
    await repository.save(organization);

    expect((await repository.findById(ORG_A))?.snapshot()).toEqual(
      organization.snapshot()
    );
    expect(await repository.findById(ORG_B)).toBeNull();
  });
});

describe('Index unique partiel des appartenances (PostgreSQL, D10)', () => {
  const join = (organizationId: string, createdAt: string) =>
    Membership.create({
      id: randomUUID(),
      organizationId,
      userId: ALICE,
      role: Role.MEMBER,
      createdAt: new Date(createdAt),
    });
  let repository: MembershipRepository;

  beforeEach(async () => {
    await db.reset();
    await db.seedOrganizations();
    await db.seedUsers();
    repository = db.get<MembershipRepository>(MEMBERSHIP_REPOSITORY);
  });

  // La base tranche deux ajouts simultanés du même compte, même dans deux organisations différentes.
  it('refuse une seconde appartenance active pour le même compte', async () => {
    await repository.save(join(ORG_A, '2026-10-07T10:00:00Z'));

    await expect(
      repository.save(join(ORG_B, '2026-10-08T10:00:00Z'))
    ).rejects.toThrow(ConflictError);
  });

  it('accepte une nouvelle appartenance une fois l’ancienne retirée', async () => {
    const first = join(ORG_A, '2026-10-07T10:00:00Z');
    await repository.save(first);
    first.remove(BOB, new Date('2026-10-08T10:00:00Z'));
    await repository.save(first);

    await repository.save(join(ORG_B, '2026-10-09T10:00:00Z'));

    expect((await repository.findActiveByUser(ALICE))?.organizationId).toBe(
      ORG_B
    );
  });
});
