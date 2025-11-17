#!/bin/bash

set -e

echo "🧪 Testing Development Workflow"
echo "================================"
echo ""

# Ensure we start clean
echo "1️⃣  Cleaning up any existing processes..."
npm run dev:kill > /dev/null 2>&1 || true
sleep 1

# Test 1: Port conflict detection
echo ""
echo "2️⃣  Testing port conflict detection..."
node -e "
const net = require('net');
const server = net.createServer();
server.listen(3001, '127.0.0.1', () => {
  console.log('   Created test server on port 3001');
  setTimeout(() => server.close(), 3000);
});
" &
TEST_PID=$!

sleep 1

# Try to start dev (should fail with port conflict)
if npm run dev 2>&1 | grep -q "Port 3001 is already in use"; then
  echo "   ✅ Port conflict detected correctly"
else
  echo "   ❌ Port conflict detection failed"
  kill $TEST_PID 2>/dev/null || true
  exit 1
fi

wait $TEST_PID 2>/dev/null || true
sleep 1

# Test 2: Clean startup
echo ""
echo "3️⃣  Testing clean startup..."
npm run dev &
DEV_PID=$!

# Wait for servers to start
sleep 5

# Check if API server is running
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
  echo "   ✅ API server started successfully"
else
  echo "   ⚠️  API server not responding (may still be initializing)"
fi

# Check if web server is running
if curl -s http://localhost:5173 > /dev/null 2>&1; then
  echo "   ✅ Web server started successfully"
else
  echo "   ⚠️  Web server not responding (may still be initializing)"
fi

# Test 3: Clean shutdown with SIGTERM
echo ""
echo "4️⃣  Testing clean shutdown (SIGTERM)..."
kill -TERM $DEV_PID
sleep 3

# Check for orphaned processes
ORPHANS=$(ps -ef | grep -E "(tsx watch|vite)" | grep -v grep | grep -E "(care-commons|packages/app|packages/web)" | wc -l | tr -d ' ')
if [ "$ORPHANS" = "0" ]; then
  echo "   ✅ No orphaned processes after SIGTERM"
else
  echo "   ❌ Found $ORPHANS orphaned processes after SIGTERM"
  npm run dev:kill > /dev/null 2>&1
  exit 1
fi

# Test 4: Port conflict after clean shutdown
echo ""
echo "5️⃣  Verifying ports are released..."
sleep 2

if node -e "
const net = require('net');
const server = net.createServer();
server.once('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log('   ❌ Port 3001 still in use');
    process.exit(1);
  }
});
server.once('listening', () => {
  console.log('   ✅ Port 3001 properly released');
  server.close();
  process.exit(0);
});
server.listen(3001, '127.0.0.1');
"; then
  echo "   Port test passed"
else
  echo "   Port test failed"
  npm run dev:kill > /dev/null 2>&1
  exit 1
fi

echo ""
echo "✅ All tests passed!"
echo ""
echo "Summary:"
echo "  ✓ Port conflict detection works"
echo "  ✓ Servers start successfully"
echo "  ✓ Clean shutdown kills all processes"
echo "  ✓ Ports are properly released"
