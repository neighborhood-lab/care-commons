#!/usr/bin/env bash

# Care Commons - One-Command Setup Script
# Usage: npm run setup
#
# This script will:
# - Check prerequisites (Node.js, PostgreSQL/Docker)
# - Install dependencies
# - Set up environment variables
# - Create database
# - Run migrations
# - Seed demo data
# - Build all packages
#
# Options:
#   --skip-build     Skip the build step
#   --no-demo        Seed minimal data instead of demo data
#   --use-docker     Use Docker for PostgreSQL

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Options
SKIP_BUILD=false
USE_DEMO=true
USE_DOCKER=false

# Parse command line arguments
for arg in "$@"; do
  case $arg in
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --no-demo)
      USE_DEMO=false
      shift
      ;;
    --use-docker)
      USE_DOCKER=true
      shift
      ;;
    --help)
      echo "Care Commons Setup Script"
      echo ""
      echo "Usage: npm run setup [options]"
      echo ""
      echo "Options:"
      echo "  --skip-build     Skip the build step"
      echo "  --no-demo        Seed minimal data instead of demo data"
      echo "  --use-docker     Use Docker for PostgreSQL"
      echo "  --help           Show this help message"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $arg${NC}"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🏥  Care Commons - Development Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Function to print step headers
print_step() {
  echo ""
  echo -e "${CYAN}▶ $1${NC}"
}

# Function to print success
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Function to print warning
print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

# Function to print error and exit
print_error() {
  echo -e "${RED}✗ $1${NC}"
  exit 1
}

# Check Node.js version
print_step "Checking prerequisites"
if ! command -v node &> /dev/null; then
  print_error "Node.js is not installed. Please install Node.js 22.x or higher."
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
  print_error "Node.js 22.x or higher is required (found v$(node --version))"
fi
print_success "Node.js v$(node --version)"

# Check npm version
NPM_VERSION=$(npm --version | cut -d'.' -f1)
if [ "$NPM_VERSION" -lt 10 ]; then
  print_error "npm 10.x or higher is required (found v$(npm --version))"
fi
print_success "npm v$(npm --version)"

# Check PostgreSQL or Docker
if [ "$USE_DOCKER" = true ]; then
  if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker or use PostgreSQL directly."
  fi
  print_success "Docker installed"

  # Check if PostgreSQL container is already running
  if docker ps | grep -q care-commons-db; then
    print_warning "PostgreSQL container already running"
  else
    print_step "Starting PostgreSQL in Docker"
    docker run -d \
      --name care-commons-db \
      -e POSTGRES_USER=postgres \
      -e POSTGRES_PASSWORD=postgres \
      -e POSTGRES_DB=care_commons \
      -p 5432:5432 \
      postgres:14 > /dev/null 2>&1 || true

    # Wait for PostgreSQL to be ready
    echo -n "Waiting for PostgreSQL to start"
    for i in {1..30}; do
      if docker exec care-commons-db pg_isready -U postgres > /dev/null 2>&1; then
        echo ""
        print_success "PostgreSQL started in Docker"
        break
      fi
      echo -n "."
      sleep 1
    done
  fi
else
  if ! command -v psql &> /dev/null; then
    print_warning "PostgreSQL is not installed"
    echo ""
    echo "Install PostgreSQL:"
    echo "  macOS:   brew install postgresql@14"
    echo "  Ubuntu:  sudo apt install postgresql-14"
    echo "  Windows: https://www.postgresql.org/download/windows/"
    echo ""
    echo "Or run with --use-docker to use Docker instead"
    exit 1
  fi
  print_success "PostgreSQL installed"
fi

# Set up environment file
print_step "Setting up environment variables"
if [ -f .env ]; then
  print_warning ".env file already exists, skipping"
