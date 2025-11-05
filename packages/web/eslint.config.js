import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import sonarjs from 'eslint-plugin-sonarjs'
import unicorn from 'eslint-plugin-unicorn'
import promise from 'eslint-plugin-promise'

export default [
  js.configs.recommended,
  sonarjs.configs.recommended,
  promise.configs['flat/recommended'],
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
        ecmaFeatures: {
          jsx: true,
        },
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
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        navigator: 'readonly',
        // React globals
        React: 'readonly',
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
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      unicorn,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      // React rules
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'react/no-unescaped-entities': 'off',
      // TypeScript strict rules (relaxed for now)
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
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/await-thenable': 'warn',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      // Unicorn rules (relaxed)
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/no-null': 'off',
      'unicorn/prefer-module': 'warn',
      'unicorn/prefer-node-protocol': 'warn',
      'unicorn/prefer-top-level-await': 'warn',
      'unicorn/no-array-for-each': 'warn',
      'unicorn/no-useless-undefined': 'warn',
      'unicorn/explicit-length-check': 'warn',
      'unicorn/prefer-string-slice': 'warn',
      'unicorn/better-regex': 'warn',
      'unicorn/no-for-loop': 'warn',
      // SonarJS rules (relaxed)
      'sonarjs/no-nested-template-literals': 'off',
      'sonarjs/slow-regex': 'off',
      'sonarjs/concise-regex': 'off',
      'sonarjs/no-nested-conditional': 'warn',
      'sonarjs/deprecation': 'warn',
      'sonarjs/no-intrusive-permissions': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    files: ['**/__tests__/**/*.{ts,tsx}'],
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
      'vite.config.ts',
      'vitest.config.ts',
      'vitest.config.js',
      'knexfile.js',
      'migrations/**/*.js',
      'migrations/**/*.d.ts',
      'migrations/**/*.js.map',
      'scripts/**/*.js',
      'scripts/**/*.d.ts',
      'scripts/**/*.js.map',
      // Temporarily exclude broken admin test files (pre-existing issues)
      'src/app/pages/admin/__tests__/AdminDashboard.test.tsx',
      'src/app/pages/admin/__tests__/ComplianceCenter.test.tsx',
      'src/app/pages/admin/__tests__/DataGridPanel.test.tsx',
      'src/app/pages/admin/__tests__/OperationsCenter.test.tsx',
      'src/app/pages/admin/__tests__/StateConfigPanel.test.tsx',
    ],
  },
]
