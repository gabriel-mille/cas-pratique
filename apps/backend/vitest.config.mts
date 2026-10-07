import { join } from 'node:path';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/backend',
  // esbuild ne gère pas emitDecoratorMetadata, indispensable à l'injection NestJS
  // (recette officielle : https://docs.nestjs.com/recipes/swc#vitest).
  plugins: [
    swc.vite({
      tsconfigFile: join(__dirname, 'tsconfig.spec.json'),
      // Le .swcrc sert au build et exclut les tests : les options viennent ici du tsconfig.spec.
      swcrc: false,
      module: { type: 'es6' },
    }),
  ],
  test: {
    name: 'backend',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    // Les tests d'intégration ont leur propre configuration (vitest.integration.config.mts).
    exclude: ['src/**/*.int.spec.ts'],
    reporters: ['default'],
    coverage: {
      enabled: true,
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
      include: ['src/**/*.ts'],
      // L'infrastructure PostgreSQL est couverte par les tests d'intégration, pas par cette suite.
      exclude: [
        'src/main.ts',
        'src/**/*.module.ts',
        'src/**/*.spec.ts',
        'src/database/**',
        'src/**/infrastructure/typeorm/**',
        'src/**/testing/**',
      ],
      // Seuils de D27 : outil de vigilance, pas un objectif en soi.
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
}));
