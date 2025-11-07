#!/usr/bin/env tsx

import { writeFileSync, readFileSync } from "fs";

interface DeploymentMetric {
  timestamp: string;
  environment: string;
  duration: number;
  success: boolean;
  commit: string;
  deployer: string;
}

const metric: DeploymentMetric = {
  timestamp: new Date().toISOString(),
  environment: process.env.ENVIRONMENT || "unknown",
  duration: parseInt(process.env.DEPLOYMENT_DURATION || "0"),
  success: process.env.DEPLOYMENT_SUCCESS === "true",
  commit: process.env.GITHUB_SHA || "unknown",
  deployer: process.env.GITHUB_ACTOR || "unknown",
};

// Append to metrics file
const metricsFile = ".deployment-metrics.jsonl";
const existing = readFileSync(metricsFile, "utf-8").split("\n").filter(Boolean);
existing.push(JSON.stringify(metric));

writeFileSync(metricsFile, existing.join("\n") + "\n");

console.log("✅ Deployment metrics recorded");
