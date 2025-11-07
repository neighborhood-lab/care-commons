#!/usr/bin/env tsx

import { concurrently } from 'concurrently';
import chalk from 'chalk';

console.log(chalk.blue.bold('🏥 Care Commons - Starting Development Servers\n'));

const { result } = concurrently([
  {
    command: 'npm run dev:server',
    name: 'API',
    prefixColor: 'blue'
  },
  {
    command: 'npm run dev:web',
    name: 'Web',
    prefixColor: 'magenta'
  }
], {
  prefix: 'name',
  killOthers: ['failure', 'success'],
  restartTries: 3
});

result.then(
  () => console.log(chalk.green('All servers stopped')),
  (error) => console.error(chalk.red('Server error:', error))
);
