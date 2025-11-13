# Claude Autonomous Task Management System

This directory contains all tasks for the Care Commons autonomous development workflow.

## Overview

The task management system enables continuous, autonomous development by:
- Tracking all work in sequential, numbered markdown files
- Maintaining clear status, priority, and acceptance criteria
- Documenting technical decisions and completion notes
- Enabling perpetual development loops

## Task Lifecycle

```
┌─────────────────────────────────────────┐
│  1. Scan claude/ for pending tasks      │
│     ↓                                   │
│  2. No tasks? Create new tasks.         │
│     ↓                                   │
│  3. Select highest-priority task        │
│     ↓                                   │
│  4. Implement feature on feature branch │
│     ↓                                   │
│  5. Run tests + linters locally         │
│     ↓                                   │
│  6. Push branch + create PR             │
│     ↓                                   │
│  7. Wait for CI checks                  │
│     ↓                                   │
│  8. Checks pass? Merge to develop       │
│     ↓                                   │
│  9. Mark task completed                 │
│     ↓                                   │
│ 10. GOTO Step 1                         │
└─────────────────────────────────────────┘
```

## Task File Format

**Filename**: `NNNN-brief-description.md`
- `NNNN`: Zero-padded sequential number (0000-9999)
- `brief-description`: Kebab-case, max 60 characters

**Structure**: See template in any existing task file

## Priority Levels

1. **High**: Core product features, critical bugs, security issues
2. **Medium**: Developer velocity, performance optimization, refactoring
3. **Low**: Documentation, minor improvements, technical debt

## Current Task Status

Run this to see pending tasks:
```bash
grep -r "^\- \[ \] In Progress" claude/ | wc -l  # In Progress
grep -r "^\- \[ \] To Do" claude/ | wc -l        # To Do
grep -r "^\- \[x\] Completed" claude/ | wc -l    # Completed
```

## Guidelines

- **One task = One feature**: Don't combine unrelated work
- **Break down large features**: Target ~4-8 hours human time per task
- **Always update status**: Keep task files current
- **Document decisions**: Use Technical Notes section
- **Track relationships**: Link dependent tasks

## Next Steps

To continue the autonomous loop:
1. Scan for tasks with `[ ] In Progress` or `[ ] To Do`
2. Select highest-priority incomplete task
3. Execute the task following the workflow
4. Mark completed and create new tasks as needed
