#!/bin/sh

set -eux

find . -type f -name "package-lock.json" -exec rm -f {} +
find . -type d -name "node_modules" -exec rm -rf {} +
ncu -u --packageFile '**/package.json'
npm install
npm run db:nuke
npm run db:migrate
npm run db:seed
npm run build
npm run lint
npm run typecheck
npm test
npm run snyk
