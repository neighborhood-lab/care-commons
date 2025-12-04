#!/usr/bin/env tsx
/**
 * Background Issue Creator
 *
 * Slowly creates GitHub issues from issues-backlog.json to avoid rate limiting.
 * Tracks progress so it can be resumed if interrupted.
 *
 * Usage:
 *   npx tsx scripts/create-issues.ts [--dry-run] [--delay=10000]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DELAY_MS = parseInt(process.env.ISSUE_DELAY_MS || '10000', 10); // 10 seconds between issues
const BACKLOG_FILE = path.join(__dirname, 'issues-backlog.json');
const PROGRESS_FILE = path.join(__dirname, '.issues-progress.json');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'neighborhood-lab';
const REPO_NAME = 'folk-care';

// Parse CLI args
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const delayOverride = args.find(arg => arg.startsWith('--delay='));
const delay = delayOverride ? parseInt(delayOverride.split('=')[1], 10) : DELAY_MS;

interface Issue {
  priority: string;
  title: string;
  body: string;
  labels: string[];
}

interface Backlog {
  meta: {
    version: string;
    created: string;
    description: string;
    total: number;
  };
  priorities: Record<string, string>;
  issues: Issue[];
}

interface Progress {
  created: number[];
  failed: number[];
  lastIndex: number;
  totalCreated: number;
  totalFailed: number;
  startedAt: string;
  lastUpdatedAt: string;
}

/**
 * Load backlog from JSON
 */
function loadBacklog(): Backlog {
  const content = fs.readFileSync(BACKLOG_FILE, 'utf-8');
  return JSON.parse(content);
}

/**
 * Load or initialize progress
 */
function loadProgress(): Progress {
  if (fs.existsSync(PROGRESS_FILE)) {
    const content = fs.readFileSync(PROGRESS_FILE, 'utf-8');
    return JSON.parse(content);
  }

  return {
    created: [],
    failed: [],
    lastIndex: -1,
    totalCreated: 0,
    totalFailed: 0,
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
  };
}

/**
 * Save progress
 */
function saveProgress(progress: Progress): void {
  progress.lastUpdatedAt = new Date().toISOString();
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

/**
 * Create a single GitHub issue
 */
async function createIssue(issue: Issue): Promise<boolean> {
  if (!GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN environment variable not set');
  }

  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'folk-care-issue-creator',
    },
    body: JSON.stringify({
      title: issue.title,
      body: issue.body,
      labels: issue.labels,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Failed to create issue: ${response.status} ${response.statusText}`);
    console.error(error);
    return false;
  }

  const created = await response.json();
  console.log(`✅ Created issue #${created.number}: ${issue.title}`);
  return true;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Folk Care Issue Creator\n');

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No issues will be created\n');
  }

  // Load backlog and progress
  const backlog = loadBacklog();
  const progress = loadProgress();

  console.log(`📊 Backlog: ${backlog.meta.total} total issues`);
  console.log(`✅ Created: ${progress.totalCreated}`);
  console.log(`❌ Failed: ${progress.totalFailed}`);
  console.log(`⏭️  Remaining: ${backlog.meta.total - progress.totalCreated - progress.totalFailed}\n`);

  if (!GITHUB_TOKEN) {
    console.error('❌ GITHUB_TOKEN environment variable not set');
    console.error('Run: export GITHUB_TOKEN=your_token_here');
    process.exit(1);
  }

  // Process issues
  for (let i = 0; i < backlog.issues.length; i++) {
    // Skip if already processed
    if (progress.created.includes(i) || progress.failed.includes(i)) {
      continue;
    }

    const issue = backlog.issues[i];

    console.log(`\n[${i + 1}/${backlog.issues.length}] ${issue.priority} - ${issue.title}`);

    if (isDryRun) {
      console.log(`  Would create with labels: ${issue.labels.join(', ')}`);
      continue;
    }

    try {
      const success = await createIssue(issue);

      if (success) {
        progress.created.push(i);
        progress.totalCreated++;
      } else {
        progress.failed.push(i);
        progress.totalFailed++;
      }

      progress.lastIndex = i;
      saveProgress(progress);

      // Rate limiting delay (except for last issue)
      if (i < backlog.issues.length - 1) {
        console.log(`⏳ Waiting ${delay}ms before next issue...`);
        await sleep(delay);
      }
    } catch (error) {
      console.error(`❌ Error creating issue:`, error);
      progress.failed.push(i);
      progress.totalFailed++;
      progress.lastIndex = i;
      saveProgress(progress);

      // Continue to next issue after error
      await sleep(delay);
    }
  }

  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Final Summary');
  console.log('='.repeat(60));
  console.log(`✅ Successfully created: ${progress.totalCreated}`);
  console.log(`❌ Failed: ${progress.totalFailed}`);
  console.log(`📝 Total processed: ${progress.totalCreated + progress.totalFailed}/${backlog.meta.total}`);

  if (progress.totalFailed > 0) {
    console.log(`\n⚠️  Failed issue indices: ${progress.failed.join(', ')}`);
    console.log('   Review errors and retry if needed.');
  }

  if (isDryRun) {
    console.log('\n🔍 DRY RUN COMPLETE - No issues were actually created');
  } else {
    console.log('\n✨ Issue creation complete!');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Interrupted by user. Progress has been saved.');
  console.log('   Run the script again to resume from where you left off.');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n⚠️  Terminated. Progress has been saved.');
  process.exit(0);
});

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
