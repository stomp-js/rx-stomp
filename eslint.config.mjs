import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  tseslint.configs.eslintRecommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    files: ['src/**/*.ts', 'spec/**/*.ts'],
    rules: {
      // tslint member-ordering was disabled
      // no equivalent needed

      // tslint no-console was disabled
      'no-console': 'off',

      // tslint no-empty with allow-empty-catch and allow-empty-functions
      'no-empty': ['error', { allowEmptyCatch: true }],
      '@typescript-eslint/no-empty-function': 'off',

      // tslint variable-name: allow leading underscore
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'default',
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
        {
          // Type aliases may use camelCase (e.g. setupReplyQueueFnType is public API)
          selector: 'typeAlias',
          format: ['PascalCase', 'camelCase'],
        },
        {
          selector: 'enumMember',
          format: ['UPPER_CASE', 'PascalCase'],
        },
        {
          // Object literal properties are often protocol/API-defined (e.g. STOMP headers
          // like 'correlation-id', 'auto-delete') and must not be forced to camelCase.
          selector: 'objectLiteralProperty',
          format: null,
        },
      ],
    },
  },
  {
    files: ['spec/**/*.ts'],
    rules: {
      // Spec files import Jasmine types and use test globals
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
);
