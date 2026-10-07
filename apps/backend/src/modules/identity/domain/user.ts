import { requireName } from '../../../shared/domain/text';
import { Email } from './email';

export interface UserProps {
  id: string;
  /** Adresse saisie, pour l'affichage. */
  email: string;
  /** Forme de comparaison, unique sur toute l'application (D8, D32). */
  emailKey: string;
  name: string;
  passwordHash: string;
  /** Mot de passe temporaire donné par un admin : à changer avant toute autre opération (D8). */
  mustChangePassword: boolean;
  /** Les sessions ouvertes avant cette date sont refusées (D16). */
  sessionsValidAfter: Date | null;
  version: number;
  createdAt: Date;
}

export interface NewUserProps {
  id: string;
  email: Email;
  name: string;
  passwordHash: string;
  mustChangePassword: boolean;
  createdAt: Date;
}

/** Compte d'une personne (D12). Son rôle est porté par son appartenance à une organisation. */
export class User {
  private constructor(private readonly props: UserProps) {}

  static create({ email, ...props }: NewUserProps): User {
    return new User({
      ...props,
      email: email.address,
      emailKey: email.key,
      name: requireName(props.name, 'Le nom'),
      sessionsValidAfter: null,
      version: 1,
    });
  }

  static restore(props: UserProps): User {
    return new User({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get mustChangePassword(): boolean {
    return this.props.mustChangePassword;
  }

  snapshot(): UserProps {
    return { ...this.props };
  }

  /** Le nouveau mot de passe remplace le temporaire et ferme les sessions ouvertes avec l'ancien. */
  changePassword(passwordHash: string, at: Date): void {
    this.props.passwordHash = passwordHash;
    this.props.mustChangePassword = false;
    this.revokeSessions(at);
  }

  /** Déconnexion (ASVS 7.4.1) : les jetons émis avant `at` ne sont plus acceptés. */
  revokeSessions(at: Date): void {
    this.props.sessionsValidAfter = at;
  }

  acceptsSessionIssuedAt(issuedAt: Date): boolean {
    return !this.props.sessionsValidAfter || issuedAt >= this.props.sessionsValidAfter;
  }
}
