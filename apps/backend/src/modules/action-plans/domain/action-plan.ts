import { optionalDescription, requireTitle } from '../../../shared/domain/text';

export interface ActionPlanProps {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  version: number;
  createdAt: Date;
}

export type NewActionPlanProps = Omit<ActionPlanProps, 'version'>;

/** Agrégat (D6, D28) : le plan ne contient pas ses actions, qui le référencent par id. */
export class ActionPlan {
  private constructor(private readonly props: ActionPlanProps) {}

  static create(props: NewActionPlanProps): ActionPlan {
    return new ActionPlan({
      ...props,
      title: requireTitle(props.title),
      description: optionalDescription(props.description),
      version: 1,
    });
  }

  static restore(props: ActionPlanProps): ActionPlan {
    return new ActionPlan({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get version(): number {
    return this.props.version;
  }

  snapshot(): ActionPlanProps {
    return { ...this.props };
  }

  edit(title: string, description: string | null): void {
    const validTitle = requireTitle(title);
    this.props.description = optionalDescription(description);
    this.props.title = validTitle;
  }
}
