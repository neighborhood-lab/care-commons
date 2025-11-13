# Docker Setup Guide

Complete guide for running Care Commons with Docker for local development.

## Quick Start

```bash
# 1. Start PostgreSQL and Redis
npm run docker:up

# 2. Wait for services to be healthy (about 10 seconds)
docker-compose ps

# 3. Run database migrations
npm run db:migrate

# 4. (Optional) Seed demo data
npm run db:seed:demo

# 5. Start the development server
npm run dev
```

## Services Included

### Core Services (always running)

- **PostgreSQL 16** - Main database
  - Port: `5432`
  - User: `postgres`
  - Password: `postgres`
  - Database: `care_commons`
  - Connection string: `postgresql://postgres:postgres@localhost:5432/care_commons`

- **Redis 7** - Cache and session store
  - Port: `6379`
  - Connection string: `redis://localhost:6379`

### Optional Tools (use `--profile tools`)

- **pgAdmin 4** - Database management UI
  - URL: http://localhost:5050
  - Email: `admin@carecommons.local`
  - Password: `admin`

- **Redis Commander** - Redis management UI
  - URL: http://localhost:8081

- **MailHog** - Email testing
  - SMTP: `localhost:1025`
  - Web UI: http://localhost:8025

## NPM Scripts

```bash
# Start core services (PostgreSQL + Redis)
npm run docker:up

# Start with management tools
npm run docker:up:tools

# Stop services (keeps data)
npm run docker:down

# Stop services and DELETE ALL DATA
npm run docker:down:volumes

# View logs
npm run docker:logs

# Check service status
npm run docker:ps

# Restart services
npm run docker:restart
```

## Manual Docker Commands

```bash
# Start all services
docker-compose up -d

# Start with management tools
docker-compose --profile tools up -d

# View logs
docker-compose logs -f postgres
docker-compose logs -f redis

# Stop services
docker-compose down

# Stop and remove volumes (DESTROYS DATA)
docker-compose down -v

# Restart a specific service
docker-compose restart postgres

# Enter PostgreSQL container
docker exec -it care-commons-db psql -U postgres -d care_commons

# Enter Redis container
docker exec -it care-commons-redis redis-cli
```

## Configuration

### PostgreSQL Tuning

The PostgreSQL container is configured with optimized settings for development:

- Max connections: 200
- Shared buffers: 256MB
- Effective cache size: 1GB
- Work mem: 1.3MB per connection

### Redis Configuration

- Max memory: 256MB
- Eviction policy: `allkeys-lru` (Least Recently Used)
- Persistence: AOF (Append-Only File) enabled

## Data Persistence

Docker volumes are used for data persistence:

- `postgres_data` - PostgreSQL data directory
- `redis_data` - Redis AOF persistence
- `pgadmin_data` - pgAdmin settings

**IMPORTANT**: Data persists between container restarts. Use `docker-compose down -v` to delete all data.

## Troubleshooting

### Port Already in Use

```bash
# Check what's using port 5432
lsof -i :5432

# Stop the conflicting process or change the port in docker-compose.yml
```

### Database Connection Refused

```bash
# Check if PostgreSQL is running
docker-compose ps

# Wait for health check to pass
docker-compose logs postgres

# Restart if needed
docker-compose restart postgres
```

### Migrations Failing

```bash
# Reset database
npm run docker:down:volumes
npm run docker:up

# Wait 10 seconds, then migrate
npm run db:migrate
```

### Cannot Connect to pgAdmin

```bash
# Ensure you started with tools profile
npm run docker:up:tools

# Check if pgAdmin is running
docker-compose ps pgadmin

# View logs
docker-compose logs pgadmin
```

## pgAdmin Setup

1. Start with tools: `npm run docker:up:tools`
2. Open http://localhost:5050
3. Login with `admin@carecommons.local` / `admin`
4. Add server:
   - Name: `Care Commons Local`
   - Host: `postgres` (Docker network name)
   - Port: `5432`
   - Username: `postgres`
   - Password: `postgres`
   - Database: `care_commons`

## Redis Commander Usage

1. Start with tools: `npm run docker:up:tools`
2. Open http://localhost:8081
3. Redis is automatically connected

## MailHog Usage

1. Start with tools: `npm run docker:up:tools`
2. Configure your app to use SMTP: `localhost:1025`
3. View captured emails at http://localhost:8025

## Production Considerations

**DO NOT use this Docker setup for production!**

For production:
- Use managed PostgreSQL (Neon, AWS RDS, etc.)
- Use managed Redis (Upstash, Redis Cloud, etc.)
- Use proper secrets management
- Enable SSL/TLS
- Configure backups
- Set up monitoring

See `DEPLOYMENT.md` for production deployment guides.

## Environment Variables

Update `.env` to use Docker services:

```env
# Database (Docker)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=care_commons
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false

# Redis (Docker)
REDIS_URL=redis://localhost:6379

# Email testing (MailHog)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASSWORD=
```

## Cleaning Up

```bash
# Stop and remove containers (keeps data)
npm run docker:down

# Stop and remove everything including data
npm run docker:down:volumes

# Remove unused Docker resources
docker system prune -a --volumes
```

## Next Steps

1. Start Docker services: `npm run docker:up`
2. Run migrations: `npm run db:migrate`
3. Seed demo data: `npm run db:seed:demo`
4. Start development: `npm run dev`
5. Visit http://localhost:3000

For more information:
- [Development Guide](DEVELOPMENT.md)
- [Database Guide](DATABASE_QUICKSTART.md)
- [Deployment Guide](DEPLOYMENT.md)
