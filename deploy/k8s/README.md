# Folk Care Kubernetes Deployment

Deploy Folk Care on Kubernetes for high availability and scalability.

## Prerequisites

- Kubernetes cluster (1.25+)
- kubectl configured
- Storage class with dynamic provisioning
- Ingress controller (nginx-ingress or traefik)
- cert-manager (optional, for automatic TLS)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/neighborhood-lab/folk-care.git
cd folk-care/deploy/k8s
```

### 2. Configure Secrets

Generate and encode secrets:

```bash
# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)
echo -n "$JWT_SECRET" | base64

# Generate PostgreSQL password
PG_PASSWORD=$(openssl rand -base64 24)
echo -n "$PG_PASSWORD" | base64
```

Edit `secret.yaml` and replace placeholders with your base64-encoded values.

### 3. Update Configuration

Edit `ingress.yaml` and replace `folkcare.example.com` with your domain.

### 4. Deploy

```bash
# Create namespace and deploy all resources
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml
kubectl apply -f postgres.yaml
kubectl apply -f redis.yaml
kubectl apply -f app.yaml
kubectl apply -f ingress.yaml

# Optional: Deploy autoscaling and disruption budgets
kubectl apply -f hpa.yaml
kubectl apply -f pdb.yaml

# Optional: Deploy automated backups
kubectl apply -f backup-cronjob.yaml
```

Or use kustomize:

```bash
kubectl apply -k .
```

### 5. Seed Database (Optional)

```bash
# Run database seed
kubectl exec -it -n folkcare deployment/folkcare-app -- npm run db:seed:demo
```

### 6. Access Folk Care

Once the ingress is configured, access Folk Care at your domain.

**Demo Credentials:**
- Admin: `admin@folkcare.example` / `demo123`
- Coordinator: `coordinator@folkcare.example` / `demo123`
- Caregiver: `caregiver@folkcare.example` / `demo123`

---

## Architecture

```
                    ┌──────────────┐
                    │   Ingress    │
                    │ (nginx/traf) │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │   Service    │
                    │ folkcare-app │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────▼─────┐    ┌─────▼─────┐    ┌─────▼─────┐
    │  Pod #1   │    │  Pod #2   │    │  Pod #N   │
    │ folkcare  │    │ folkcare  │    │ folkcare  │
    └─────┬─────┘    └─────┬─────┘    └─────┬─────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
          ┌────────────────┴────────────────┐
          │                                 │
    ┌─────▼─────┐                     ┌─────▼─────┐
    │ PostgreSQL│                     │   Redis   │
    │(StatefulSt│                     │(Deployment│
    └───────────┘                     └───────────┘
```

---

## Resource Requirements

### Small Deployment (< 100 clients)

| Component | Replicas | CPU | Memory | Storage |
|-----------|----------|-----|--------|---------|
| App | 2 | 250m-1000m | 512Mi-1Gi | - |
| PostgreSQL | 1 | 250m-1000m | 512Mi-1Gi | 10Gi |
| Redis | 1 | 100m-250m | 128Mi-256Mi | - |

**Total:** ~600m-2250m CPU, ~1.1Gi-2.3Gi Memory, 10Gi Storage

### Medium Deployment (100-500 clients)

| Component | Replicas | CPU | Memory | Storage |
|-----------|----------|-----|--------|---------|
| App | 3-5 | 500m-2000m | 1Gi-2Gi | - |
| PostgreSQL | 1 | 500m-2000m | 1Gi-2Gi | 25Gi |
| Redis | 1 | 250m-500m | 256Mi-512Mi | - |

### Large Deployment (500+ clients)

Consider:
- PostgreSQL high-availability (CloudNativePG, Patroni, or managed service)
- Redis cluster or managed Redis
- Multiple app replicas with HPA
- External storage (S3/GCS for backups)

---

## Configuration Reference

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes | Secret for JWT token signing |
| `DATABASE_URL` | Auto | PostgreSQL connection string |
| `REDIS_URL` | Auto | Redis connection string |
| `ANTHROPIC_API_KEY` | No | Enable AI features (Claude) |
| `RESEND_API_KEY` | No | Enable email notifications |

### Scaling

**Horizontal Pod Autoscaler:**
```bash
# View current scaling status
kubectl get hpa -n folkcare

# Manually scale (bypasses HPA)
kubectl scale deployment folkcare-app -n folkcare --replicas=5
```

**PostgreSQL Storage:**
```bash
# Expand PVC (requires storage class support)
kubectl patch pvc postgres-data-folkcare-postgres-0 -n folkcare \
  -p '{"spec":{"resources":{"requests":{"storage":"25Gi"}}}}'
```

---

## Operations

### View Logs

```bash
# All app logs
kubectl logs -n folkcare -l app.kubernetes.io/component=app -f

# Specific pod
kubectl logs -n folkcare folkcare-app-xxxxx -f

# PostgreSQL logs
kubectl logs -n folkcare -l app.kubernetes.io/component=postgres -f
```

### Database Operations

```bash
# Connect to PostgreSQL
kubectl exec -it -n folkcare folkcare-postgres-0 -- psql -U postgres -d folkcare

# Run migrations
kubectl exec -n folkcare deployment/folkcare-app -- npm run db:migrate

# Create backup manually
kubectl create job --from=cronjob/folkcare-backup folkcare-backup-manual -n folkcare
```

### Health Checks

```bash
# Check all pods
kubectl get pods -n folkcare

# Describe deployment
kubectl describe deployment folkcare-app -n folkcare

# Check endpoints
kubectl get endpoints -n folkcare
```

### Rolling Updates

```bash
# Update to new version
kubectl set image deployment/folkcare-app \
  app=ghcr.io/neighborhood-lab/folkcare:v1.2.0 \
  -n folkcare

# Watch rollout
kubectl rollout status deployment/folkcare-app -n folkcare

# Rollback if needed
kubectl rollout undo deployment/folkcare-app -n folkcare
```

---

## High Availability Setup

### PostgreSQL HA

For production, use a PostgreSQL operator:

**CloudNativePG:**
```bash
# Install operator
kubectl apply -f https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/release-1.22/releases/cnpg-1.22.0.yaml

# See docs: https://cloudnative-pg.io/
```

**Managed PostgreSQL:**
- AWS RDS
- Google Cloud SQL
- Azure Database for PostgreSQL
- DigitalOcean Managed Databases

Update `DATABASE_URL` in secrets to point to managed database.

### Redis HA

For production caching:
- AWS ElastiCache
- Google Memorystore
- Redis Cloud

---

## TLS/HTTPS Setup

### With cert-manager (Recommended)

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer for Let's Encrypt
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
EOF
```

The ingress will automatically obtain and renew certificates.

### Manual TLS

```bash
# Create TLS secret from existing certificates
kubectl create secret tls folkcare-tls \
  --cert=path/to/cert.pem \
  --key=path/to/key.pem \
  -n folkcare
```

---

## Backup & Restore

### Automated Backups

The `backup-cronjob.yaml` creates daily backups at 2 AM UTC.

```bash
# View backup jobs
kubectl get cronjobs -n folkcare

# View recent backups
kubectl exec -n folkcare deployment/folkcare-backup -- ls -la /backups/
```

### Manual Backup

```bash
# Create immediate backup
kubectl create job --from=cronjob/folkcare-backup folkcare-backup-now -n folkcare

# Watch job
kubectl logs -n folkcare job/folkcare-backup-now -f
```

### Restore from Backup

```bash
# Copy backup to pod
kubectl cp ./folkcare-20231127.dump folkcare/folkcare-postgres-0:/tmp/backup.dump

# Restore (DESTRUCTIVE)
kubectl exec -n folkcare folkcare-postgres-0 -- \
  pg_restore -U postgres -d folkcare --clean /tmp/backup.dump
```

---

## Monitoring

### Prometheus Integration

The app exposes metrics at `/metrics`. Add ServiceMonitor for Prometheus Operator:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: folkcare-monitor
  namespace: folkcare
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: folkcare
      app.kubernetes.io/component: app
  endpoints:
    - port: http
      path: /metrics
      interval: 30s
```

### Grafana Dashboards

Import standard Node.js and PostgreSQL dashboards from Grafana.com.

---

## Troubleshooting

### Pod Won't Start

```bash
# Check pod events
kubectl describe pod -n folkcare <pod-name>

# Common issues:
# - ImagePullBackOff: Check image name/credentials
# - CrashLoopBackOff: Check logs for application errors
# - Pending: Check resource requests/limits
```

### Database Connection Issues

```bash
# Test PostgreSQL connectivity
kubectl run -n folkcare pg-test --rm -it --image=postgres:16-alpine -- \
  psql -h folkcare-postgres -U postgres -c "SELECT 1"

# Check PostgreSQL pod
kubectl logs -n folkcare folkcare-postgres-0
```

### Ingress Not Working

```bash
# Check ingress status
kubectl get ingress -n folkcare
kubectl describe ingress folkcare-ingress -n folkcare

# Check ingress controller logs
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller
```

---

## Cost Optimization

### Cloud Provider Spot/Preemptible Instances

For non-critical workloads, use spot instances:

```yaml
# In app.yaml deployment spec
spec:
  template:
    spec:
      nodeSelector:
        cloud.google.com/gke-spot: "true"  # GKE
        # kubernetes.azure.com/scalesetpriority: spot  # AKS
        # eks.amazonaws.com/capacityType: SPOT  # EKS
      tolerations:
        - key: "cloud.google.com/gke-spot"
          operator: "Equal"
          value: "true"
          effect: "NoSchedule"
```

### Resource Right-Sizing

Monitor actual usage and adjust requests/limits:

```bash
# View resource usage
kubectl top pods -n folkcare
```

---

## Security Best Practices

1. **Network Policies**: Restrict pod-to-pod communication
2. **Pod Security Standards**: Enable restricted policy
3. **Secret Management**: Consider external secrets (Vault, AWS Secrets Manager)
4. **RBAC**: Limit service account permissions
5. **Image Scanning**: Scan container images for vulnerabilities

---

## Support

- **Documentation:** https://docs.folk.care
- **Issues:** https://github.com/neighborhood-lab/folk-care/issues
- **Community:** https://discord.gg/folkcare

---

**Folk Care** - Shared care software, community owned
