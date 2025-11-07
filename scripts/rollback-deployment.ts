#!/usr/bin/env tsx

import { execSync } from "child_process";

async function rollback() {
  console.log("🔄 Rolling back deployment...");

  // Get previous deployment from Vercel
  const deployments = JSON.parse(execSync("vercel ls --json").toString());

  const previousDeployment = deployments[1]; // Second most recent

  if (!previousDeployment) {
    console.error("❌ No previous deployment found");
    process.exit(1);
  }

  // Promote previous deployment to production
  execSync(`vercel promote ${previousDeployment.url} --scope=care-commons`);

  console.log("✅ Rollback complete");
  console.log(`Active deployment: ${previousDeployment.url}`);

  // Run health check on rolled-back deployment
  const healthCheck = execSync(`curl -f ${previousDeployment.url}/health`);
  console.log("✅ Health check passed");
}

rollback();
