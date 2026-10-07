/// <reference types='vitest' />
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/frontend',
  resolve: {
    // Alias `@/*` → `src/*`, le seul montré par la doc FSD (aussi déclaré dans les tsconfig).
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 4200,
    host: 'localhost',
    // Même origine pour le front et l'API : pas de CORS, cookie SameSite=Strict, en-tête Origin conservé (D34).
    proxy: { '/api': 'http://localhost:3000' },
  },
  preview: {
    port: 4200,
    host: 'localhost',
    proxy: { '/api': 'http://localhost:3000' },
  },
  plugins: [react()],
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  test: {
    name: '@org/frontend',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.spec.{ts,tsx}'],
    setupFiles: ['src/testing/setup.ts'],
    // Nettoyage piloté par src/testing/setup.ts (scénarios vitest-cucumber sur plusieurs tests).
    env: { RTL_SKIP_AUTO_CLEANUP: 'true' },
    reporters: ['default'],
    coverage: {
      enabled: true,
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/**/*.spec.{ts,tsx}', 'src/testing/**', 'src/shared/api/schema.d.ts'],
      // Seuils de D27 : outil de vigilance, pas un objectif en soi.
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
}));
