#!/usr/bin/env tsx
/**
 * Script to update TODO comments with standardized categorization format
 *
 * This script:
 * 1. Finds all TODO/FIXME/HACK comments in the codebase
 * 2. Categorizes them by priority (p0, p1, p2, future)
 * 3. Adds context including related tasks, impact, and status
 * 4. Replaces the old comments with the new formatted versions
 *
 * Usage: tsx scripts/update-todos.ts
 */

import fs from 'fs';
import path from 'path';

function findTsFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, dist, build, .next
      if (!['node_modules', 'dist', 'build', '.next', '.git'].includes(file)) {
        findTsFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      if (!filePath.includes('update-todos.ts')) {
        fileList.push(filePath);
      }
    }
  }

  return fileList;
}

interface TODOMapping {
  pattern: RegExp;
  replacement: string;
  priority: 'p0' | 'p1' | 'p2' | 'future';
  task?: string;
}

const mappings: TODOMapping[] = [
  // P0 - Critical (EVV Aggregator)
  {
    pattern: /\/\/ TODO: Implement actual HTTP POST to aggregator/g,
    replacement: '// TODO(p0/integration): Implement actual HTTP POST to EVV aggregator\n    //   Status: Tracked in Task 0049 - EVV Aggregator Integration\n    //   Blocking: Production launch - EVV compliance failure without this',
    priority: 'p0',
    task: '0049',
  },
  {
    pattern: /\/\/ TODO: Replace with actual HTTP client implementation/g,
    replacement: '// TODO(p0/integration): Replace with actual HTTP client implementation\n    //   Status: Tracked in Task 0049 - EVV Aggregator Integration\n    //   Blocking: Production launch - state compliance requirement',
    priority: 'p0',
    task: '0049',
  },

  // P1 - High (Family Engagement)
  {
    pattern: /\/\/ FIXME: Trigger actual notification delivery \(email, SMS, push\)/g,
    replacement: '// TODO(p1/integration): Trigger actual notification delivery (email, SMS, push)\n    //   Status: Tracked in Task 0067 - Notification Delivery System\n    //   Impact: Families receive zero proactive notifications',
    priority: 'p1',
    task: '0067',
  },
  {
    pattern: /senderName: context\.userId, \/\/ FIXME: Get actual user name/g,
    replacement: 'senderName: context.userId, // TODO(p1/integration): Get actual user name from user provider\n        //   Status: Tracked in Task 0068 - Family Engagement Data Integration\n        //   Impact: UX shows "User 123" instead of names',
    priority: 'p1',
    task: '0068',
  },
  {
    pattern: /\/\/ FIXME: Get thread to validate access and get clientId, familyMemberId/g,
    replacement: '// TODO(p1/security): Get thread to validate access and get clientId, familyMemberId\n    //   Status: Tracked in Task 0068 - Family Engagement Data Integration\n    //   Impact: Missing access control validation',
    priority: 'p1',
    task: '0068',
  },
  {
    pattern: /\/\/ FIXME: Get upcoming visits from visit summary table/g,
    replacement: '// TODO(p1/integration): Get upcoming visits from visit summary table\n    //   Status: Tracked in Task 0068 - Family Engagement Data Integration\n    //   Impact: Notifications missing visit information',
    priority: 'p1',
    task: '0068',
  },
  {
    pattern: /name: 'Client Name', \/\/ FIXME: Fetch from client service/g,
    replacement: 'name: \'Client Name\', // TODO(p1/integration): Fetch from client service\n          //   Status: Tracked in Task 0068 - Family Engagement Data Integration\n          //   Impact: Missing client name in notifications',
    priority: 'p1',
    task: '0068',
  },
  {
    pattern: /activeCarePlan: undefined \/\/ FIXME: Fetch from care plan service/g,
    replacement: 'activeCarePlan: undefined // TODO(p1/integration): Fetch from care plan service\n      //   Status: Tracked in Task 0068 - Family Engagement Data Integration\n      //   Impact: Missing care plan data in notifications',
    priority: 'p1',
    task: '0068',
  },

  // P2 - Medium
  {
    pattern: /\/\/ TODO: Filter holidays if skipHolidays is true/g,
    replacement: '// TODO(p2/feature): Filter holidays if skipHolidays is true\n    //   Status: Tracked in Task 0071 - Holiday Filtering\n    //   Impact: Coordinators manually delete holiday visits',
    priority: 'p2',
    task: '0071',
  },
  {
    pattern: /\/\/ TODO: Rewrite using raw SQL - see ARCHITECTURAL_ISSUES\.md/g,
    replacement: '// TODO(p2/optimization): Rewrite using raw SQL for performance\n    //   Status: Tracked in Task 0072 - Analytics SQL Optimization\n    //   Impact: Slow queries (>10s) with large datasets',
    priority: 'p2',
    task: '0072',
  },
  {
    pattern: /\/\/ TODO: Calculate statistics/g,
    replacement: '// TODO(p2/feature): Calculate statistics\n    //   Status: Not yet tracked\n    //   Impact: Audit statistics not available',
    priority: 'p2',
  },
  {
    pattern: /\/\/ TODO: Retry the submission/g,
    replacement: '// TODO(p2/feature): Retry the submission\n      //   Status: Not yet tracked\n      //   Impact: No automatic retry on submission failures',
    priority: 'p2',
  },
  {
    pattern: /\/\/ TODO: Implement client signature validation once EVVRecord type is extended/g,
    replacement: '// TODO(p2/feature): Implement client signature validation once EVVRecord type is extended\n          //   Status: Not yet tracked\n          //   Impact: Client signature validation not enforced',
    priority: 'p2',
  },
  {
    pattern: /\/\/ TODO: Implement photo verification validation once EVVRecord type is extended/g,
    replacement: '// TODO(p2/feature): Implement photo verification validation once EVVRecord type is extended\n          //   Status: Not yet tracked\n          //   Impact: Photo verification validation not enforced',
    priority: 'p2',
  },

  // Future - Mobile App TODOs
  {
    pattern: /\/\/ TODO: Add voice-to-text button/g,
    replacement: '// TODO(future/feature): Add voice-to-text button for documentation\n          //   Deferred: Nice-to-have UX enhancement, not blocking',
    priority: 'future',
  },
  {
    pattern: /\/\/ TODO: Load from WatermelonDB and sync with API/g,
    replacement: '// TODO(future/integration): Load from WatermelonDB and sync with API\n      //   Deferred: Mobile offline-first infrastructure - Tasks 0055-0058',
    priority: 'future',
  },
  {
    pattern: /\/\/ TODO: Load from WatermelonDB/g,
    replacement: '// TODO(future/integration): Load from WatermelonDB\n      //   Deferred: Mobile offline-first infrastructure - Tasks 0055-0058',
    priority: 'future',
  },
  {
    pattern: /\/\/ TODO: Save to WatermelonDB/g,
    replacement: '// TODO(future/integration): Save to WatermelonDB\n      //   Deferred: Mobile offline-first infrastructure - Tasks 0055-0058',
    priority: 'future',
  },
  {
    pattern: /\/\/ TODO: Save to WatermelonDB and queue for sync/g,
    replacement: '// TODO(future/integration): Save to WatermelonDB and queue for sync\n      //   Deferred: Mobile offline-first infrastructure - Tasks 0055-0058',
    priority: 'future',
  },
  {
    pattern: /\/\/ TODO: Queue check-in for sync/g,
    replacement: '// TODO(future/integration): Queue check-in for sync\n      //   Deferred: Mobile offline sync infrastructure',
    priority: 'future',
  },
  {
    pattern: /\/\/ TODO: Queue check-out for sync/g,
    replacement: '// TODO(future/integration): Queue check-out for sync\n      //   Deferred: Mobile offline sync infrastructure',
    priority: 'future',
  },
  {
    pattern: /\/\/ TODO: Integrate with actual location service/g,
    replacement: '// TODO(future/integration): Integrate with actual location service\n      //   Deferred: Mobile location service integration',
    priority: 'future',
  },
  {
    pattern: /\/\/ TODO: Integrate with actual biometric service/g,
    replacement: '// TODO(future/integration): Integrate with actual biometric service\n      //   Deferred: Mobile biometric service integration',
    priority: 'future',
  },
  {
    pattern: /\/\/ TODO: Add queueSignature method to OfflineQueueService/g,
    replacement: '// TODO(future/integration): Add queueSignature method to OfflineQueueService\n      //   Deferred: Mobile offline sync infrastructure',
    priority: 'future',
  },
  {
    pattern: /\/\/ TODO: Integrate with offlineQueueService\.enqueue\(\)/g,
    replacement: '// TODO(future/integration): Integrate with offlineQueueService.enqueue()\n        //   Deferred: Mobile offline sync infrastructure',
    priority: 'future',
  },
  {
    pattern: /\/\/ TODO: Add phone number to visit data/g,
    replacement: '// TODO(future/feature): Add phone number to visit data\n    //   Deferred: Nice-to-have feature',
    priority: 'future',
  },
  {
    pattern: /\/\/ TODO: Implement export functionality/g,
    replacement: '// TODO(future/feature): Implement export functionality\n    //   Deferred: Nice-to-have feature',
    priority: 'future',
  },
  {
    pattern: /\/\/ TODO: Get from visit/g,
    replacement: '// TODO(future/integration): Get from visit\n      //   Deferred: Data integration',
    priority: 'future',
  },
  {
    pattern: /\/\/ TODO: Handle signature capture callback/g,
    replacement: '// TODO(future/integration): Handle signature capture callback\n    //   Deferred: Signature integration',
    priority: 'future',
  },
  {
    pattern: /clientPresent: true, \/\/ TODO: Ask caregiver/g,
    replacement: 'clientPresent: true, // TODO(future/feature): Ask caregiver\n        //   Deferred: UI enhancement',
    priority: 'future',
  },
  {
    pattern: /completionNotes: undefined, \/\/ TODO: Prompt caregiver for notes/g,
    replacement: 'completionNotes: undefined, // TODO(future/feature): Prompt caregiver for notes\n        //   Deferred: UI enhancement',
    priority: 'future',
  },
  {
    pattern: /tasksCompleted: undefined, \/\/ TODO: Get from task list/g,
    replacement: 'tasksCompleted: undefined, // TODO(future/integration): Get from task list\n        //   Deferred: Task integration',
    priority: 'future',
  },
  {
    pattern: /clientSignature: undefined, \/\/ TODO: Capture signature if required/g,
    replacement: 'clientSignature: undefined, // TODO(future/feature): Capture signature if required\n        //   Deferred: Signature feature',
    priority: 'future',
  },
  {
    pattern: /\{\/\* TODO: Show map with geofence circle \*\/\}/g,
    replacement: '{/* TODO(future/feature): Show map with geofence circle\n              Deferred: Nice-to-have feature */}',
    priority: 'future',
  },
  {
    pattern: /hasBiometric: false, \/\/ TODO: Check if biometric hardware available \(requires expo-local-authentication\)/g,
    replacement: 'hasBiometric: false, // TODO(future/integration): Check if biometric hardware available (requires expo-local-authentication)\n      //   Deferred: Mobile device capabilities',
    priority: 'future',
  },
  {
    pattern: /canBackgroundLocation: true, \/\/ TODO: Check permissions \(requires expo-location permissions check\)/g,
    replacement: 'canBackgroundLocation: true, // TODO(future/integration): Check permissions (requires expo-location permissions check)\n      //   Deferred: Mobile device capabilities',
    priority: 'future',
  },
  {
    pattern: /\/\/ TODO: Implement actual availability checking using startTime and endTime/g,
    replacement: '// TODO(future/feature): Implement actual availability checking using startTime and endTime\n    //   Deferred: Caregiver availability validation',
    priority: 'future',
  },
  {
    pattern: /\/\/ TODO: In a full implementation, this would join with visits table/g,
    replacement: '// TODO(future/optimization): In a full implementation, this would join with visits table\n    //   Deferred: Query optimization opportunity',
    priority: 'future',
  },
  {
    pattern: /\/\/ TODO: Replace with actual HHAeXchange API call/g,
    replacement: '// TODO(future/integration): Replace with actual HHAeXchange API call\n    //   Deferred: Texas EVV provider implementation',
    priority: 'future',
  },
];

