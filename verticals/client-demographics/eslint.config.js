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
      '@typescript-eslint/no-unnecessary-condition': 'off', // Allow unnecessary conditions
      '@typescript-eslint/prefer-nullish-coalescing': 'off', // Relax for vertical packages
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'off', // Relax for vertical packages
      // Sonarjs rules - relax for complex domain logic
      'sonarjs/cognitive-complexity': ['error', 70], // Increase limit for complex domain logic
      'sonarjs/no-commented-code': 'off', // Allow commented code in development
      'sonarjs/deprecation': 'off', // Ignore Zod deprecations
      'sonarjs/no-hardcoded-ip': 'off', // Allow hardcoded IPs in tests
      'sonarjs/pseudo-random': 'off', // Allow Math.random
      '@typescript-eslint/explicit-function-return-type': 'off', // Relax return types
      'sonarjs/no-nested-functions': 'off', // Allow nested functions
      '@typescript-eslint/no-unused-vars': 'warn', // Warn on unused vars
      '@typescript-eslint/await-thenable': 'off', // Relax await checks
      '@typescript-eslint/no-explicit-any': 'warn', // Warn on any
      'sonarjs/no-nested-conditional': 'off', // Allow nested conditionals
      'sonarjs/use-type-alias': 'off', // Allow inline union types
      'sonarjs/different-types-comparison': 'off', // Allow loose comparisons
      // Unicorn rules (battle-tested quality improvements)
      'unicorn/prevent-abbreviations': 'off', // Too aggressive for domain models
      'unicorn/filename-case': ['error', { case: 'kebabCase' }],
      'unicorn/no-null': 'off', // SQL deals with null
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
      '@typescript-eslint/no-explicit-any': 'off', // Allow 'any' in test mocks
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
