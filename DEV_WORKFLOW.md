# Development Workflow

## First Time Setup

**IMPORTANT**: Before running the dev servers for the first time, you need to seed the database with demo data:

```bash
# Reset database and seed with comprehensive Texas demo data
npm run db:reset:demo
```

This creates:
- **61 clients** (all Texas-based)
- **35 caregivers** (geographically distributed across TX cities)
- **605 visits** with realistic EVV data
- **51 care plans** with goals and interventions
- **41 family members** with portal access
- **87 invoices** for billing
- **Demo users** for all roles (Admin, Coordinator, Caregiver, Nurse, Family)

**Login credentials**: All demo accounts use password `Demo123!`
- Admin: `admin@tx.carecommons.example`
- Coordinator: `coordinator@tx.carecommons.example`
- Caregiver: `caregiver@tx.carecommons.example`
- Nurse: `nurse@tx.carecommons.example`
- Family: `family@tx.carecommons.example`

## Starting Development Servers

Run a single command to start both API and Web servers:

```bash
npm run dev
```

This starts:
- **API Server** on port 3001 (packages/app)
- **Web Dev Server** on port 5173 (packages/web)

### Features

✅ **Single process** - No nested npm instances  
✅ **Port conflict detection** - Refuses to start if ports are in use  
✅ **Clean shutdown** - CTRL-C kills all child processes  
✅ **Fail fast** - Any server crash kills the entire dev session  
✅ **Minimal processes** - Runs tsx/vite directly, not via npm

## Stopping Development Servers

Press **CTRL-C** in the terminal where `npm run dev` is running.

All child processes will be killed automatically.

## Database Management

### Reseed database with fresh demo data

```bash
npm run db:reset:demo
```

This will:
1. Drop all tables (nuke)
2. Run migrations to recreate schema
3. Seed base data (organization, branch, admin user)
4. Seed comprehensive Texas demo data

### Other database commands

```bash
# Seed only (no reset)
npm run db:seed:demo

# Run migrations only
npm run db:migrate

# Check migration status
npm run db:migrate:status
```

## Troubleshooting

### "No clients found" or empty data

You need to seed the database:

```bash
npm run db:reset:demo
```

Then restart the dev server.

### "Port already in use" error

If you see:
```
❌ Port 3001 is already in use (API server)
   Another instance may be running. Stop it first.
```

**Option 1**: Find and stop the other instance manually  
**Option 2**: Kill all orphaned processes:

```bash
npm run dev:kill
```

This will forcefully kill any orphaned tsx/vite processes related to care-commons.

### Orphaned processes after force-kill

If you force-killed the terminal or processes got orphaned:

```bash
# Check for orphaned processes
ps -ef | grep -E "(tsx watch|vite)" | grep care-commons

# Kill them all
npm run dev:kill
```

## Individual Server Commands

If you need to run servers separately (not recommended):

```bash
# API server only
npm run dev:server

# Web dev server only
npm run dev:web

# Showcase demo only
npm run dev:showcase
```

⚠️ **Warning**: Running servers individually may create orphaned processes.  
Always prefer `npm run dev` for the full development environment.

## Architecture

The `npm run dev` command:

1. Checks if ports 3001 and 5173 are available
2. Spawns two child processes using `detached: true` for proper process group management
3. Runs `tsx watch src/server.ts` directly (not via npm)
4. Runs `vite` directly (not via npm)
5. Forwards all output with colored prefixes
6. Kills entire process groups on CTRL-C

This avoids the nested npm process problem that created zombie processes.
