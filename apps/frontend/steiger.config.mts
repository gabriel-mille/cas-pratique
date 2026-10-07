import fsd from '@feature-sliced/steiger-plugin';
import { defineConfig } from 'steiger';

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // Outillage de test (fausse API, rendu de l'application) : hors des couches FSD.
    ignores: ['**/testing/**'],
  },
]);
