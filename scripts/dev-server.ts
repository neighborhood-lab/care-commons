#!/usr/bin/env tsx

import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import chalk from 'chalk';

// Port configuration
const API_PORT = 3001;
const WEB_PORT = 5173;

// Track child processes for cleanup
const children: Array<ReturnType<typeof spawn>> = [];
let isShuttingDown = false;

/**
 * Check if a port is already in use
 */
async function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    
    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    
    server.listen(port, '127.0.0.1');
  });
}

/**
 * Kill all child processes
 */
function cleanup(exitCode = 0): void {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(chalk.yellow('\n🛑 Shutting down development servers...'));

  // Kill all child processes
  for (const child of children) {
    try {
      // Kill the entire process group to catch nested processes
      if (child.pid) {
        process.kill(-child.pid, 'SIGTERM');
      }
    } catch (error) {
      // Process may already be dead
    }
  }

  // Force exit after a timeout
  setTimeout(() => {
    console.log(chalk.red('⚠️  Force killing remaining processes'));
    process.exit(exitCode);
  }, 2000);
}

/**
 * Setup signal handlers for clean shutdown
 */
function setupSignalHandlers(): void {
  process.on('SIGINT', () => cleanup(0));
  process.on('SIGTERM', () => cleanup(0));
  process.on('exit', () => cleanup());
}

/**
 * Spawn a development server
 */
function startServer(
  name: string,
  command: string,
  args: string[],
  cwd: string,
  color: 'blue' | 'magenta' | 'green' | 'yellow' | 'red'
): void {
  console.log(chalk[color](`🚀 Starting ${name}...`));

  const child = spawn(command, args, {
    cwd,
    stdio: 'inherit',
    shell: false,
    detached: true, // Create new process group for cleanup
    env: {
      ...process.env,
      FORCE_COLOR: '1', // Enable colors in child processes
    },
  });

  children.push(child);

  child.on('error', (error) => {
    console.error(chalk.red(`❌ ${name} failed to start:`), error);
    cleanup(1);
  });

  child.on('exit', (code, signal) => {
    if (!isShuttingDown) {
      console.error(
        chalk.red(`❌ ${name} exited unexpectedly (code: ${code}, signal: ${signal})`)
      );
      cleanup(code ?? 1);
    }
  });
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  console.log(chalk.blue.bold('🏥 Care Commons - Starting Development Servers\n'));

  // Check if ports are already in use
  const apiInUse = await isPortInUse(API_PORT);
  const webInUse = await isPortInUse(WEB_PORT);

  if (apiInUse) {
    console.error(
      chalk.red(`❌ Port ${API_PORT} is already in use (API server)`),
      '\n',
      chalk.yellow('   Another instance may be running. Stop it first.')
    );
    process.exit(1);
  }

  if (webInUse) {
    console.error(
      chalk.red(`❌ Port ${WEB_PORT} is already in use (Web dev server)`),
      '\n',
      chalk.yellow('   Another instance may be running. Stop it first.')
    );
    process.exit(1);
  }

  // Setup signal handlers
  setupSignalHandlers();

  // Start servers (run tsx directly, not nested npm)
  const rootDir = process.cwd();
  
  startServer(
    'API',
    'npx',
    ['tsx', 'watch', 'src/server.ts'],
    `${rootDir}/packages/app`,
    'blue'
  );

  startServer(
    'Web',
    'npx',
    ['vite'],
    `${rootDir}/packages/web`,
    'magenta'
  );

  console.log(chalk.green('\n✅ Development servers started\n'));
  console.log(chalk.gray('   Press CTRL-C to stop all servers\n'));
}

// Run main
main().catch((error) => {
  console.error(chalk.red('Fatal error:'), error);
  cleanup(1);
});
