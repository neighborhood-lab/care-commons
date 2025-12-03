# Stakeholder Communications Templates

**Version**: 1.0
**Last Updated**: 2025-11-08
**Owner**: Product/Engineering Leadership

---

## Overview

This document provides templates for communicating with stakeholders during key production events: launches, incidents, and updates.

---

## Pre-Launch Communications

### Template 1: Pre-Launch Announcement (T-7 Days)

**Subject**: Folk Production Launch - [Launch Date]

**To**: Executive team, stakeholders, partners

**Email Body**:

```
Hi Team,

I'm excited to announce that Folk will be launching to production on [Launch Date] at [Launch Time].

**What's Launching:**
Folk is our comprehensive care management platform featuring:
- Client demographics and care plan management
- Caregiver scheduling and visit tracking
- Electronic Visit Verification (EVV) compliance
- Family engagement portal
- Mobile app for field staff
- Multi-state compliance (TX, FL, CA, NY, PA, IL, OH)

**Launch Timeline:**
- Date: [Day of Week], [Month Day, Year]
- Time: [Start Time] - [End Time] [Timezone]
- Duration: Approximately 2 hours

**What to Expect:**
- Brief maintenance window during deployment (< 15 minutes)
- Comprehensive monitoring during launch window
- Full team availability for immediate support
- Post-launch status update within 2 hours

**Who to Contact:**
- Technical Issues: [Engineering Lead] - [Email]
- Product Questions: [Product Manager] - [Email]
- Business Questions: [Project Manager] - [Email]

**Preparation:**
Our team has completed:
✅ Comprehensive security audit
✅ Load testing for expected traffic
✅ Database backup and recovery verification
✅ End-to-end testing across all features
✅ Compliance verification (HIPAA, EVV)

We're ready for launch and excited to get Folk into production!

Best regards,
[Your Name]
[Your Title]
```

---

## Launch Day Communications

### Template 2: Launch Kickoff (H-0)

**Subject**: 🚀 Folk Launch - In Progress

**To**: Internal team, key stakeholders

**Slack/Email**:

```
🚀 FOLK PRODUCTION LAUNCH - IN PROGRESS

Status: Deployment started at [Time]

Timeline:
✅ Pre-launch checks completed
🔄 Deployment in progress
⏳ Health checks pending
⏳ Smoke tests pending
⏳ Final verification pending

Current Status:
- Deployment triggered: [Time]
- Expected completion: [Time + 15 min]
- Monitoring: Active

Team Status:
- All hands on deck
- Incident bridge open
- Monitoring dashboards active

Next Update: [Time + 30 minutes]

[Real-time status link if available]
```

### Template 3: Launch Success (H+2)

**Subject**: ✅ Folk Launch Complete - System Live

**To**: All stakeholders

**Email Body**:

```
Hi Team,

I'm pleased to announce that Folk has been successfully launched to production!

**Launch Summary:**
- Deployment started: [Start Time]
- Deployment completed: [End Time]
- Total duration: [Duration]
- Status: ✅ Successful

**Verification Results:**
✅ All health checks passing
✅ Database migrations completed successfully
✅ Zero critical errors detected
✅ Performance within expected parameters
✅ All core features functional

**System Metrics (First Hour):**
- Uptime: 100%
- Response time (p95): [XX]ms
- Error rate: [X]%
- Active users: [XX]

**Access Information:**
- Web Application: https://[your-domain].com
- Mobile Apps: Available in App Store and Google Play
- Support: support@[your-domain].com

**What's Next:**
- Continued monitoring for 24 hours
- Daily status updates for first week
- User onboarding begins [Date]

**Support:**
For questions or issues:
- Support Email: support@[your-domain].com
- Support Slack: #folkcare-support
- Documentation: https://docs.[your-domain].com

Thank you to everyone who contributed to this successful launch!

Best regards,
[Your Name]
[Your Title]
```

---

## Incident Communications

### Template 4: Incident Notification (Critical)

**Subject**: 🔴 URGENT: Folk Production Incident

**To**: Executive team, key stakeholders

**Email/Slack**:

```
🔴 CRITICAL PRODUCTION INCIDENT

Incident ID: INC-[Number]
Severity: CRITICAL
Started: [Time]
Status: INVESTIGATING

**Issue:**
[Brief description of the problem]

**Impact:**
- Affected users: [All / Subset / Specific feature]
- Affected functionality: [Description]
- Current workaround: [Available / Not available]

**Actions Taken:**
1. [Action 1]
2. [Action 2]
3. [Action 3]

**Current Status:**
[What we're doing right now]

**Next Steps:**
[What we plan to do]

**Team:**
- Incident Commander: [Name]
- Tech Lead: [Name]
- Status: All hands on deck

**Updates:**
Will provide updates every [15/30/60] minutes or when status changes.

**Contact:**
- Incident Slack: #incidents
- On-Call: [Phone Number]

Next Update: [Time]
```

### Template 5: Incident Resolution

**Subject**: ✅ RESOLVED: Folk Production Incident

**To**: All stakeholders who received incident notification

**Email Body**:

