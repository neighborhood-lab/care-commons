# Monitoring and Alerting Configuration

**Version**: 1.0
**Last Updated**: 2025-11-08
**Owner**: DevOps/Engineering Team

---

## Overview

This document outlines the monitoring and alerting strategy for the Care Commons platform, including configuration for Sentry, Prometheus metrics, and external monitoring services.

---

## Alert Severity Levels

| Level | Response Time | Notification | Examples |
|-------|---------------|--------------|----------|
| **CRITICAL** | Immediate | Page on-call + Slack + Email | Complete outage, security breach, data loss |
| **HIGH** | 15 minutes | Slack + Email | High error rate, severe performance degradation |
| **MEDIUM** | 1 hour | Slack | Moderate errors, minor performance issues |
| **LOW** | Next business day | Email only | Non-critical warnings, informational |

---

## Sentry Alert Configuration

### Error Rate Alerts

**Critical Error Rate** (CRITICAL):
```
Alert Name: Critical Error Rate
Condition: Error rate > 5% over 5 minutes
Notification: PagerDuty + Slack #incidents
```

**High Error Rate** (HIGH):
```
Alert Name: High Error Rate
Condition: Error rate > 1% over 10 minutes
Notification: Slack #alerts + Email
```

**Configuration in Sentry**:
1. Go to Sentry → Project Settings → Alerts
2. Create New Alert → "Issues"
3. Configure:
   ```
   When: An event is seen
   If: percent of sessions affected by errors
   Value: 5%
   In: 5 minutes
   Then: Send a notification to PagerDuty and #incidents
   ```

### Specific Error Alerts

**Authentication Failures** (HIGH):
```
Alert Name: High Authentication Failure Rate
Condition: > 10 auth failures in 5 minutes from same IP
Notification: Slack #security + Email
Purpose: Detect brute force attacks
```

**Database Errors** (CRITICAL):
```
Alert Name: Database Connection Failures
Condition: Any database connection error
Notification: PagerDuty + Slack #incidents
Purpose: Immediate notification of database issues
```

**Security Errors** (CRITICAL):
```
Alert Name: Security Violations
Condition: Any error with tag "security"
Notification: PagerDuty + Slack #security
Purpose: Immediate security incident response
```

### Performance Alerts

**Slow Transactions** (MEDIUM):
```
Alert Name: Slow API Responses
Condition: p95 response time > 1000ms for 10 minutes
Notification: Slack #alerts
Purpose: Performance degradation detection
```

**Configuration**:
1. Sentry → Performance → Alerts
2. Create Alert:
   ```
   When: A performance metric is met
   Metric: p95(transaction.duration)
   Threshold: > 1000ms
   Time period: 10 minutes
   Then: Notify #alerts
   ```

### Sentry Alert Rules (JSON Configuration)

```json
{
  "alerts": [
    {
      "name": "Critical Error Rate",
      "projects": ["care-commons"],
      "conditions": [
        {
          "id": "sentry.rules.conditions.event_frequency.EventFrequencyPercentCondition",
          "interval": "5m",
          "value": 5.0,
          "comparisonType": "percent"
        }
      ],
      "actions": [
        {
          "id": "sentry.integrations.pagerduty.notify_action.PagerDutyNotifyServiceAction",
          "service": "production-oncall"
        },
        {
          "id": "sentry.integrations.slack.notify_action.SlackNotifyServiceAction",
          "workspace": "care-commons",
          "channel": "#incidents"
        }
      ]
    },
    {
      "name": "Database Errors",
      "projects": ["care-commons"],
      "conditions": [
        {
          "id": "sentry.rules.conditions.tagged_event.TaggedEventCondition",
          "key": "error.type",
          "match": "co",
          "value": "database"
        }
      ],
      "actions": [
        {
          "id": "sentry.integrations.slack.notify_action.SlackNotifyServiceAction",
          "workspace": "care-commons",
          "channel": "#incidents"
        }
      ]
    }
  ]
}
```

---

## Prometheus Metrics Alerts

### Alert Manager Configuration

**alertmanager.yml**:
```yaml
global:
  resolve_timeout: 5m
  slack_api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'

route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'slack-notifications'
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty-critical'
    - match:
        severity: high
      receiver: 'slack-alerts'

receivers:
  - name: 'slack-notifications'
    slack_configs:
      - channel: '#monitoring'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
        title: '{{ .GroupLabels.alertname }}'

  - name: 'slack-alerts'
    slack_configs:
      - channel: '#alerts'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
        title: '{{ .GroupLabels.alertname }}'
        send_resolved: true

  - name: 'pagerduty-critical'
    pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_SERVICE_KEY'
```

### Prometheus Alert Rules

