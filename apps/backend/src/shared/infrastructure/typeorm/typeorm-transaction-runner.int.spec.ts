import { Organization } from '../../../modules/identity/domain/organization';
import {
  ORGANIZATION_REPOSITORY,
  OrganizationRepository,
} from '../../../modules/identity/domain/organization.repository';
import {
  TRANSACTION_RUNNER,
  TransactionRunner,
} from '../../application/transaction-runner';
import { useIntegrationDatabase } from '../../testing/integration-database';
import { ORG_A, ORG_B } from '../../testing/test-ids';

const db = useIntegrationDatabase();

describe('TypeOrmTransactionRunner (PostgreSQL)', () => {
  const organization = (id: string) =>
    Organization.create({
      id,
      name: 'Clinique',
      createdAt: new Date('2026-10-07T10:00:00Z'),
    });
  let runner: TransactionRunner;
  let organizations: OrganizationRepository;

  beforeEach(async () => {
    await db.reset();
    runner = db.get<TransactionRunner>(TRANSACTION_RUNNER);
    organizations = db.get<OrganizationRepository>(ORGANIZATION_REPOSITORY);
  });

  it('valide toutes les écritures du travail', async () => {
    await runner.run(async () => {
      await organizations.save(organization(ORG_A));
      await organizations.save(organization(ORG_B));
    });

    expect(await organizations.findById(ORG_A)).not.toBeNull();
    expect(await organizations.findById(ORG_B)).not.toBeNull();
  });

  // Inscription (D32) : un échec après la création de l'organisation ne doit rien laisser en base.
  it('annule toutes les écritures si le travail échoue', async () => {
    const failure = new Error('échec après la première écriture');

    await expect(
      runner.run(async () => {
        await organizations.save(organization(ORG_A));
        throw failure;
      })
    ).rejects.toBe(failure);

    expect(await organizations.findById(ORG_A)).toBeNull();
  });
});
