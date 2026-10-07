import { screen, within } from '@testing-library/react';
import type { Role } from '@/shared/api';
import { paths } from '@/shared/routes';
import { seedAction, seedMember, seedOrganization, seedPlan, signIn } from '@/testing/fake-api';
import { renderApp } from '@/testing/render-app';

/**
 * Matrice de `docs/specs/permissions.md` vue depuis l'écran : chaque bouton n'est proposé qu'aux rôles autorisés.
 * Masquer n'est qu'un confort : l'API refuse elle-même (tests du back).
 */
const ADMIN_ONLY: Role[] = ['ADMIN'];
const MANAGER_AND_ADMIN: Role[] = ['MANAGER', 'ADMIN'];
const ROLES: Role[] = ['MEMBER', 'MANAGER', 'ADMIN'];

const CONTROLS = [
  { page: 'plans', control: 'Nouveau plan', allowed: ADMIN_ONLY },
  { page: 'plan', control: 'Modifier le plan', allowed: ADMIN_ONLY },
  { page: 'plan', control: 'Ajouter une action', allowed: ADMIN_ONLY },
  { page: 'action TODO', control: 'Modifier l’action', allowed: ADMIN_ONLY },
  { page: 'action TODO', control: 'Supprimer l’action', allowed: ADMIN_ONLY },
  { page: 'action TODO', control: 'Passer à En cours', allowed: MANAGER_AND_ADMIN },
  { page: 'action IN_PROGRESS', control: 'Passer à À valider', allowed: MANAGER_AND_ADMIN },
  { page: 'action TO_VALIDATE', control: 'Passer à Terminé', allowed: ADMIN_ONLY },
  { page: 'action TO_VALIDATE', control: 'Refuser la validation', allowed: ADMIN_ONLY },
] as const;

describe('Boutons proposés selon le rôle', () => {
  const cases = CONTROLS.flatMap(({ page, control, allowed }) =>
    ROLES.map((role) => ({ page, control, role, visible: (allowed as readonly Role[]).includes(role) })),
  );

  it.each(cases)('$page, $role : « $control » visible = $visible', async ({ page, control, role, visible }) => {
    const organizationId = seedOrganization('Clinique des Lilas');
    signIn(seedMember(organizationId, 'Alice', role));
    const planId = seedPlan(organizationId, 'Audit hygiène 2026');
    const [kind, status] = page.split(' ') as ['plans' | 'plan' | 'action', 'TODO' | 'IN_PROGRESS' | 'TO_VALIDATE'];
    const actionId = seedAction(planId, 'Former au lavage des mains', { status });
    const url = { plans: paths.actionPlans, plan: paths.actionPlan(planId), action: paths.action(actionId) }[kind];

    renderApp(url);
    await screen.findByRole('heading', { level: 1, name: kind === 'action' ? 'Former au lavage des mains' : /./ });
    await screen.findByRole('navigation', { name: 'Navigation principale' });

    expect(screen.queryByRole('button', { name: control }) !== null).toBe(visible);
  });

  it.each(ROLES)('le lien Membres est réservé à l’Administrateur (%s)', async (role) => {
    signIn(seedMember(seedOrganization('Clinique des Lilas'), 'Alice', role));
    renderApp(paths.actionPlans);
    const navigation = await screen.findByRole('navigation', { name: 'Navigation principale' });
    expect(within(navigation).queryByRole('link', { name: 'Membres' }) !== null).toBe(role === 'ADMIN');
  });
});