function updateTODOs() {
  console.log('🔍 Searching for TODO/FIXME/HACK comments...\n');

  const files = findTsFiles(process.cwd());

  let updatedCount = 0;
  let updatedFiles = 0;

  for (const filePath of files) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    for (const mapping of mappings) {
      const matches = content.match(mapping.pattern);
      if (matches) {
        content = content.replace(mapping.pattern, mapping.replacement);
        modified = true;
        updatedCount += matches.length;
        const relativePath = path.relative(process.cwd(), filePath);
        console.log(`✓ Updated ${relativePath}: ${matches.length}x ${mapping.priority} TODO`);
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8');
      updatedFiles++;
    }
  }

  console.log(`\n✅ Updated ${updatedCount} TODOs across ${updatedFiles} files`);
  console.log(`\nPriority breakdown:`);

  const p0Count = mappings.filter(m => m.priority === 'p0').length;
  const p1Count = mappings.filter(m => m.priority === 'p1').length;
  const p2Count = mappings.filter(m => m.priority === 'p2').length;
  const futureCount = mappings.filter(m => m.priority === 'future').length;

  console.log(`  🔴 P0 (Critical): ${p0Count} mappings`);
  console.log(`  🟠 P1 (High): ${p1Count} mappings`);
  console.log(`  🟡 P2 (Medium): ${p2Count} mappings`);
  console.log(`  🟢 Future: ${futureCount} mappings`);
}

try {
  updateTODOs();
} catch (error) {
  console.error('Error updating TODOs:', error);
  process.exit(1);
}
