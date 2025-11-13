#!/usr/bin/env tsx

/**
 * Fix ESM Import Extensions Script
 * 
 * Adds .js extensions to relative imports that are missing them.
 * This is required for ESM compatibility in serverless environments.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

let filesFixed = 0;
let importsFixed = 0;

/**
 * Fix imports in a single file
 */
function fixImportsInFile(filePath: string): boolean {
  const content = readFileSync(filePath, 'utf-8');
  let modified = false;
  let newContent = content;

  // Match: import ... from './path' or '../path' (without .js extension)
  // But NOT: import ... from '@scope/package' or 'package-name'
  const importPattern = /from\s+(['"])(\.\.[\/\\].*?|\.\/.*?)\1/g;

  newContent = content.replace(importPattern, (match, quote, path) => {
    // Skip if already has extension
    if (path.endsWith('.js') || path.endsWith('.json') || path.endsWith('.css')) {
      return match;
    }
    
    // Add .js extension
    modified = true;
    importsFixed++;
    return `from ${quote}${path}.js${quote}`;
  });

  if (modified) {
    writeFileSync(filePath, newContent, 'utf-8');
    filesFixed++;
    console.log(`  ✓ Fixed: ${relative(ROOT_DIR, filePath)}`);
    return true;
  }

  return false;
}

/**
 * Process directory recursively
 */
function processDirectory(dir: string) {
  try {
    const files = readdirSync(dir);
    
    for (const file of files) {
      const filePath = join(dir, file);
      const stat = statSync(filePath);
      
      if (stat.isDirectory()) {
        // Skip node_modules, dist, and test directories
        if (!file.includes('node_modules') && !file.includes('dist') && !file.includes('__tests__')) {
          processDirectory(filePath);
        }
      } else if (file.endsWith('.ts') && !file.endsWith('.d.ts') && !file.endsWith('.test.ts')) {
        fixImportsInFile(filePath);
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║          Fix ESM Import Extensions                   ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  const dirsToFix = [
    'packages/app/src',
    'api',
  ];

  for (const dir of dirsToFix) {
    const fullPath = join(ROOT_DIR, dir);
    console.log(`\nProcessing: ${dir}`);
    console.log('─'.repeat(60));
    processDirectory(fullPath);
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`✅ Complete!`);
  console.log(`   Files modified: ${filesFixed}`);
  console.log(`   Imports fixed: ${importsFixed}`);
  console.log('═'.repeat(60) + '\n');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
