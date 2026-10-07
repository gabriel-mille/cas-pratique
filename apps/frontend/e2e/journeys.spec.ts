import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

/** Données uniques par exécution : la base de développement n'est pas vidée entre deux lancements. */
const run = Date.now().toString(36);
const PASSWORD = 'un mot de passe assez long';

async function expectNoAccessibilityViolation(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(violations.map(({ id, nodes }) => `${id} (${nodes.length})`)).toEqual(
    []
  );
}

async function register(page: Page, organization: string, email: string) {
  await page.goto('/register');
  await page.getByLabel('Nom de l’organisation').fill(organization);
  await page.getByLabel('Votre nom').fill('Alice');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mot de passe', { exact: false }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Créer l’organisation' }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Plans d’actions' })
  ).toBeVisible();
}

test('un administrateur crée un plan et mène une action jusqu’à Terminé', async ({
  page,
}) => {
  await register(page, `Clinique ${run}`, `alice.${run}@lilas.test`);
  await expectNoAccessibilityViolation(page);

  await page.getByRole('button', { name: 'Nouveau plan' }).click();
  await page.getByRole('dialog').getByLabel('Titre').fill('Audit hygiène');
  await page.getByRole('button', { name: 'Créer le plan' }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Audit hygiène' })
  ).toBeVisible();

  await page.getByRole('button', { name: 'Ajouter une action' }).click();
  await page
    .getByRole('dialog')
    .getByLabel('Titre')
    .fill('Former au lavage des mains');
  await page.getByRole('button', { name: 'Ajouter l’action' }).click();
  await page.getByRole('link', { name: 'Former au lavage des mains' }).click();
  await expectNoAccessibilityViolation(page);

  for (const next of ['En cours', 'À valider', 'Terminé']) {
    await page.getByRole('button', { name: `Passer à ${next}` }).click();
    await expect(page.getByText(`État : ${next}`)).toBeVisible();
  }
  await expect(page.getByRole('button', { name: /^Passer à/ })).toHaveCount(0);
  await expectNoAccessibilityViolation(page);
});

test('un membre ajouté se connecte avec son mot de passe temporaire et doit le changer', async ({
  page,
}) => {
  await register(page, `Hôpital ${run}`, `admin.${run}@lilas.test`);
  await page.getByRole('link', { name: 'Membres' }).click();
  await page.getByLabel('Email').fill(`bob.${run}@lilas.test`);
  await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('Bob');
  await page.getByRole('button', { name: 'Ajouter le membre' }).click();
  const temporaryPassword = await page.locator('code').textContent();
  expect(temporaryPassword).toBeTruthy();
  await expectNoAccessibilityViolation(page);

  await page.getByRole('button', { name: 'Se déconnecter' }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Connexion' })
  ).toBeVisible();
  await page.getByLabel('Email').fill(`bob.${run}@lilas.test`);
  await page
    .getByLabel('Mot de passe', { exact: false })
    .fill(temporaryPassword ?? '');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(
    page.getByText(/Votre mot de passe est temporaire/)
  ).toBeVisible();

  await page.getByLabel('Mot de passe actuel').fill(temporaryPassword ?? '');
  await page
    .getByLabel('Nouveau mot de passe')
    .fill('le nouveau mot de passe de Bob');
  await page.getByRole('button', { name: 'Changer le mot de passe' }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Plans d’actions' })
  ).toBeVisible();
  // Bob est Utilisateur : pas de création de plan, pas d'accès aux membres.
  await expect(page.getByRole('button', { name: 'Nouveau plan' })).toHaveCount(
    0
  );
  await expect(page.getByRole('link', { name: 'Membres' })).toHaveCount(0);
});