**prometheus-alerts.yml**:
```yaml
groups:
  - name: api_alerts
    interval: 30s
    rules:
      # High Error Rate
      - alert: HighErrorRate
        expr: |
          (
            sum(rate(http_requests_total{status=~"5.."}[5m]))
            /
            sum(rate(http_requests_total[5m]))
          ) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }} (threshold: 5%)"

      # API Response Time
      - alert: SlowAPIResponses
        expr: |
          histogram_quantile(0.95,
            sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
          ) > 1.0
        for: 10m
        labels:
          severity: high
        annotations:
          summary: "Slow API responses"
          description: "95th percentile response time is {{ $value }}s"

      # Database Query Performance
      - alert: SlowDatabaseQueries
        expr: |
          histogram_quantile(0.95,
            sum(rate(db_query_duration_seconds_bucket[5m])) by (le)
          ) > 0.2
        for: 10m
        labels:
          severity: medium
        annotations:
          summary: "Slow database queries"
          description: "95th percentile query time is {{ $value }}s"

  - name: availability_alerts
    interval: 30s
    rules:
      # Service Down
      - alert: ServiceDown
        expr: up == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Service is down"
          description: "{{ $labels.instance }} has been down for more than 2 minutes"

      # Database Connection Issues
      - alert: DatabaseConnectionFailures
        expr: increase(db_connection_errors_total[5m]) > 5
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Database connection failures"
          description: "{{ $value }} database connection errors in last 5 minutes"

  - name: performance_alerts
    interval: 1m
    rules:
      # High Request Rate
      - alert: HighRequestRate
        expr: sum(rate(http_requests_total[1m])) > 1000
        for: 5m
        labels:
          severity: medium
        annotations:
          summary: "Unusually high request rate"
          description: "Request rate is {{ $value }} req/s (possible attack)"

      # Mobile Sync Failures
      - alert: MobileSyncFailures
        expr: |
          (
            sum(rate(mobile_sync_failure_total[5m]))
            /
            sum(rate(mobile_sync_total[5m]))
          ) > 0.1
        for: 10m
        labels:
          severity: high
        annotations:
          summary: "High mobile sync failure rate"
          description: "Sync failure rate is {{ $value | humanizePercentage }}"

  - name: business_alerts
    interval: 5m
    rules:
      # No Visits Created (possible issue)
      - alert: NoVisitsCreated
        expr: increase(visits_created_total[1h]) == 0
        for: 2h
        labels:
          severity: medium
        annotations:
          summary: "No visits created in last hour"
          description: "Possible issue with visit creation functionality"
```

---

## Uptime Monitoring

### Recommended Service: UptimeRobot or Pingdom

**Endpoints to Monitor**:

1. **Health Check** (CRITICAL):
   ```
   URL: https://your-domain.com/health
   Interval: 1 minute
   Expected: 200 OK
   Alert: Immediate (PagerDuty + Slack)
   ```

2. **API Availability** (HIGH):
   ```
   URL: https://your-domain.com/api/health
   Interval: 5 minutes
   Expected: 200 OK
   Alert: Slack #alerts
   ```

3. **Web App** (MEDIUM):
   ```
   URL: https://your-domain.com
   Interval: 5 minutes
   Expected: 200 OK
   Alert: Email + Slack
   ```

### UptimeRobot Configuration Example

```
Monitor Type: HTTPS
Friendly Name: Care Commons API Health Check
URL: https://your-domain.com/health
Monitoring Interval: 1 minute
Monitor Timeout: 30 seconds
Alert Contacts:
  - Slack Integration (care-commons-alerts)
  - PagerDuty Integration (production-oncall)
  - Email (devops@your-domain.com)
```

---

## Log Monitoring

### Vercel Logs

**Access**:
```
Vercel Dashboard → Project → Logs
Filter by severity: Error, Warning
```

**Automated Log Analysis** (Optional - Datadog/LogDNA):
```
Alert on:
- Error log rate > 10/minute
- Specific error patterns:
  - "Database connection failed"
  - "Authentication failed"
  - "Rate limit exceeded"
  - "ECONNREFUSED"
```

---

## Database Monitoring (Neon)

### Neon Dashboard Metrics

**Monitor via Neon Console**:
1. Connection count (alert if > 80% of max)
2. Query duration (alert if p95 > 200ms)
3. Active queries (alert if > 50 concurrent)
4. Storage usage (alert at 80% capacity)

**Alerts to Configure**:

1. **High Connection Count** (MEDIUM):
   ```
   Threshold: > 16 connections (80% of 20 max)
   Action: Scale connection pool or investigate connection leaks
   ```

2. **Long-Running Queries** (HIGH):
   ```
   Threshold: Query running > 30 seconds
   Action: Investigate and potentially kill query
   ```

3. **Storage Usage** (MEDIUM):
   ```
   Threshold: > 80% of allocated storage
   Action: Plan for storage upgrade
   ```

---

## Alert Notification Channels

### Slack Integration

**Channels**:
- `#incidents`: CRITICAL alerts (PagerDuty, major outages)
- `#alerts`: HIGH priority alerts
- `#monitoring`: General monitoring, metrics
- `#security`: Security-related alerts

**Slack Webhook Configuration**:
```bash
# In Vercel environment variables or secrets manager
SLACK_WEBHOOK_INCIDENTS=https://hooks.slack.com/services/XXX/YYY/ZZZ
SLACK_WEBHOOK_ALERTS=https://hooks.slack.com/services/AAA/BBB/CCC
SLACK_WEBHOOK_SECURITY=https://hooks.slack.com/services/DDD/EEE/FFF
```

