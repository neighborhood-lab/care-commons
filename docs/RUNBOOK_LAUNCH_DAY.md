# Launch Day Runbook

## T-24 Hours (Day Before Launch)

- [ ] **Code freeze**: No new code merged to main
- [ ] **Final testing**: Run full test suite
- [ ] **Database backup**: Ensure recent backup exists
- [ ] **Verify production**: Run `npm run verify:production`
- [ ] **Team briefing**: Review launch plan with team
- [ ] **Communication draft**: Prepare launch announcement
- [ ] **Support ready**: Ensure support channels staffed

## T-1 Hour (Launch Preparation)

- [ ] **Team assembly**: All team members online and ready
- [ ] **Monitoring setup**: Open all monitoring dashboards
  - Application logs
  - Error tracking (Sentry)
  - Performance metrics
  - Database monitoring
- [ ] **Communication channels**: Slack/Teams channel active
- [ ] **Final checks**: Run smoke tests
- [ ] **Rollback plan**: Review rollback procedure

## T-0 (Launch!)

- [ ] **Deploy to production**: Merge to main, auto-deploy
- [ ] **Watch deployment**: Monitor deployment logs
- [ ] **Health check**: Verify health endpoint returns 200
- [ ] **Smoke tests**: Run automated smoke tests
- [ ] **Manual verification**: Test critical features manually
  - [ ] Login
  - [ ] Create client
  - [ ] Create visit
  - [ ] Mobile app check-in

## T+15 Minutes (Post-Launch Monitoring)

- [ ] **Monitor error rates**: Should be <1%
- [ ] **Monitor response times**: Should be <200ms average
- [ ] **Check logs**: No critical errors
- [ ] **First user test**: Have real user test the system
- [ ] **Send announcement**: Launch announcement email/post

## T+1 Hour (Stabilization)

- [ ] **Review metrics**: Error rates, response times, user activity
- [ ] **Address issues**: Triage and fix any issues
- [ ] **User feedback**: Monitor support channels
- [ ] **Team check-in**: Status update with team

## T+4 Hours (Continued Monitoring)

- [ ] **Extended monitoring**: Continue watching metrics
- [ ] **User onboarding**: Assist first users
- [ ] **Documentation review**: Update based on user questions
- [ ] **Performance check**: Verify system under real load

## T+24 Hours (First Day Complete)

- [ ] **Metrics review**: Analyze first day metrics
  - Total users signed up
  - Total visits created
  - Error rates
  - Performance metrics
- [ ] **Issue triage**: Prioritize bugs and feature requests
- [ ] **Team debrief**: What went well, what to improve
- [ ] **Celebrate**: Team celebration! 🎉

## Emergency Contacts

- **Technical Lead**: [PHONE]
- **Database Admin**: [PHONE]
- **DevOps**: [PHONE]
- **Support Lead**: [PHONE]

## Rollback Procedure

If critical issues arise:

1. **Assess severity**: Is rollback necessary?
2. **Communicate**: Notify team of rollback decision
3. **Execute rollback**: Run `npm run deploy:rollback`
4. **Verify**: Check health endpoint
5. **Investigate**: Analyze root cause
6. **Fix**: Address issues before re-deploy
7. **Communicate**: Update users on status
