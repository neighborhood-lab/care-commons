import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import promise from 'eslint-plugin-promise';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  sonarjs.configs.recommended,
  promise.configs['flat/recommended'],
  prettierConfig,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.eslint.json',
      },
      globals: {
        // Node.js globals
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        module: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        global: 'readonly',
        // Vitest globals (when using globals: true)
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      unicorn,
      prettier,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      'prettier/prettier': 'error',
      // TypeScript rules - relaxed for verticals
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      // Sonarjs rules - relax for complex domain logic
      'sonarjs/cognitive-complexity': ['error', 70],
      'sonarjs/no-commented-code': 'off',
      'sonarjs/deprecation': 'off',
      'sonarjs/no-hardcoded-ip': 'off',
      'sonarjs/pseudo-random': 'off',
      'sonarjs/no-nested-functions': 'off',
      'sonarjs/no-nested-conditional': 'off',
      'sonarjs/use-type-alias': 'off',
      'sonarjs/different-types-comparison': 'off',
      'sonarjs/todo-tag': 'off',
      'sonarjs/no-all-duplicated-branches': 'off',
      'sonarjs/slow-regex': 'off',
      'sonarjs/concise-regex': 'off',
      'sonarjs/sql-queries': 'off',
      'sonarjs/no-unused-vars': 'off',
      'sonarjs/prefer-single-boolean-return': 'off',
      'sonarjs/no-redundant-jump': 'off',
      'sonarjs/no-ignored-exceptions': 'off',
      'sonarjs/concise-regex': 'off',
      'sonarjs/sql-queries': 'off',
      'sonarjs/no-unused-vars': 'off',
      'sonarjs/prefer-single-boolean-return': 'off',
      'sonarjs/no-redundant-jump': 'off',
      'sonarjs/no-ignored-exceptions': 'off',
      // Unicorn rules - mostly off for verticals
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/filename-case': ['error', { case: 'kebabCase' }],
      'unicorn/no-null': 'off',
      'unicorn/prefer-module': 'off',
      'unicorn/prefer-node-protocol': 'off',
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/no-array-for-each': 'off',
      'unicorn/no-useless-undefined': 'off',
      'unicorn/explicit-length-check': 'off',
      'unicorn/prefer-string-slice': 'off',
      'unicorn/better-regex': 'off',
      'unicorn/no-for-loop': 'off',
    },
  },
  {
    files: ['**/__tests__/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    ignores: [
      'dist/',
      '*.js',
      '*.d.ts',
      '*.js.map',
      '*.d.ts.map',
      'eslint.config.js',
      'vitest.config.js',
      'knexfile.js',
      'migrations/**/*.js',
      'migrations/**/*.d.ts',
      'migrations/**/*.js.map',
      'scripts/**/*.js',
      'scripts/**/*.d.ts',
      'scripts/**/*.js.map',
    ],
  },
];