else
  if [ ! -f .env.example ]; then
    print_error ".env.example not found"
  fi

  # Generate secure random secrets
  generate_secret() {
    local bytes=${1:-32}
    node -e "console.log(require('crypto').randomBytes($bytes).toString('hex'))"
  }

  JWT_SECRET=$(generate_secret 32)
  JWT_REFRESH_SECRET=$(generate_secret 32)
  SESSION_SECRET=$(generate_secret 32)
  ENCRYPTION_KEY=$(generate_secret 32)
  MOCK_PASSWORD=$(generate_secret 16)

  # Create .env from template
  cp .env.example .env

  # Replace placeholders (works on both macOS and Linux)
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/your_jwt_secret_here_change_in_production_min_32_chars/$JWT_SECRET/" .env
    sed -i '' "s/your_jwt_refresh_secret_here_change_in_production_min_32_chars/$JWT_REFRESH_SECRET/" .env
    sed -i '' "s/your_session_secret_here_change_in_production/$SESSION_SECRET/" .env
    sed -i '' "s/your_32_byte_encryption_key_here_change_in_production/$ENCRYPTION_KEY/" .env
    sed -i '' "s/your_secure_mock_password_here/$MOCK_PASSWORD/" .env
    sed -i '' "s/your_secure_database_password_here/postgres/" .env
  else
    # Linux
    sed -i "s/your_jwt_secret_here_change_in_production_min_32_chars/$JWT_SECRET/" .env
    sed -i "s/your_jwt_refresh_secret_here_change_in_production_min_32_chars/$JWT_REFRESH_SECRET/" .env
    sed -i "s/your_session_secret_here_change_in_production/$SESSION_SECRET/" .env
    sed -i "s/your_32_byte_encryption_key_here_change_in_production/$ENCRYPTION_KEY/" .env
    sed -i "s/your_secure_mock_password_here/$MOCK_PASSWORD/" .env
    sed -i "s/your_secure_database_password_here/postgres/" .env
  fi

  print_success ".env file created with secure secrets"
fi

# Install dependencies
print_step "Installing dependencies"
npm install --silent
print_success "Dependencies installed"

# Set up database
print_step "Setting up database"
export $(cat .env | grep -v '^#' | xargs)

DB_NAME=${DB_NAME:-care_commons}
DB_USER=${DB_USER:-postgres}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

# Check if database exists
if PGPASSWORD=${DB_PASSWORD:-postgres} psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
  print_warning "Database '$DB_NAME' already exists"
else
  # Create database
  if PGPASSWORD=${DB_PASSWORD:-postgres} createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>/dev/null; then
    print_success "Database '$DB_NAME' created"
  else
    print_warning "Could not create database (may already exist or require permissions)"
  fi
fi

# Run migrations
print_step "Running database migrations"
npm run db:migrate --silent
print_success "Migrations completed"

# Seed data
print_step "Seeding database"
if [ "$USE_DEMO" = true ]; then
  npm run db:seed:demo --silent
  print_success "Demo data seeded"
else
  npm run db:seed --silent
  print_success "Minimal data seeded"
fi

# Build packages
if [ "$SKIP_BUILD" = false ]; then
  print_step "Building packages"
  npm run build --silent
  print_success "Build completed"
else
  print_warning "Skipping build step"
fi

# Success message
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅  Setup complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}Next steps:${NC}"
echo ""
echo -e "  ${GREEN}npm run dev${NC}           Start all development servers"
echo -e "  ${GREEN}npm run dev:server${NC}    Start API server only"
echo -e "  ${GREEN}npm run dev:web${NC}       Start web frontend only"
echo ""
echo -e "${CYAN}Default login credentials:${NC}"
echo ""
echo -e "  Email:    ${YELLOW}admin@carecommons.example${NC}"
echo -e "  Password: ${YELLOW}Admin123!${NC}"
echo ""
echo -e "${CYAN}Useful commands:${NC}"
echo ""
echo -e "  ${GREEN}npm run test${NC}          Run all tests"
echo -e "  ${GREEN}npm run lint${NC}          Lint all packages"
echo -e "  ${GREEN}npm run typecheck${NC}     Type check all packages"
echo -e "  ${GREEN}npm run db:reset:demo${NC} Reset database with demo data"
echo ""
echo -e "${CYAN}Documentation:${NC}"
echo ""
echo -e "  CONTRIBUTING.md      Contributor guidelines"
echo -e "  DEV_SETUP.md         Development setup details"
echo -e "  DATABASE_QUICKSTART.md  Database management"
echo ""
