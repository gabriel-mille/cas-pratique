import nx from '@nx/eslint-plugin';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import testingLibrary from 'eslint-plugin-testing-library';
import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  ...nx.configs['flat/react'],
  // Accessibilité (RGAA / WCAG) : jeu « strict » de jsx-a11y, le plugin est déjà déclaré par flat/react.
  { files: ['**/*.tsx', '**/*.jsx'], rules: jsxA11y.flatConfigs.strict.rules },
  {
    files: ['**/*.spec.tsx', '**/*.test.tsx'],
    ...testingLibrary.configs['flat/react'],
  },
];
