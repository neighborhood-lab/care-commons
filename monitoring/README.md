# Care Commons Production Monitoring

This directory contains the complete monitoring stack for Care Commons, including metrics collection, visualization, alerting, and log aggregation.

## Stack Components

- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **Alertmanager**: Alert routing and notifications
- **Loki**: Log aggregation and search
- **Promtail**: Log shipping to Loki
- **Node Exporter**: System-level metrics (CPU, memory, disk, network)

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Care Commons API running (default: http://localhost:3000)
- Environment variables configured (see Configuration section)

### Starting the Monitoring Stack

```bash
cd monitoring
docker-compose up -d
```

### Accessing the Tools

- **Grafana**: http://localhost:3001
  - Default credentials: `admin` / `admin` (change on first login)
  - Dashboards are auto-provisioned in the "Care Commons" folder

- **Prometheus**: http://localhost:9090
  - Query metrics directly
  - View alert status
  - Check targets health

- **Alertmanager**: http://localhost:9093
  - View active alerts
  - Test alert routing
  - Silence alerts

- **Loki**: http://localhost:3100
  - Access via Grafana's Explore feature
  - Query logs using LogQL

## Configuration

### Environment Variables

Create a `.env` file in the `monitoring` directory:

```bash
# Grafana Admin Password
GRAFANA_ADMIN_PASSWORD=your_secure_password

# Slack Webhook for Alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Slack Integration

1. Create a Slack webhook URL:
   - Go to https://api.slack.com/apps
   - Create a new app or select existing
   - Enable Incoming Webhooks
   - Create webhook for your desired channel

2. Set the webhook URL in your `.env` file

3. Configure channels in `alertmanager/config.yml`:
   - `#care-commons-alerts-critical`: Critical alerts
   - `#care-commons-alerts`: Warning alerts
   - `#care-commons-metrics`: Business metrics alerts

## Metrics Collected

### HTTP Metrics
- `http_requests_total`: Total HTTP requests (labeled by method, route, status_code)
- `http_request_duration_seconds`: Request duration histogram

### Database Metrics
- `db_query_duration_seconds`: Database query duration

### Business Metrics
- `visits_created_total`: Total visits created
- `active_users`: Current number of active users

### Mobile Sync Metrics
- `mobile_sync_success_total`: Successful mobile syncs
- `mobile_sync_failure_total`: Failed mobile syncs

## Dashboards

### Care Commons - Production Overview

The main dashboard includes:

1. **Service Status**: Real-time API health
2. **Request Rate**: Requests per second over time
3. **Error Rate**: 5xx errors as percentage of total requests
4. **Active Users**: Current active user count
5. **Response Time**: p50, p95, p99 percentiles
6. **HTTP Status Codes**: Breakdown of 2xx, 4xx, 5xx responses
7. **Database Performance**: Query duration metrics
8. **Visit Operations**: Visit creation rate
9. **Mobile Sync**: Success vs failure rates
10. **SLA Tracking**: Uptime percentage (99.5% target)

## Alerts

### Critical Alerts (Immediate Action Required)

- **ServiceDown**: API is unreachable for 1 minute
- **HighErrorRate**: >5% of requests returning 5xx errors for 2 minutes
- **VerySlowResponseTime**: p95 response time >5 seconds for 2 minutes
- **SLABreach**: Availability below 99.5% over 1 hour

### Warning Alerts (Monitor Closely)

- **ElevatedErrorRate**: >1% error rate for 5 minutes
- **SlowResponseTime**: p95 response time >2 seconds for 5 minutes
- **HighRequestRate**: >100 req/s for 5 minutes (possible DDoS)
- **LowRequestRate**: <0.1 req/s for 10 minutes (possible service issue)
- **HighSyncFailureRate**: >10% mobile sync failures
- **SlowDatabaseQueries**: p95 query time >1 second

### Business Metrics Alerts

- **NoVisitsCreated**: No visits created in 2 hours
- **NoActiveUsers**: No active users for 30 minutes

## Alert Runbooks

### ServiceDown

1. Check if the API container/process is running
2. Verify database connectivity
3. Check recent deployment logs
4. Review server resource usage (CPU, memory, disk)
5. Restart the service if necessary

### HighErrorRate

1. Open Sentry dashboard for detailed error traces
2. Check recent code deployments
3. Verify database connection pool status
4. Review error logs in Loki
5. Consider rollback if related to recent deployment

### SlowResponseTime

1. Check database query performance
2. Review slow query logs
3. Monitor system resources (CPU, memory)
4. Check for N+1 queries or missing indexes
5. Review recent code changes that may affect performance

### HighSyncFailureRate

1. Check mobile sync endpoint logs
2. Verify database connectivity
3. Review recent mobile app updates
4. Check for schema mismatches
5. Monitor conflict resolution logic

## SLA Monitoring

**Target**: 99.5% uptime

The dashboard tracks availability using the formula:
```
Uptime % = (1 - (5xx errors / total requests)) * 100
```

**Allowed downtime per month**: ~3.6 hours

## Log Queries

### Common LogQL Queries

View all error logs:
```logql
{job="care-commons"} |= "error" or "ERROR"
```

View authentication failures:
```logql
{job="care-commons"} |= "authentication" |= "failed"
```

View slow database queries:
```logql
{job="care-commons"} |= "slow query" or "query duration"
```

View sync failures:
```logql
{job="care-commons"} |= "sync" |= "failed"
```

## Maintenance

### Data Retention

- **Prometheus**: 30 days (configurable in docker-compose.yml)
- **Loki**: 7 days (168 hours, configurable in loki-config.yml)

### Backup

Important data to backup:
- Grafana dashboards (auto-provisioned, stored in git)
- Alert rules (stored in git)
- Prometheus data (optional, in `prometheus-data` volume)

### Scaling

For production deployment:

1. **Prometheus**: Consider using Thanos or Cortex for long-term storage
2. **Grafana**: Use external database (PostgreSQL) instead of SQLite
3. **Alertmanager**: Deploy multiple instances for high availability
4. **Loki**: Use object storage backend (S3, GCS) for scalability

## Troubleshooting

### Prometheus Not Scraping Metrics

1. Check if API is exposing `/metrics` endpoint:
   ```bash
   curl http://localhost:3000/metrics
   ```

2. Verify Prometheus targets:
   - Open http://localhost:9090/targets
   - Check if `care-commons-api` target is UP

3. Check network connectivity between Prometheus and API

### Grafana Dashboard Shows No Data

1. Verify Prometheus datasource is configured correctly
2. Check if Prometheus is collecting metrics
3. Ensure time range is appropriate
4. Check query syntax in panel

### Alerts Not Firing

1. Check alert rules in Prometheus:
   - http://localhost:9090/alerts

2. Verify Alertmanager is receiving alerts:
   - http://localhost:9093

3. Check Slack webhook configuration

4. Review Alertmanager logs:
   ```bash
   docker-compose logs alertmanager
   ```

## Production Deployment

### Security Considerations

1. **Change default passwords**:
   - Grafana admin password
   - Prometheus (add authentication)

2. **Enable HTTPS**:
   - Use reverse proxy (nginx, Caddy)
   - Configure SSL certificates

3. **Restrict access**:
   - Use firewall rules
   - Configure VPN access
   - Implement authentication

4. **Secure Slack webhooks**:
   - Store in environment variables
   - Rotate regularly
   - Monitor usage

### Cloud Deployment Options

- **AWS**: CloudWatch + Managed Prometheus + Managed Grafana
- **GCP**: Cloud Monitoring + Cloud Logging
- **Azure**: Azure Monitor + Application Insights
- **Self-hosted**: Docker Swarm or Kubernetes

## On-Call Procedures

### Incident Response

1. **Acknowledge alert** in Slack or Alertmanager
2. **Assess severity** using Grafana dashboards
3. **Check error logs** in Sentry and Loki
4. **Take corrective action** based on runbook
5. **Document incident** in incident log
6. **Communicate status** to stakeholders
7. **Post-mortem** after resolution

### Escalation

- **L1**: DevOps on-call engineer
- **L2**: Backend development team lead
- **L3**: CTO or senior engineering leadership

## Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/)
- [Alertmanager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)

## Support

For questions or issues with the monitoring stack:
- Create an issue in the repository
- Contact the DevOps team
- Review the troubleshooting section above
