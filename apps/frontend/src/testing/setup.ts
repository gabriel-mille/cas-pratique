import '@testing-library/jest-dom/vitest';
import { resetTestState, server } from './server';

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
// vitest-cucumber fait de chaque étape un test : les `.feature` appellent `resetTestState` en AfterEachScenario.
// Le nettoyage automatique de Testing Library est désactivé pour la même raison (RTL_SKIP_AUTO_CLEANUP).
afterEach(({ task }) => {
  if (!task.file.name.endsWith('.feature.spec.tsx')) resetTestState();
});
afterAll(() => server.close());
