# Folk Care Kubernetes Deployment

Kubernetes manifests for deploying Folk Care on Kubernetes clusters.

## Prerequisites

- Kubernetes cluster (1.25+)
- kubectl configured
- Container registry access (for custom images)
- StorageClass for persistent volumes

## Quick Start

### 1. Create Namespace

```bash
kubectl apply -f namespace.yaml
```

### 2. Create Secrets

```bash
# Edit secrets.yaml with your actual values (base64 encoded)
# Generate base64 values:
echo -n 'your-jwt-secret' | base64
echo -n 'your-postgres-password' | base64

kubectl apply -f secrets.yaml
```

### 3. Create ConfigMap

```bash
kubectl apply -f configmap.yaml
```

### 4. Deploy PostgreSQL

```bash
kubectl apply -f postgres/
```

### 5. Deploy Redis

```bash
kubectl apply -f redis/
```

### 6. Deploy Application

```bash
kubectl apply -f app/
```

### 7. (Optional) Deploy Ingress

```bash
kubectl apply -f ingress.yaml
```

## Directory Structure

```
k8s/
├── README.md           # This file
├── namespace.yaml      # Namespace definition
├── secrets.yaml        # Secrets (edit before applying!)
├── configmap.yaml      # Configuration
├── app/
│   ├── deployment.yaml # App deployment
│   ├── service.yaml    # App service
│   └── hpa.yaml        # Horizontal Pod Autoscaler
├── postgres/
│   ├── statefulset.yaml # PostgreSQL StatefulSet
│   ├── service.yaml     # PostgreSQL service
│   └── pvc.yaml         # Persistent volume claim
├── redis/
│   ├── deployment.yaml  # Redis deployment
│   └── service.yaml     # Redis service
└── ingress.yaml        # Ingress configuration
```

## Configuration

### Environment Variables

Edit `configmap.yaml` for non-sensitive configuration:
- `NODE_ENV` - Environment (production)
- `PORT` - Application port

Edit `secrets.yaml` for sensitive data:
- `JWT_SECRET` - JWT signing secret
- `POSTGRES_PASSWORD` - Database password
- `ANTHROPIC_API_KEY` - Claude AI key (optional)
- `RESEND_API_KEY` - Email service key (optional)

### Resource Limits

Default resource allocations:

| Component | CPU Request | CPU Limit | Memory Request | Memory Limit |
|-----------|-------------|-----------|----------------|--------------|
| App       | 100m        | 500m      | 256Mi          | 512Mi        |
| PostgreSQL| 100m        | 1000m     | 256Mi          | 1Gi          |
| Redis     | 50m         | 200m      | 64Mi           | 128Mi        |

Adjust in respective deployment files based on your workload.

### Scaling

The HPA (Horizontal Pod Autoscaler) is configured to:
- Minimum replicas: 2
- Maximum replicas: 10
- Scale at 70% CPU utilization

## Production Considerations

### High Availability

1. Use multiple replicas (default: 2)
2. Configure pod anti-affinity for spread across nodes
3. Use external managed database (RDS, Cloud SQL, Neon) for production

### Persistence

PostgreSQL uses a PersistentVolumeClaim. Ensure your cluster has:
- A default StorageClass, or
- Specify storageClassName in `postgres/pvc.yaml`

### TLS/HTTPS

Configure TLS in `ingress.yaml`:
1. Create TLS secret with your certificate
2. Uncomment TLS section in ingress.yaml
3. Use cert-manager for automatic certificate management

### Monitoring

Recommended additions:
- Prometheus for metrics (ServiceMonitor included)
- Grafana for dashboards
- Loki for log aggregation

## Troubleshooting

### Check Pod Status

```bash
kubectl get pods -n folkcare
kubectl describe pod <pod-name> -n folkcare
kubectl logs <pod-name> -n folkcare
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
kubectl get pods -n folkcare -l app=postgres

# Check service endpoints
kubectl get endpoints -n folkcare postgres

# Test connection from app pod
kubectl exec -it <app-pod> -n folkcare -- nc -zv postgres 5432
```

### Reset Everything

```bash
kubectl delete namespace folkcare
```

## Migration from Docker Compose

If migrating from docker-compose:

1. Export data from PostgreSQL:
   ```bash
   docker-compose exec postgres pg_dump -U postgres folkcare > backup.sql
   ```

2. Deploy Kubernetes resources

3. Import data:
   ```bash
   kubectl cp backup.sql folkcare/<postgres-pod>:/tmp/
   kubectl exec -it <postgres-pod> -n folkcare -- psql -U postgres folkcare < /tmp/backup.sql
   ```
