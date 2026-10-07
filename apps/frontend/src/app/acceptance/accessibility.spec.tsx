import { screen } from '@testing-library/react';
import type { Role } from '@/shared/api';
import { paths } from '@/shared/routes';
import { accessibilityViolations } from '@/testing/axe';
import { changeStatusAs, seedAction, seedMember, seedOrganization, seedPlan, signIn } from '@/testing/fake-api';
import { renderApp } from '@/testing/render-app';

/** Contrôle automatique WCAG 2.1 AA (axe-core) de chaque écran ; il ne remplace pas un audit RGAA manuel. */
describe('Accessibilité des écrans', () => {
  let planId: string;
  let actionId: string;

  const seed = (role: Role, options: { mustChangePassword?: boolean } = {}) => {
    const organizationId = seedOrganization('Clinique des Lilas');
    const userId = seedMember(organizationId, 'Alice', role, options);
    seedMember(organizationId, 'Bob', 'MANAGER');
    planId = seedPlan(organizationId, 'Audit hygiène 2026', 'Suivi de l’audit annuel');
    actionId = seedAction(planId, 'Former au lavage des mains', { description: 'Une session par service' });
    changeStatusAs(userId, actionId, 'IN_PROGRESS');
    signIn(userId);
  };

  it.each([
    ['la connexion', paths.login, 'Connexion'],
    ['l’inscription', paths.register, 'Créer une organisation'],
  ])('%s', async (_, url, heading) => {
    const { container } = renderApp(url);
    await screen.findByRole('heading', { level: 1, name: heading });
    expect(await accessibilityViolations(container)).toEqual([]);
  });

  it.each([
    ['la liste des plans', () => paths.actionPlans, 'Plans d’actions'],
    ['un plan et ses actions', () => paths.actionPlan(planId), 'Audit hygiène 2026'],
    ['le détail d’une action', () => paths.action(actionId), 'Former au lavage des mains'],
    ['les membres', () => paths.members, 'Membres'],
    ['une page inconnue', () => '/inconnue', 'Page introuvable'],
  ])('%s', async (_, url, heading) => {
    seed('ADMIN');
    const { container } = renderApp(url());
    await screen.findByRole('heading', { level: 1, name: heading });
    await screen.findByRole('navigation', { name: 'Navigation principale' });
    expect(await accessibilityViolations(container)).toEqual([]);
  });

  it('le changement de mot de passe temporaire', async () => {
    seed('MEMBER', { mustChangePassword: true });
    const { container } = renderApp(paths.actionPlans);
    await screen.findByRole('heading', { level: 1, name: 'Changer votre mot de passe' });
    expect(await accessibilityViolations(container)).toEqual([]);
  });

  it('un dialogue ouvert, avec une erreur de saisie', async () => {
    seed('ADMIN');
    const { user } = renderApp(paths.action(actionId));
    await user.click(await screen.findByRole('button', { name: 'Modifier l’action' }));
    await user.clear(screen.getByRole('textbox', { name: 'Titre' }));
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(screen.getByRole('textbox', { name: 'Titre' })).toBeInvalid();
    expect(await accessibilityViolations(document.body)).toEqual([]);
  });
});
