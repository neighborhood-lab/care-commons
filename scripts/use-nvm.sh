#!/bin/bash
# Helper script to ensure NVM is loaded and correct Node version is used
# This is needed for non-interactive shells (VS Code tasks, CI/CD, etc.)

# Load NVM if it exists
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1091
  source "$NVM_DIR/nvm.sh"
fi

# Use the version specified in .nvmrc if it exists, otherwise use 22
if [ -f .nvmrc ]; then
  nvm use
else
  nvm use 22 2>/dev/null || nvm install 22
fi
