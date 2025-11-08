#!/usr/bin/env tsx
/**
 * Script to analyze and report TODO statistics across the codebase
 *
 * This script:
 * 1. Searches for all TODO comments
 * 2. Categorizes them by priority (p0, p1, p2, future)
 * 3. Reports statistics and highlights critical issues
 *
 * Usage: tsx scripts/todo-stats.ts
 */

import { execSync } from 'child_process';

function getTODOStats() {
  try {
    // Search for all TODO comments in TypeScript files (exclude scripts directory)
    const output = execSync(
      'grep -r "TODO(" --include="*.ts" --include="*.tsx" --exclude-dir=scripts . 2>/dev/null || true',
      {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd(),
      }
    ).toString();

    const lines = output.split('\n').filter(Boolean);

    const stats = {
      total: lines.length,
      p0: lines.filter(l => l.includes('TODO(p0')).length,
      p1: lines.filter(l => l.includes('TODO(p1')).length,
      p2: lines.filter(l => l.includes('TODO(p2')).length,
      future: lines.filter(l => l.includes('TODO(future')).length,
      uncategorized: 0,
    };

    // Check for old-style TODOs (without priority, exclude scripts directory)
    const allTodos = execSync(
      'grep -r "TODO:" --include="*.ts" --include="*.tsx" --exclude-dir=scripts . 2>/dev/null || true',
      {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd(),
      }
    ).toString();

    const allTodoLines = allTodos.split('\n').filter(Boolean);
    const categorizedPattern = /TODO\((p0|p1|p2|future)/;
    stats.uncategorized = allTodoLines.filter(
      line => !categorizedPattern.test(line)
    ).length;

    console.log('📋 TODO Statistics\n');
    console.log(`Total TODOs: ${stats.total}`);
    console.log(`  🔴 P0 (Critical): ${stats.p0}`);
    console.log(`  🟠 P1 (High): ${stats.p1}`);
    console.log(`  🟡 P2 (Medium): ${stats.p2}`);
    console.log(`  🟢 Future: ${stats.future}`);
    console.log(`  ⚪ Uncategorized: ${stats.uncategorized}`);

    if (stats.uncategorized > 0) {
      console.log('\n⚠️  Warning: Uncategorized TODOs found. Please categorize them.');
      console.log('Run: grep -r "TODO:" --include="*.ts" --include="*.tsx" . | grep -v "TODO("');
    }

    if (stats.p0 > 0) {
      console.log('\n🚨 Critical TODOs detected - these block production!');
      console.log('\nP0 TODOs:');
      const p0Lines = lines.filter(l => l.includes('TODO(p0'));
      p0Lines.forEach(line => {
        const [file, ...rest] = line.split(':');
        console.log(`  - ${file}`);
      });
    }

    if (stats.p1 > 0) {
      console.log('\n⚡ High Priority TODOs - should be addressed soon');
    }

    console.log('\n📊 Priority Distribution:');
    const total = stats.total || 1; // Avoid division by zero
    console.log(`  Critical: ${((stats.p0 / total) * 100).toFixed(1)}%`);
    console.log(`  High: ${((stats.p1 / total) * 100).toFixed(1)}%`);
    console.log(`  Medium: ${((stats.p2 / total) * 100).toFixed(1)}%`);
    console.log(`  Future: ${((stats.future / total) * 100).toFixed(1)}%`);

    console.log('\n💡 Tips:');
    console.log('  - See docs/TODO_AUDIT.md for detailed TODO breakdown');
    console.log('  - Run scripts/update-todos.ts to categorize uncategorized TODOs');
    console.log('  - Review CONTRIBUTING.md for TODO policy');

    return stats;
  } catch (error) {
    console.error('Error collecting TODO stats:', error);
    process.exit(1);
  }
}

getTODOStats();
