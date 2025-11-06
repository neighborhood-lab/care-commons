# Deployment Checklist

## Pre-Deployment

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Changelog updated
- [ ] Stakeholders notified of deployment window

## During Deployment

- [ ] Monitor logs for errors
- [ ] Watch health check endpoint
- [ ] Monitor application metrics (response times, error rates)
- [ ] Verify database migrations applied
- [ ] Run smoke tests

## Post-Deployment

- [ ] Verify critical features working
- [ ] Check error tracking dashboard (Sentry)
- [ ] Monitor user feedback/support tickets
- [ ] Update deployment documentation
- [ ] Notify stakeholders of successful deployment

## Rollback Triggers

Initiate rollback if:

- [ ] Health check fails for >2 minutes
- [ ] Error rate increases >50%
- [ ] Critical feature broken
- [ ] Database migration fails
- [ ] Security vulnerability discovered
