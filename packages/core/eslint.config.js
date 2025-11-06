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
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          allowString: false,
          allowNumber: false,
          allowNullableObject: false,
        },
      ],
      // Unicorn rules (battle-tested quality improvements)
      'unicorn/prevent-abbreviations': 'off', // Too aggressive for domain models
      'unicorn/filename-case': ['error', { case: 'kebabCase' }],
      'unicorn/no-null': 'off', // SQL deals with null
      'unicorn/prefer-module': 'error',
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/prefer-top-level-await': 'error',
      'unicorn/no-array-for-each': 'error',
      'unicorn/no-useless-undefined': 'error',
      'unicorn/explicit-length-check': 'error',
      'unicorn/prefer-string-slice': 'error',
      'unicorn/better-regex': 'error',
      'unicorn/no-for-loop': 'error',
      // SOLID Principles enforcement
      // Single Responsibility Principle (SRP) - Keep files and functions small
      'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],
      // SRP - Keep functions simple
      'complexity': ['warn', 10],
      'max-depth': ['warn', 3],
      // Dependency Inversion Principle (DIP) - Prefer objects over many params
      'max-params': ['warn', 3],
    },
  },
  {
    files: ['**/__tests__/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // Allow 'any' in test mocks
      '@typescript-eslint/explicit-function-return-type': 'off', // Tests can infer return types
      'unicorn/no-useless-undefined': 'off', // Allow explicit undefined in test cases
      'unicorn/no-array-for-each': 'off', // Allow forEach in tests
      'sonarjs/constructor-for-side-effects': 'off', // Allow constructor calls for side effects in tests
      'sonarjs/no-hardcoded-ip': 'off', // Allow hardcoded IPs in test fixtures
      'sonarjs/no-nested-functions': 'off', // Allow nested functions in test cases
      // Relax SOLID rules for tests
      'max-lines': 'off', // Test files can be longer
      'max-lines-per-function': 'off', // Test functions can be longer
      'complexity': 'off', // Test setups can be complex
      'max-params': 'off', // Allow more params in test helpers
    },
  },
  {
    files: ['migrations/**/*.ts', 'scripts/**/*.ts'],
    rules: {
      'unicorn/filename-case': 'off', // Migrations use timestamp_description format
      '@typescript-eslint/explicit-function-return-type': 'off', // Scripts can infer return types
      '@typescript-eslint/strict-boolean-expressions': 'off', // Allow looser boolean checks in scripts
      '@typescript-eslint/prefer-nullish-coalescing': 'off', // Allow || in scripts
      '@typescript-eslint/no-floating-promises': 'off', // Allow floating promises in scripts
      'unicorn/prefer-top-level-await': 'off', // Scripts may use IIFE patterns
      'unicorn/no-array-for-each': 'off', // Allow forEach in scripts
      'unicorn/no-for-loop': 'off', // Allow for loops in scripts
      'unicorn/prefer-node-protocol': 'off', // Allow non-prefixed imports in scripts
      'unicorn/prefer-string-slice': 'off', // Allow substring in scripts
      'sonarjs/no-commented-code': 'off', // Allow commented code in scripts
      'sonarjs/cognitive-complexity': 'off', // Allow complex seed scripts
      'sonarjs/no-nested-conditional': 'off', // Allow nested conditionals in scripts
      'sonarjs/no-all-duplicated-branches': 'off', // Allow duplicated branches in seed data
      'sonarjs/pseudo-random': 'off', // Allow Math.random in seed scripts
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
]
