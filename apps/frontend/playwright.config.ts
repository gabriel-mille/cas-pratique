import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';
import { defineConfig, devices } from '@playwright/test';

/**
 * Parcours de bout en bout : vrai navigateur, vrai backend, vrai PostgreSQL (`docker compose up -d`, migrations jouées).
 * Les règles sont déjà couvertes par les `.feature` (front et back) : ici on vérifie seulement que tout s'assemble
 * (proxy, cookie de session, Origin, If-Match) et l'accessibilité des pages rendues par un vrai moteur (D35).
 */
export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './e2e' }),
  use: {
    baseURL: 'http://localhost:4200',
    locale: 'fr-FR',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'npx nx run backend:serve',
      url: 'http://localhost:3000/api/docs',
      reuseExistingServer: true,
      cwd: workspaceRoot,
    },
    {
      command: 'npx nx run frontend:serve',
      url: 'http://localhost:4200',
      reuseExistingServer: true,
      cwd: workspaceRoot,
    },
  ],
  // Chromium seul : l'objectif est l'assemblage, pas la compatibilité navigateurs (choix du projet, D35).
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
