# Docker Deployment Guide

Self-host Folk Care using Docker for complete control over your data and infrastructure.

## Quick Start

### Prerequisites

- Docker 24.0+ and Docker Compose 2.0+
- 2GB RAM minimum (4GB recommended)
- 10GB disk space

### 1. Clone the Repository

```bash
git clone https://github.com/neighborhood-lab/folk-care.git
cd folk-care
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.docker.example .env.docker

# Edit with your settings
nano .env.docker
```

**Required settings:**
- `JWT_SECRET` - Generate with `openssl rand -base64 32`
- `POSTGRES_PASSWORD` - Strong database password

### 3. Start the Stack

```bash
# Start all services
docker compose -f docker-compose.production.yml --env-file .env.docker up -d

# Run database migrations
docker compose -f docker-compose.production.yml exec app npm run db:migrate

# Seed with demo data (optional)
docker compose -f docker-compose.production.yml exec app npm run db:seed:demo
```

### 4. Access Folk Care

Open http://localhost:3000 in your browser.

**Demo Credentials:**
- Admin: `admin@folkcare.example` / `demo123`
- Coordinator: `coordinator@folkcare.example` / `demo123`
- Caregiver: `caregiver@folkcare.example` / `demo123`

---

## Production Deployment

### HTTPS with Let's Encrypt

1. **Update DNS** - Point your domain to your server's IP

2. **Generate SSL certificates:**
   ```bash
   # Using certbot
   certbot certonly --standalone -d your-domain.com

   # Copy certificates to docker/nginx/ssl/
   cp /etc/letsencrypt/live/your-domain.com/fullchain.pem docker/nginx/ssl/cert.pem
   cp /etc/letsencrypt/live/your-domain.com/privkey.pem docker/nginx/ssl/key.pem
   ```

3. **Start with proxy profile:**
   ```bash
   docker compose -f docker-compose.production.yml --env-file .env.docker --profile proxy up -d
   ```

### Automated Backups

Run daily backups with the backup profile:

```bash
# Manual backup
docker compose -f docker-compose.production.yml --profile backup run --rm backup

# Set up cron job for daily backups at 2 AM
echo "0 2 * * * cd /path/to/folk-care && docker compose -f docker-compose.production.yml --profile backup run --rm backup" | crontab -
```

Backups are stored in `./backups/` and automatically cleaned up after 7 days.

### Restore from Backup

```bash
# Stop the app
docker compose -f docker-compose.production.yml stop app

# Restore database
docker compose -f docker-compose.production.yml exec -T postgres \
  pg_restore -U postgres -d folkcare --clean < backups/folkcare-YYYYMMDD-HHMMSS.dump

# Restart
docker compose -f docker-compose.production.yml start app
```

---

## Configuration Reference

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | Application port |
| `JWT_SECRET` | **Yes** | - | Secret for JWT tokens |
| `POSTGRES_USER` | No | `postgres` | Database user |
| `POSTGRES_PASSWORD` | **Yes** | - | Database password |
| `POSTGRES_DB` | No | `folkcare` | Database name |
| `ANTHROPIC_API_KEY` | No | - | Claude AI for smart features |
| `RESEND_API_KEY` | No | - | Email notifications |
| `SENTRY_DSN` | No | - | Error tracking |

### Docker Compose Profiles

| Profile | Description |
|---------|-------------|
| (default) | App + PostgreSQL + Redis |
| `proxy` | Add Nginx reverse proxy with HTTPS |
| `backup` | Run database backup |

### Resource Recommendations

| Deployment Size | RAM | CPU | Storage |
|-----------------|-----|-----|---------|
| Small (< 50 clients) | 2GB | 1 vCPU | 10GB |
| Medium (50-200 clients) | 4GB | 2 vCPU | 25GB |
| Large (200+ clients) | 8GB+ | 4 vCPU | 50GB+ |

---

## Maintenance

### View Logs

```bash
# All services
docker compose -f docker-compose.production.yml logs -f

# Specific service
docker compose -f docker-compose.production.yml logs -f app
```

### Update to Latest Version

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.production.yml build
docker compose -f docker-compose.production.yml up -d

# Run any new migrations
docker compose -f docker-compose.production.yml exec app npm run db:migrate
```

### Health Check

```bash
# Check service status
docker compose -f docker-compose.production.yml ps

# Test health endpoint
curl http://localhost:3000/health
```

---

## Troubleshooting

### App won't start

```bash
# Check logs
docker compose -f docker-compose.production.yml logs app

# Common issues:
# - DATABASE_URL incorrect: Check postgres is healthy
# - JWT_SECRET missing: Set in .env.docker
# - Port conflict: Change PORT in .env.docker
```

### Database connection errors

```bash
# Verify postgres is running
docker compose -f docker-compose.production.yml ps postgres

# Check postgres logs
docker compose -f docker-compose.production.yml logs postgres

# Test connection
docker compose -f docker-compose.production.yml exec postgres psql -U postgres -c "SELECT 1"
```

### Reset everything

```bash
# Stop and remove all containers and volumes (DESTROYS DATA!)
docker compose -f docker-compose.production.yml down -v

# Start fresh
docker compose -f docker-compose.production.yml up -d
```

---

## Security Considerations

1. **Change default passwords** - Never use default `postgres` password in production
2. **Use HTTPS** - Enable the proxy profile with valid SSL certificates
3. **Firewall** - Only expose ports 80/443 to the internet
4. **Regular updates** - Pull latest images and rebuild regularly
5. **Backups** - Enable automated backups and test restore process
6. **Network isolation** - The default bridge network isolates services

---

## Support

- **Documentation:** https://docs.folk.care
- **Issues:** https://github.com/neighborhood-lab/folk-care/issues
- **Community:** https://discord.gg/folkcare

---

**Folk Care** - Shared care software, community owned
