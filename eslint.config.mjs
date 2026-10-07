import nx from '@nx/eslint-plugin';
import vitest from '@vitest/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      '**/dist',
      '**/out-tsc',
      '**/test-output',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\.base)?\.config\.[cm]?[jt]s$'],
          depConstraints: [{ sourceTag: '*', onlyDependOnLibsWithTags: ['*'] }],
        },
      ],
    },
  },
  // Tests : règles recommandées du plugin Vitest (pas de .only oublié, pas de test sans assertion…).
  {
    files: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.test.ts', '**/*.test.tsx'],
    plugins: { vitest },
    rules: vitest.configs.recommended.rules,
    languageOptions: { globals: vitest.environments.env.globals },
  },
  // Scénarios Gherkin (vitest-cucumber) : les assertions vivent dans les étapes, qui sont les blocs de test.
  {
    files: ['**/*.feature.spec.ts', '**/*.feature.spec.tsx'],
    rules: {
      'vitest/no-standalone-expect': [
        'error',
        { additionalTestBlockFunctions: ['Given', 'When', 'Then', 'And', 'But'] },
      ],
    },
  },
];
