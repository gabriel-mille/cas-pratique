import { requireName } from '../../../shared/domain/text';

export interface OrganizationProps {
  id: string;
  name: string;
  createdAt: Date;
}

/** Établissement client, créé à l'inscription de son premier administrateur (US1). */
export class Organization {
  private constructor(private readonly props: OrganizationProps) {}

  static create(props: OrganizationProps): Organization {
    return new Organization({ ...props, name: requireName(props.name, 'Le nom de l’organisation') });
  }

  static restore(props: OrganizationProps): Organization {
    return new Organization({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  snapshot(): OrganizationProps {
    return { ...this.props };
  }
}
