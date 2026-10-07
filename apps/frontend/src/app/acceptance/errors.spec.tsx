import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { paths } from '@/shared/routes';
import { seedAction, seedMember, seedOrganization, seedPlan, signIn, storedAction } from '@/testing/fake-api';
import { renderApp } from '@/testing/render-app';
import { server } from '@/testing/server';

/** Erreurs du back montrées dans la page (WCAG 3.3.1, 4.1.3) et données relues après un conflit (D14). */
describe('Erreurs et conflits', () => {
  let organizationId: string;
  let planId: string;
  let actionId: string;

  beforeEach(() => {
    organizationId = seedOrganization('Clinique des Lilas');
    signIn(seedMember(organizationId, 'Alice', 'ADMIN'));
    planId = seedPlan(organizationId, 'Audit hygiène 2026');
    actionId = seedAction(planId, 'Former au lavage des mains');
  });

  it('signale un plan modifié entre-temps par quelqu’un d’autre', async () => {
    const { user } = renderApp(paths.actionPlan(planId));
    await user.click(await screen.findByRole('button', { name: 'Modifier le plan' }));
    // Un autre administrateur a modifié le plan pendant qu'Alice l'éditait.
    server.use(
      http.put('*/api/action-plans/:planId', () =>
        HttpResponse.json({ code: 'stale-version', detail: 'Version périmée' }, { status: 412 }),
      ),
    );
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    const dialog = screen.getByRole('dialog', { name: 'Modifier le plan' });
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/modifiées entre-temps/);
  });

  it('montre le refus du back quand la transition n’est plus valide, et relit l’action', async () => {
    const { user } = renderApp(paths.action(actionId));
    await screen.findByText('État : À faire');
    storedAction(actionId).status = 'DONE';
    await user.click(screen.getByRole('button', { name: 'Passer à En cours' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Transition non autorisée');
    expect(await screen.findByText('État : Terminé')).toBeInTheDocument();
  });

  it('montre l’erreur d’un ajout d’action refusé', async () => {
    server.use(
      http.post('*/api/action-plans/:planId/actions', () =>
        HttpResponse.json({ code: 'validation-failed', detail: 'Le titre dépasse 200 caractères' }, { status: 400 }),
      ),
    );
    const { user } = renderApp(paths.actionPlan(planId));
    await user.click(await screen.findByRole('button', { name: 'Ajouter une action' }));
    await user.type(screen.getByRole('textbox', { name: 'Titre' }), 'Titre');
    await user.click(screen.getByRole('button', { name: 'Ajouter l’action' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Le titre dépasse 200 caractères');
  });

  it('montre l’erreur de création d’un plan, puis ferme le dialogue sur Annuler', async () => {
    server.use(http.post('*/api/action-plans', () => HttpResponse.error()));
    const { user } = renderApp(paths.actionPlans);
    await user.click(await screen.findByRole('button', { name: 'Nouveau plan' }));
    await user.type(screen.getByRole('textbox', { name: 'Titre' }), 'Audit 2027');
    await user.click(screen.getByRole('button', { name: 'Créer le plan' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/injoignable/);
    await user.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('montre « Plan introuvable » pour un plan inconnu', async () => {
    renderApp(paths.actionPlan('inconnu'));
    expect(await screen.findByRole('heading', { level: 1, name: 'Plan introuvable' })).toBeInTheDocument();
  });

  it('refuse un email déjà utilisé à l’ajout d’un membre', async () => {
    seedMember(organizationId, 'Bob', 'MANAGER', { email: 'bob@lilas.fr' });
    const { user } = renderApp(paths.members);
    await user.type(await screen.findByRole('textbox', { name: 'Email' }), 'BOB@lilas.fr');
    await user.type(screen.getByRole('textbox', { name: 'Nom' }), 'Bob bis');
    await user.click(screen.getByRole('button', { name: 'Ajouter le membre' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Cet email est déjà utilisé');
  });

  it('valide l’ajout d’un membre avant tout appel', async () => {
    const { user } = renderApp(paths.members);
    await user.click(await screen.findByRole('button', { name: 'Ajouter le membre' }));
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeInvalid();
    expect(screen.getByRole('textbox', { name: 'Nom' })).toBeInvalid();
  });

  it('montre l’erreur d’un retrait refusé dans le dialogue', async () => {
    seedMember(organizationId, 'Bob', 'MANAGER');
    server.use(http.delete('*/api/members/:userId', () => HttpResponse.json({}, { status: 500 })));
    const { user } = renderApp(paths.members);
    await user.click(await screen.findByRole('button', { name: 'Retirer Bob' }));
    const dialog = screen.getByRole('dialog', { name: 'Retirer Bob ?' });
    await user.click(within(dialog).getByRole('button', { name: 'Confirmer le retrait' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/inattendue/);
    await user.click(within(dialog).getByRole('button', { name: 'Annuler' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