### PagerDuty Integration

**Services**:
- `production-oncall`: CRITICAL production incidents
- `database-oncall`: Database-specific issues

**Escalation Policy**:
```
Level 1: Primary On-Call (notify immediately)
Level 2: Secondary On-Call (escalate after 15 min)
Level 3: Engineering Manager (escalate after 30 min)
```

### Email Alerts

**Distribution Lists**:
- `alerts@your-domain.com`: All alerts
- `oncall@your-domain.com`: On-call rotation
- `devops@your-domain.com`: Infrastructure alerts

---

## Alert Response Procedures

### CRITICAL Alert Response

**Immediate Actions** (< 5 minutes):
1. Acknowledge alert in PagerDuty
2. Join incident bridge call (if configured)
3. Post in #incidents: "Investigating [alert name]"
4. Check system status (health endpoints, Sentry, Vercel)
5. Determine if rollback needed (see ROLLBACK_PROCEDURES.md)

**If Service Down**:
1. Check Vercel status page
2. Verify DNS resolution
3. Test health endpoints
4. Review recent deployments
5. Execute rollback if needed

**If Database Issues**:
1. Check Neon status page
2. Review connection pool metrics
3. Check for long-running queries
4. Verify database connectivity
5. Consider read-only mode if write issues

### HIGH Alert Response

**Actions** (< 15 minutes):
1. Post in #alerts: "Investigating [alert name]"
2. Review metrics and logs
3. Identify affected users/scope
4. Determine fix strategy (hotfix vs. rollback)
5. Implement fix
6. Monitor for resolution

### MEDIUM Alert Response

**Actions** (< 1 hour):
1. Create ticket for investigation
2. Review trends (is it getting worse?)
3. Schedule fix (immediate or next sprint)
4. Update team on findings

---

## Alert Tuning

### Prevent Alert Fatigue

**Review Quarterly**:
- Alert frequency (too many false positives?)
- Alert thresholds (too sensitive or not sensitive enough?)
- Notification channels (right people getting alerts?)
- Response times (are we meeting SLAs?)

**Best Practices**:
- ✅ Alert on symptoms, not causes
- ✅ Make alerts actionable
- ✅ Include context in alert messages
- ✅ Set appropriate thresholds (not too sensitive)
- ✅ Use alert grouping to reduce noise
- ❌ Don't alert on every error
- ❌ Don't send all alerts to same channel
- ❌ Don't ignore alerts (tune or remove)

---

## Testing Alerts

### Monthly Alert Test

**Procedure**:
1. **Test Sentry Alerts**:
   ```javascript
   // Trigger test error in staging
   throw new Error('Test alert - please ignore');
   ```

2. **Test Uptime Monitoring**:
   - Temporarily disable health endpoint in staging
   - Verify alert received
   - Re-enable endpoint

3. **Test PagerDuty**:
   - Send test page
   - Verify received by on-call
   - Verify escalation policy works

4. **Test Slack Webhooks**:
   ```bash
   curl -X POST -H 'Content-type: application/json' \
     --data '{"text":"Test alert - monitoring system check"}' \
     $SLACK_WEBHOOK_URL
   ```

---

## Monitoring Dashboard

### Recommended Tools

1. **Grafana** (for Prometheus metrics):
   - Real-time metrics visualization
   - Custom dashboards
   - Alert visualization

2. **Vercel Analytics**:
   - Built-in request analytics
   - Performance metrics
   - No configuration needed

3. **Sentry Performance**:
   - Transaction traces
   - Error tracking with context
   - Release tracking

### Key Metrics Dashboard

**Panels to Include**:
1. Request rate (req/s)
2. Response time (p50, p95, p99)
3. Error rate (%)
4. Database query time (p95)
5. Active users
6. Top errors (last hour)
7. Deployment timeline

---

## Appendix: Alert Checklist

**Initial Setup**:
- [ ] Sentry project created and DSN configured
- [ ] Sentry alert rules configured
- [ ] Prometheus metrics endpoint exposed
- [ ] Alert Manager configured (if using Prometheus)
- [ ] Uptime monitoring configured (UptimeRobot/Pingdom)
- [ ] Slack webhooks configured
- [ ] PagerDuty service created
- [ ] PagerDuty escalation policy configured
- [ ] Email distribution lists created
- [ ] Alert response procedures documented
- [ ] Team trained on alert response
- [ ] Test alerts sent and verified

**Quarterly Review**:
- [ ] Review alert frequency and false positive rate
- [ ] Update alert thresholds based on traffic growth
- [ ] Test all alert channels
- [ ] Update on-call rotation
- [ ] Review alert response times
- [ ] Update alert documentation

---

**Document Version**: 1.0
**Last Review**: 2025-11-08
**Next Review**: 2026-02-08 (Quarterly)
**Last Alert Test**: [Schedule first test]
