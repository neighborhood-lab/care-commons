#!/usr/bin/env tsx

import { execSync } from "child_process";
import chalk from "chalk";

interface Check {
  name: string;
  fn: () => Promise<boolean>;
  critical: boolean;
}

const checks: Check[] = [
  {
    name: "Database connection",
    critical: true,
    fn: async () => {
      try {
        execSync("npm run db:ping", { stdio: "ignore" });
        return true;
      } catch {
        return false;
      }
    },
  },
  {
    name: "Migration status",
    critical: true,
    fn: async () => {
      const status = execSync("npm run db:migrate:status").toString();
      return !status.includes("pending");
    },
  },
  {
    name: "Test coverage",
    critical: true,
    fn: async () => {
      try {
        execSync("npm test -- --coverage --passWithNoTests", {
          stdio: "ignore",
        });
        return true;
      } catch {
        return false;
      }
    },
  },
  {
    name: "No TypeScript errors",
    critical: true,
    fn: async () => {
      try {
        execSync("npm run typecheck", { stdio: "ignore" });
        return true;
      } catch {
        return false;
      }
    },
  },
  {
    name: "No ESLint errors",
    critical: true,
    fn: async () => {
      try {
        execSync("npm run lint", { stdio: "ignore" });
        return true;
      } catch {
        return false;
      }
    },
  },
  {
    name: "Environment variables set",
    critical: true,
    fn: async () => {
      const required = [
        "DATABASE_URL",
        "JWT_SECRET",
        "JWT_REFRESH_SECRET",
        "ENCRYPTION_KEY",
      ];

      return required.every((key) => process.env[key]);
    },
  },
  {
    name: "Sensitive data not in logs",
    critical: true,
    fn: async () => {
      const output = execSync("npm run build 2>&1").toString();
      const forbidden = ["password", "secret", "api_key", "token"];

      return !forbidden.some((word) => output.toLowerCase().includes(word));
    },
  },
];

async function runPreDeployChecks() {
  console.log(chalk.blue.bold("\n🔍 Running pre-deployment checks...\n"));

  let passed = 0;
  let failed = 0;
  let criticalFailures: string[] = [];

  for (const check of checks) {
    process.stdout.write(`${check.name}... `);

    try {
      const result = await check.fn();

      if (result) {
        console.log(chalk.green("✅ PASS"));
        passed++;
      } else {
        console.log(chalk.red("❌ FAIL"));
        failed++;

        if (check.critical) {
          criticalFailures.push(check.name);
        }
      }
    } catch (error) {
      console.log(chalk.red("❌ ERROR"));
      failed++;

      if (check.critical) {
        criticalFailures.push(check.name);
      }
    }
  }

  console.log(chalk.blue.bold("\n📊 Results:"));
  console.log(`  Passed: ${chalk.green(passed)}`);
  console.log(`  Failed: ${chalk.red(failed)}`);

  if (criticalFailures.length > 0) {
    console.log(chalk.red.bold("\n❌ DEPLOYMENT BLOCKED"));
    console.log(chalk.red("Critical failures:"));
    criticalFailures.forEach((name) => console.log(chalk.red(`  - ${name}`)));
    process.exit(1);
  } else if (failed > 0) {
    console.log(chalk.yellow.bold("\n⚠️  Non-critical failures detected"));
    console.log(chalk.yellow("Deployment can proceed with caution"));
  } else {
    console.log(chalk.green.bold("\n✅ All checks passed! Ready to deploy"));
  }
}

runPreDeployChecks();