```
Hi Team,

The Folk production incident has been resolved.

**Incident Summary:**
- Incident ID: INC-[Number]
- Severity: CRITICAL
- Started: [Start Time]
- Resolved: [End Time]
- Duration: [Duration]

**Issue Description:**
[Detailed description of what happened]

**Root Cause:**
[What caused the issue]

**Impact:**
- Users affected: [Number/Percentage]
- Duration of impact: [Duration]
- Data loss: [None / Minimal / Description]
- Functionality affected: [List]

**Resolution:**
[What we did to fix it]

**Preventive Measures:**
To prevent recurrence, we are:
1. [Measure 1]
2. [Measure 2]
3. [Measure 3]

**Current Status:**
✅ System fully operational
✅ All health checks passing
✅ Performance normal
✅ No data loss

**Post-Mortem:**
A detailed post-mortem analysis will be completed by [Date] and shared with stakeholders.

**Apology:**
We apologize for the disruption and appreciate your patience during the incident. We take these incidents seriously and are committed to continuous improvement.

**Questions:**
If you have questions, please contact:
- Engineering: [Email]
- Product: [Email]

Thank you,
[Your Name]
[Your Title]
```

---

## Maintenance Communications

### Template 6: Scheduled Maintenance Notice

**Subject**: Scheduled Maintenance - Folk - [Date]

**To**: All users, stakeholders

**Send**: 7 days before, 24 hours before, 1 hour before

**Email Body** (7 days before):

```
Hi,

We will be performing scheduled maintenance on the Folk platform.

**Maintenance Window:**
- Date: [Day of Week], [Month Day, Year]
- Time: [Start Time] - [End Time] [Timezone]
- Duration: Approximately [Duration]

**What's Happening:**
We will be:
- [Maintenance activity 1]
- [Maintenance activity 2]
- [Maintenance activity 3]

**Impact:**
- [Expected impact, e.g., "Brief service interruption (< 5 minutes)"]
- [Affected features, e.g., "All features affected during maintenance window"]
- [Mobile app: "Will continue to work offline"]

**What You Should Do:**
- Save any work in progress before maintenance window
- Log out before [Start Time]
- Mobile app users: Ensure recent sync before maintenance

**Updates:**
We will provide updates:
- 24 hours before maintenance
- 1 hour before maintenance
- When maintenance begins
- When maintenance completes

**Questions:**
If you have questions, please contact support@[your-domain].com

Thank you for your understanding.

Best regards,
Folk Team
```

**Email Body** (1 hour before):

```
Hi,

This is a reminder that scheduled maintenance begins in 1 hour.

**Maintenance Window:**
- Starts: [Start Time] (in 1 hour)
- Ends: [End Time]
- Duration: Approximately [Duration]

**Recommended Actions:**
- Save and close any work in progress
- Log out of the web application
- Mobile app will continue to work offline

We will send an update when maintenance is complete.

Thank you,
Folk Team
```

---

## Status Update Communications

### Template 7: Weekly Status Update

**Subject**: Folk - Week [Number] Status Update

**To**: Stakeholders, management

**Frequency**: Weekly (first month post-launch), then monthly

**Email Body**:

```
Hi Team,

Here's the weekly status update for Folk.

**Period:** [Start Date] - [End Date]

**System Health:**
- Uptime: [XX.X]%
- Average response time: [XX]ms
- Error rate: [X.XX]%
- Total API requests: [XXX,XXX]

**User Metrics:**
- Total active users: [XXX]
- New users this week: [XX]
- Total visits tracked: [X,XXX]
- Mobile app installs: [XXX]

**Key Achievements:**
✅ [Achievement 1]
✅ [Achievement 2]
✅ [Achievement 3]

**Issues Resolved:**
- [Number] critical issues resolved
- [Number] high-priority issues resolved
- Average resolution time: [X] hours

**Ongoing Issues:**
1. [Issue 1] - Status: [In Progress] - ETA: [Date]
2. [Issue 2] - Status: [Investigating] - ETA: [TBD]

**Upcoming:**
- [Planned feature/update 1]
- [Planned maintenance window if any]
- [Other upcoming items]

**Feedback:**
- User satisfaction: [X/5 stars or percentage]
- Top feature requests:
  1. [Request 1]
  2. [Request 2]
  3. [Request 3]

**Questions or Concerns:**
Please reach out to [Contact] with any questions.

Best regards,
[Your Name]
```

---

## Rollback Communications

### Template 8: Rollback Notification

**Subject**: Folk - Deployment Rolled Back

**To**: Internal team, stakeholders

**Email/Slack**:

```
DEPLOYMENT ROLLBACK EXECUTED

Time: [Time]
Reason: [Brief reason]

**What Happened:**
[Description of issue that triggered rollback]

**Action Taken:**
Rolled back to previous stable version ([Version/Commit])

**Current Status:**
✅ System restored to stable state
✅ Health checks passing
✅ Users can access platform normally

**Impact:**
- Duration of issue: [Duration]
- Users affected: [Number/Percentage]
- Data loss: [None / Description]

**Next Steps:**
1. Root cause analysis
2. Fix development and testing
3. Rescheduled deployment: [Date/TBD]

**Communication:**
- Users: [Will be notified / Were not impacted, no notification needed]
- Post-mortem: [Date]

Questions: Contact [Name] at [Email]
```

