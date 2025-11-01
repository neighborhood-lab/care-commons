import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import sonarjs from 'eslint-plugin-sonarjs'
import unicorn from 'eslint-plugin-unicorn'
import promise from 'eslint-plugin-promise'

export default [
  js.configs.recommended,
  sonarjs.configs.recommended,
  promise.configs['flat/recommended'],
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
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
    },
    rules: {
      ...typescript.configs.recommended.rules,
      // TypeScript strict rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        { allowExpressions: true, allowTypedFunctionExpressions: true },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      // Unicorn rules (battle-tested quality improvements)
      'unicorn/prevent-abbreviations': 'off', // Too aggressive for domain models
      'unicorn/filename-case': ['error', { case: 'kebabCase' }],
      'unicorn/no-null': 'off', // SQL deals with null
      'unicorn/prefer-module': 'error',
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/prefer-top-level-await': 'error',
      'unicorn/no-array-for-each': 'off',
      'unicorn/no-useless-undefined': 'error',
      'unicorn/explicit-length-check': 'error',
      'unicorn/prefer-string-slice': 'error',
      'unicorn/better-regex': 'error',
      'unicorn/no-for-loop': 'error',
      // SonarJS rules
      'sonarjs/cognitive-complexity': 'off',
      'sonarjs/sql-queries': 'off',
      'sonarjs/no-nested-conditional': 'off',
      'sonarjs/different-types-comparison': 'off',
      'sonarjs/use-type-alias': 'off',
    },
  },
  {
    files: ['**/__tests__/**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.test.json',
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // Allow 'any' in test mocks
      '@typescript-eslint/no-unnecessary-condition': 'off', // Allow unnecessary conditions in tests
      '@typescript-eslint/prefer-nullish-coalescing': 'off', // Allow || in tests
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
      'vitest.config.ts',
      'knexfile.js',
      'migrations/**/*.js',
      'migrations/**/*.d.ts',
      'migrations/**/*.js.map',
      'scripts/**/*.js',
      'scripts/**/*.d.ts',
      'scripts/**/*.js.map',
    ],
  },
]