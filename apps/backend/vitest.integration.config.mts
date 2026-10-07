import { join } from 'node:path';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// Tests d'intégration contre un vrai PostgreSQL 16 (Testcontainers, D29) : Docker requis,
// d'où une cible séparée (`nx run backend:test-integration`) lancée au pre-push (D33).
export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/backend-integration',
  plugins: [
    swc.vite({
      tsconfigFile: join(__dirname, 'tsconfig.spec.json'),
      swcrc: false,
      module: { type: 'es6' },
    }),
  ],
  test: {
    name: 'backend-integration',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.int.spec.ts'],
    globalSetup: ['src/shared/testing/postgres.global-setup.ts'],
    // Une seule base, vidée avant chaque test : les fichiers ne doivent pas s'exécuter en parallèle.
    fileParallelism: false,
    hookTimeout: 60_000,
    reporters: ['default'],
  },
}));