---

## User Communications

### Template 9: New Feature Announcement

**Subject**: New Feature: [Feature Name] Now Available

**To**: All users

**Email Body**:

```
Hi [First Name],

We're excited to announce a new feature in Folk: [Feature Name]!

**What's New:**
[Description of the new feature and its benefits]

**How to Use It:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Who Can Use It:**
This feature is available to: [All users / Specific roles]

**Learn More:**
- Video Tutorial: [Link]
- Documentation: [Link]
- FAQ: [Link]

**Need Help?**
Our support team is here to help:
- Email: support@[your-domain].com
- Phone: [Phone Number]
- Live Chat: Available in the app

We hope you enjoy this new feature!

Best regards,
The Folk Team

P.S. Have feedback or feature requests? Reply to this email - we'd love to hear from you!
```

### Template 10: Service Issue Notification (User-Facing)

**Subject**: Folk - Service Issue Update

**To**: Affected users

**Email Body**:

```
Hi,

We're currently experiencing an issue with Folk that may affect your ability to [description of impact].

**What We Know:**
- Issue started: [Time]
- Affected functionality: [Description]
- Users affected: [All / Specific feature users]

**Current Workaround:**
[If available, describe workaround. If not: "Our team is working on a resolution and we'll update you as soon as we have more information."]

**What We're Doing:**
Our engineering team is actively working to resolve this issue. We're committed to restoring full functionality as quickly as possible.

**Updates:**
We'll send another update within [timeframe] or when the issue is resolved.

**Questions:**
If you have urgent questions, please contact:
- Support: support@[your-domain].com
- Phone: [Phone Number]

We apologize for the inconvenience and appreciate your patience.

Best regards,
The Folk Team
```

---

## Post-Mortem Communications

### Template 11: Post-Mortem Summary (Public)

**Subject**: Folk Incident Post-Mortem - [Date]

**To**: Stakeholders, affected users (if appropriate)

**Email Body**:

```
Hi,

Following our incident on [Date], we'd like to share what we learned and how we're improving.

**Incident Summary:**
- Date: [Date]
- Duration: [Duration]
- Impact: [Description]

**What Happened:**
[Detailed but accessible explanation of the incident]

**Root Cause:**
[What caused the issue]

**How We Responded:**
[Timeline of key response actions]

**What We're Doing to Prevent This:**
1. **Immediate Actions** (Completed):
   - [Action 1]
   - [Action 2]

2. **Short-term Improvements** (Next 2 weeks):
   - [Action 1]
   - [Action 2]

3. **Long-term Improvements** (Next quarter):
   - [Action 1]
   - [Action 2]

**Our Commitment:**
We take incidents seriously and are committed to continuous improvement. We've learned from this experience and are implementing changes to prevent similar issues in the future.

**Questions:**
If you have questions about this incident or our response, please don't hesitate to reach out.

Thank you for your patience and understanding.

Best regards,
[Your Name]
[Your Title]
```

---

## Communication Guidelines

### Tone and Style

**DO:**
- ✅ Be transparent and honest
- ✅ Use clear, simple language
- ✅ Provide specific timelines
- ✅ Take responsibility for issues
- ✅ Show appreciation for patience
- ✅ Provide actionable next steps

**DON'T:**
- ❌ Use technical jargon (unless audience is technical)
- ❌ Make promises you can't keep
- ❌ Blame others or make excuses
- ❌ Minimize impact or severity
- ❌ Leave stakeholders guessing
- ❌ Forget to follow up

### Communication Channels

| Audience | Channel | Urgency |
|----------|---------|---------|
| Executive Team | Email + Slack | High |
| All Stakeholders | Email | Medium |
| End Users | Email + In-app | Medium |
| Support Team | Slack + Email | High |
| Engineering | Slack | Immediate |

### Timing Guidelines

| Event | When to Communicate |
|-------|---------------------|
| Planned Maintenance | 7 days, 24 hours, 1 hour before |
| Launch Announcement | 7 days before |
| Launch Status | H+0, H+2, H+24, Week 1 |
| Critical Incident | Immediately (< 15 min) |
| Incident Updates | Every 30-60 minutes |
| Incident Resolution | Immediately upon resolution |
| Post-Mortem | Within 5 business days |
| Weekly Updates | Every Monday (first month) |
| Monthly Updates | First Monday of month (ongoing) |

---

## Contact Information

**For Communications**:
- Product/Engineering Lead: [Name] - [Email]
- Customer Success: [Name] - [Email]
- Marketing/Comms: [Name] - [Email]

**Approval Required For**:
- User-facing communications (Customer Success)
- Incident notifications to executives (Engineering Lead)
- Post-mortem summaries (Engineering Manager)

---

**Document Version**: 1.0
**Last Review**: 2025-11-08
**Templates Updated**: As needed based on feedback
