import { act, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { paths } from '@/shared/routes';
import { DEFAULT_PASSWORD, seedMember, seedOrganization, seedPlan, signIn } from '@/testing/fake-api';
import { renderApp } from '@/testing/render-app';
import { server } from '@/testing/server';

/** Parcours de session hors `.feature` : garde des pages, déconnexion, expiration, mot de passe. */
describe('Session', () => {
  const seedAlice = (options: { mustChangePassword?: boolean; password?: string } = {}) => {
    const organizationId = seedOrganization('Clinique des Lilas');
    const userId = seedMember(organizationId, 'Alice', 'ADMIN', { email: 'alice@lilas.fr', ...options });
    seedPlan(organizationId, 'Audit hygiène 2026');
    return userId;
  };
  /** Champ mot de passe : sans rôle ARIA, retrouvé par son libellé (l'astérisque est masqué). */
  const password = (label: string) => screen.getByLabelText(new RegExp(`^${label}( \\*)?$`));

  it('renvoie vers la connexion sans session, puis vers les plans après connexion', async () => {
    seedAlice();
    const { user, router } = renderApp(paths.actionPlans);
    expect(await screen.findByRole('heading', { level: 1, name: 'Connexion' })).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'alice@lilas.fr');
    await user.type(password('Mot de passe'), DEFAULT_PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByRole('link', { name: 'Audit hygiène 2026' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(paths.actionPlans);
  });

  it('valide le formulaire de connexion avant tout appel', async () => {
    const { user } = renderApp(paths.login);
    await user.click(await screen.findByRole('button', { name: 'Se connecter' }));
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeInvalid();
    expect(password('Mot de passe')).toBeInvalid();
  });

  it('se déconnecte et ne garde rien en cache', async () => {
    signIn(seedAlice());
    const { user, router } = renderApp(paths.actionPlans);
    await user.click(await screen.findByRole('button', { name: 'Se déconnecter' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Connexion' })).toBeInTheDocument();

    await act(() => router.navigate(paths.actionPlans));
    expect(await screen.findByRole('heading', { level: 1, name: 'Connexion' })).toBeInTheDocument();
  });

  it('renvoie vers la connexion quand la session expire en cours d’usage', async () => {
    signIn(seedAlice());
    const { user } = renderApp(paths.actionPlans);
    await screen.findByRole('link', { name: 'Audit hygiène 2026' });

    signIn('session-expirée');
    await user.click(screen.getByRole('link', { name: 'Audit hygiène 2026' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Connexion' })).toBeInTheDocument();
  });

  it('affiche une erreur si le serveur ne répond pas correctement', async () => {
    server.use(http.get('*/api/me', () => HttpResponse.json({}, { status: 500 })));
    renderApp(paths.actionPlans);
    expect(await screen.findByRole('alert')).toHaveTextContent(/inattendue/);
  });

  it('remplace le mot de passe temporaire puis ouvre l’application', async () => {
    signIn(seedAlice({ mustChangePassword: true, password: 'mot de passe temporaire d’Alice' }));
    const { user } = renderApp(paths.actionPlans);
    await screen.findByText(/Votre mot de passe est temporaire/);

    await user.type(password('Mot de passe actuel'), 'pas le bon mot de passe');
    await user.type(password('Nouveau mot de passe'), 'un nouveau mot de passe sûr');
    await user.click(screen.getByRole('button', { name: 'Changer le mot de passe' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Le mot de passe actuel est incorrect');

    await user.clear(password('Mot de passe actuel'));
    await user.type(password('Mot de passe actuel'), 'mot de passe temporaire d’Alice');
    await user.click(screen.getByRole('button', { name: 'Changer le mot de passe' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Plans d’actions' })).toBeInTheDocument();
    expect(screen.getByText('Mot de passe modifié. Vos autres sessions ont été fermées.')).toBeInTheDocument();
  });

  it('refuse un nouveau mot de passe trop court sans appeler l’API', async () => {
    signIn(seedAlice());
    const { user } = renderApp(paths.changePassword);
    await screen.findByRole('heading', { level: 1, name: 'Changer votre mot de passe' });
    await user.type(password('Mot de passe actuel'), DEFAULT_PASSWORD);
    await user.type(password('Nouveau mot de passe'), 'court');
    await user.click(screen.getByRole('button', { name: 'Changer le mot de passe' }));
    expect(password('Nouveau mot de passe')).toHaveAccessibleDescription(/moins de 15 caractères/);
  });
});
