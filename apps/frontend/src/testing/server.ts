import { cleanup } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { handlers, resetFakeApi } from './fake-api';

/** Toute requête sans route connue fait échouer le test : le front ne doit appeler que le contrat. */
export const server = setupServer(...handlers);

/** Fin d'un test, ou d'un scénario pour les `.feature` : écran démonté, fausse API remise à zéro. */
export function resetTestState() {
  cleanup();
  server.resetHandlers();
  resetFakeApi();
}
