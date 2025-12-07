# Docker Development Environment Setup

This repository supports three isolated development environments running in Docker containers, allowing multiple AI agents (bedwards, tove, gaute) to work in parallel without conflicts.

## Architecture

```
Host Machine (macOS)
├── Shared Services (Docker)
│   ├── PostgreSQL 16 (port 5432)
│   │   ├── Database: folk-care-0 (bedwards)
│   │   ├── Database: folk-care-1 (tove)
│   │   └── Database: folk-care-2 (gaute)
│   └── Redis 7 (port 6379)
│       ├── DB 0 (bedwards)
│       ├── DB 1 (tove)
│       └── DB 2 (gaute)
│
├── Development Containers
│   ├── dev-bedwards (folk-care-0)
│   │   ├── API: localhost:3000
│   │   └── Web: localhost:5173
│   ├── dev-tove (folk-care-1)
│   │   ├── API: localhost:3001
│   │   └── Web: localhost:5174
│   └── dev-gaute (folk-care-2)
│       ├── API: localhost:3002
│       └── Web: localhost:5175
│
└── Mobile Development (Host Mac)
    ├── bedwards: Expo on :8081 → API :3000
    ├── tove:     Expo on :8082 → API :3001
    └── gaute:    Expo on :8083 → API :3002
```

## Quick Start

### 1. Initial Setup

Each development environment needs its own checkout directory:

```bash
# Primary environment (already exists)
/Users/bedwards/folk-care-0

# Clone for tove
cd /Users/bedwards
git clone https://github.com/neighborhood-lab/folkcare.git folk-care-1
cd folk-care-1
git checkout develop

# Clone for gaute
cd /Users/bedwards
git clone https://github.com/neighborhood-lab/folkcare.git folk-care-2
cd folk-care-2
git checkout develop
```

### 2. Configure Secrets

Each environment needs its own `.secrets.txt` and `.env` files:

```bash
# bedwards (folk-care-0) - already configured
cat /Users/bedwards/folk-care-0/.env
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/folk-care-0
# REDIS_URL=redis://localhost:6379/0
# PORT=3000

# tove (folk-care-1)
cp /Users/bedwards/folk-care-0/.secrets.txt /Users/bedwards/folk-care-1/.secrets.txt
# Edit to use tove-bot credentials
cat > /Users/bedwards/folk-care-1/.env <<EOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/folk-care-1
REDIS_URL=redis://localhost:6379/1
PORT=3001
EOF

# gaute (folk-care-2)
cp /Users/bedwards/folk-care-0/.secrets.txt /Users/bedwards/folk-care-2/.secrets.txt
# Edit to use gaute-bot credentials
cat > /Users/bedwards/folk-care-2/.env <<EOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/folk-care-2
REDIS_URL=redis://localhost:6379/2
PORT=3002
EOF
```

### 3. Create Databases

```bash
# Start shared PostgreSQL and Redis
cd /Users/bedwards/folk-care-0
docker compose up -d postgres redis

# Create databases for tove and gaute (folk-care-0 already exists)
docker exec -it folk-care-0-db psql -U postgres -c 'CREATE DATABASE "folk-care-1"'
docker exec -it folk-care-0-db psql -U postgres -c 'CREATE DATABASE "folk-care-2"'
```

### 4. Start Development Containers

```bash
# Start all dev environments
cd /Users/bedwards/folk-care-0
docker compose up -d

# Or start individually
docker compose up -d dev-bedwards
docker compose up -d dev-tove
docker compose up -d dev-gaute

# Check status
docker compose ps
```

## Working Inside Containers

### Attach to a Container

```bash
# bedwards
docker exec -it folk-care-dev-bedwards sh

# tove
docker exec -it folk-care-dev-tove sh

# gaute
docker exec -it folk-care-dev-gaute sh
```

### Run Commands Inside Container

```bash
# Install dependencies
docker exec -it folk-care-dev-bedwards npm install

# Run database migrations
docker exec -it folk-care-dev-bedwards npm run db:migrate

# Seed database
docker exec -it folk-care-dev-bedwards npm run db:seed

# Start API server
docker exec -it folk-care-dev-bedwards npm run dev --workspace=@folkcare/app

# Start web server
docker exec -it folk-care-dev-bedwards npm run dev --workspace=@folkcare/web
```

