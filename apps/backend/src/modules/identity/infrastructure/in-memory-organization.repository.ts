import { Organization, OrganizationProps } from '../domain/organization';
import { OrganizationRepository } from '../domain/organization.repository';

export class InMemoryOrganizationRepository implements OrganizationRepository {
  private readonly rows = new Map<string, OrganizationProps>();

  async findById(id: string): Promise<Organization | null> {
    const row = this.rows.get(id);
    return row ? Organization.restore(row) : null;
  }

  async save(organization: Organization): Promise<void> {
    this.rows.set(organization.id, organization.snapshot());
  }
}
