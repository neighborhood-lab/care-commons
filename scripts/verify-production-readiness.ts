#!/usr/bin/env tsx

import chalk from 'chalk';
import { execSync } from 'child_process';

interface VerificationCheck {
  category: string;
  name: string;
  fn: () => Promise<boolean>;
  required: boolean;
}

const checks: VerificationCheck[] = [
  {
    category: 'Infrastructure',
    name: 'Database accessible',
    required: true,
    fn: async () => {
      try {
        execSync('npm run db:ping', { stdio: 'ignore' });
        return true;
      } catch {
        return false;
      }
    }
  },
  {
    category: 'Infrastructure',
    name: 'HTTPS enabled',
    required: true,
    fn: async () => {
      const response = await fetch(process.env.PRODUCTION_URL!);
      return response.url.startsWith('https://');
    }
  },
  {
    category: 'Security',
    name: 'Environment variables set',
    required: true,
    fn: async () => {
      const required = [
        'DATABASE_URL',
        'JWT_SECRET',
        'JWT_REFRESH_SECRET',
        'ENCRYPTION_KEY'
      ];
      return required.every(key => process.env[key]);
    }
  },
  {
    category: 'Security',
    name: 'No vulnerabilities',
    required: true,
    fn: async () => {
      try {
        execSync('npm audit --audit-level=high', { stdio: 'ignore' });
        return true;
      } catch {
        return false;
      }
    }
  },
  {
    category: 'Testing',
    name: 'All tests passing',
    required: true,
    fn: async () => {
      try {
        execSync('npm test', { stdio: 'ignore' });
        return true;
      } catch {
        return false;
      }
    }
  },
  {
    category: 'Testing',
    name: 'Smoke tests passing',
    required: true,
    fn: async () => {
      try {
        execSync('npm run test:smoke', { stdio: 'ignore' });
        return true;
      } catch {
        return false;
      }
    }
  },
  {
    category: 'Monitoring',
    name: 'Health check responding',
    required: true,
    fn: async () => {
      const response = await fetch(`${process.env.PRODUCTION_URL}/health`);
      return response.ok;
    }
  },
  {
    category: 'Monitoring',
    name: 'Error tracking configured',
    required: true,
    fn: async () => {
      return !!process.env.SENTRY_DSN;
    }
  },
  {
    category: 'Backup',
    name: 'Backups configured',
    required: true,
    fn: async () => {
      // Check if backup script exists and is scheduled
      try {
        execSync('crontab -l | grep backup-database', { stdio: 'ignore' });
        return true;
      } catch {
        return false;
      }
    }
  },
  {
    category: 'Documentation',
    name: 'API documentation available',
    required: false,
    fn: async () => {
      const response = await fetch(`${process.env.PRODUCTION_URL}/api-docs`);
      return response.ok;
    }
  }
];

async function verifyProductionReadiness() {
  console.log(chalk.blue.bold('\n🚀 Verifying Production Readiness\n'));

  const results = new Map<string, { passed: number; failed: number }>();

  for (const check of checks) {
    if (!results.has(check.category)) {
      results.set(check.category, { passed: 0, failed: 0 });
    }

    const categoryResults = results.get(check.category)!;

    process.stdout.write(`${check.category} › ${check.name}... `);

    try {
      const passed = await check.fn();

      if (passed) {
        console.log(chalk.green('✅'));
        categoryResults.passed++;
      } else {
        console.log(chalk.red(check.required ? '❌ REQUIRED' : '⚠️  RECOMMENDED'));
        categoryResults.failed++;
      }
    } catch (error) {
      console.log(chalk.red(check.required ? '❌ REQUIRED' : '⚠️  RECOMMENDED'));
      categoryResults.failed++;
    }
  }

  console.log(chalk.blue.bold('\n📊 Summary by Category:\n'));

  let totalFailed = 0;
  let requiredFailed = 0;

  for (const [category, { passed, failed }] of results) {
    const total = passed + failed;
    const percent = ((passed / total) * 100).toFixed(0);

    console.log(`${category}: ${passed}/${total} passed (${percent}%)`);

    totalFailed += failed;
  }

  // Check for required failures
  for (const check of checks) {
    if (check.required) {
      try {
        const passed = await check.fn();
        if (!passed) requiredFailed++;
      } catch {
        requiredFailed++;
      }
    }
  }

  if (requiredFailed > 0) {
    console.log(chalk.red.bold('\n❌ PRODUCTION NOT READY'));
    console.log(chalk.red(`${requiredFailed} required checks failed`));
    process.exit(1);
  } else if (totalFailed > 0) {
    console.log(chalk.yellow.bold('\n⚠️  PRODUCTION READY (WITH WARNINGS)'));
    console.log(chalk.yellow(`${totalFailed} recommended checks failed`));
  } else {
    console.log(chalk.green.bold('\n✅ PRODUCTION READY!'));
  }
}

verifyProductionReadiness();