### Run Commands from Host

You can also run commands from the host machine in the mounted directories:

```bash
# bedwards
cd /Users/bedwards/folk-care-0
npm install
npm run dev

# tove
cd /Users/bedwards/folk-care-1
npm install
npm run dev

# gaute
cd /Users/bedwards/folk-care-2
npm install
npm run dev
```

## Mobile Development (Host Machine)

Mobile development with React Native/Expo **must run on the host Mac** due to iOS Simulator requirements.

```bash
# bedwards
cd /Users/bedwards/folk-care-0/packages/mobile
npm run start  # Expo on :8081, connects to API :3000

# tove
cd /Users/bedwards/folk-care-1/packages/mobile
PORT=8082 npm run start  # Expo on :8082, connects to API :3001

# gaute
cd /Users/bedwards/folk-care-2/packages/mobile
PORT=8083 npm run start  # Expo on :8083, connects to API :3002
```

## Port Reference

| Service | bedwards | tove | gaute |
|---------|----------|------|-------|
| API     | 3000     | 3001 | 3002  |
| Web     | 5173     | 5174 | 5175  |
| Mobile  | 8081     | 8082 | 8083  |

**Shared Services:**
- PostgreSQL: 5432
- Redis: 6379
- pgAdmin: 5050 (`docker compose --profile tools up -d`)
- Redis Commander: 8090 (`docker compose --profile tools up -d`)
- MailHog SMTP: 1025
- MailHog Web: 8025

## Database Management

### Access PostgreSQL

```bash
# Via psql
docker exec -it folk-care-0-db psql -U postgres -d folk-care-0
docker exec -it folk-care-0-db psql -U postgres -d folk-care-1
docker exec -it folk-care-0-db psql -U postgres -d folk-care-2

# Via pgAdmin (browser)
docker compose --profile tools up -d pgadmin
open http://localhost:5050
# Email: admin@folkcare.local / Password: admin
```

### Access Redis

```bash
# Via redis-cli
docker exec -it folk-care-0-redis redis-cli -n 0  # bedwards
docker exec -it folk-care-0-redis redis-cli -n 1  # tove
docker exec -it folk-care-0-redis redis-cli -n 2  # gaute

# Via Redis Commander (browser)
docker compose --profile tools up -d redis-commander
open http://localhost:8090
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs folk-care-dev-bedwards

# Restart container
docker compose restart dev-bedwards

# Rebuild and restart
docker compose up -d --build dev-bedwards
```

### Port conflicts

```bash
# Check what's using a port
lsof -i :3000
lsof -i :5173

# Stop all containers
docker compose down

# Start fresh
docker compose up -d
```

### Database issues

```bash
# Reset a specific database
docker exec -it folk-care-0-db psql -U postgres -c 'DROP DATABASE "folk-care-1"'
docker exec -it folk-care-0-db psql -U postgres -c 'CREATE DATABASE "folk-care-1"'

# Reset all data (DESTRUCTIVE)
docker compose down -v
docker compose up -d
```

### Node modules issues

```bash
# Clear node_modules volume for a container
docker volume rm folk-care-0_bedwards_node_modules
docker compose up -d dev-bedwards
docker exec -it folk-care-dev-bedwards npm install
```

## Cleanup

```bash
# Stop all services
docker compose down

# Stop and remove volumes (DESTROYS ALL DATA)
docker compose down -v

# Remove all containers and volumes for a fresh start
docker compose down -v
docker volume prune -f
docker compose up -d
```

## Best Practices

1. **Branch isolation**: Each agent works on separate feature branches
2. **Discord coordination**: All agents post to dev-team channel
3. **GitHub sync**: Pull from develop before starting new work
4. **Database isolation**: Each environment has its own database
5. **Port awareness**: Use correct ports for each environment
6. **Mobile on host**: Always run mobile dev on macOS host, not in containers

## Architecture Notes

- **Shared PostgreSQL/Redis**: All environments connect to the same database and Redis servers but use different database names and Redis DB numbers for isolation
- **Separate node_modules**: Each container has its own node_modules volume to avoid conflicts
- **Volume mounts**: Source code is mounted from the host for live reloading
- **Network**: All containers are on the same `folkcare` bridge network for inter-container communication
