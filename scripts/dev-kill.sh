#!/bin/bash

# Kill any orphaned Care Commons development processes

echo "🔍 Searching for Care Commons development processes..."

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Find all processes that might be related to care-commons dev
# 1. npm run dev processes
NPM_PIDS=$(ps -ef | grep -E "npm run dev" | grep -v grep | grep -E "(dev:web|dev:server|packages/web|packages/app)" | awk '{print $2}')

# 2. tsx processes (both watch and dev-server)
TSX_PIDS=$(ps -ef | grep "tsx" | grep -v grep | grep -E "(server.ts|dev-server.ts|packages/app)" | awk '{print $2}')

# 3. vite processes
VITE_PIDS=$(ps -ef | grep "vite" | grep -v grep | grep -E "(packages/web|care-commons)" | awk '{print $2}')

# 4. shell wrapper processes
SH_PIDS=$(ps -ef | grep -E "sh -c.*packages/(web|app)" | grep -v grep | awk '{print $2}')

# 5. node processes running server.ts or with tsx loader in care-commons directory
NODE_PIDS=$(ps -ef | grep node | grep -v grep | grep -E "(server.ts|tsx/dist|care-commons)" | grep -E "(server.ts|tsx)" | awk '{print $2}')

# Combine all PIDs and remove duplicates
ALL_PIDS=$(echo "$NPM_PIDS $TSX_PIDS $VITE_PIDS $SH_PIDS $NODE_PIDS" | tr ' ' '\n' | sort -u | grep -v '^$' | tr '\n' ' ')

if [ -z "$ALL_PIDS" ] || [ "$ALL_PIDS" = " " ]; then
  echo "✅ No orphaned processes found"
  exit 0
fi

echo "Found processes:"
for PID in $ALL_PIDS; do
  if [ -n "$PID" ]; then
    ps -p "$PID" -o pid,etime,command | tail -1
  fi
done

echo ""
echo "⚠️  Killing processes..."

for PID in $ALL_PIDS; do
  if [ -n "$PID" ]; then
    kill -9 "$PID" 2>/dev/null && echo "  ✓ Killed PID $PID" || echo "  ✗ PID $PID already dead"
  fi
done

echo "✅ Cleanup complete"
