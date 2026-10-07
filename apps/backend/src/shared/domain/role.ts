// Rôles d'une appartenance (D12) : Utilisateur, Gestionnaire, Administrateur.
export const Role = {
  MEMBER: 'MEMBER',
  MANAGER: 'MANAGER',
  ADMIN: 'ADMIN',
} as const;

export type Role = (typeof Role)[keyof typeof Role];
