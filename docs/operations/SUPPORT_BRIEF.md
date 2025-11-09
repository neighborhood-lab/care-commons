# Production Support Team Brief

**Version**: 1.0
**Last Updated**: 2025-11-08
**Audience**: Support Team, Customer Success

---

## Overview

This document provides essential information for the support team to effectively assist users and troubleshoot common issues with the Care Commons platform.

---

## System Architecture (Quick Overview)

**Platform Components**:
- **Web Application**: React-based web interface (desktop/tablet/mobile browsers)
- **Mobile Application**: React Native app for iOS/Android (caregiver field app)
- **API Server**: Express.js REST API (backend services)
- **Database**: PostgreSQL (Neon managed)
- **Authentication**: Google OAuth + email/password

**Deployment**:
- **Hosting**: Vercel (serverless)
- **Database**: Neon PostgreSQL
- **Region**: US East (primary)
- **CDN**: Vercel Edge Network

---

## User Roles and Access

### User Types

1. **Organization Admin**:
   - Full access to organization settings
   - Can manage users, branches, clients, caregivers
   - Access to billing and reporting

2. **Branch Manager**:
   - Manage specific branch
   - Assign caregivers to clients
   - Schedule visits
   - View reports for their branch

3. **Caregiver/Staff**:
   - Mobile app access (primary)
   - Clock in/out of visits
   - View assigned schedule
   - Update care tasks
   - Limited web access

4. **Family Member**:
   - View client information (read-only)
   - Receive updates and notifications
   - Message caregivers
   - No access to scheduling

5. **Client** (limited implementation):
   - View own care plan
   - Rate caregivers
   - View visit history

---

## Common Issues and Solutions

### Authentication Issues

#### Issue: "Cannot log in - Invalid credentials"

**Troubleshooting**:
1. Verify email address is correct (case-sensitive)
2. Check if using Google OAuth vs. password auth
3. Try "Forgot Password" flow
4. Check if account exists:
   ```
   Ask: "What email address are you trying to use?"
   Check: Does account exist in system?
   ```

**Resolution**:
- If account doesn't exist → Create account or verify registration
- If password forgotten → Use password reset
- If using wrong auth method → Guide to correct login method
- If account locked → Check auth_audit_log for failed attempts (5 failures = 30 min lockout)

**Escalate if**:
- User claims account exists but system shows it doesn't
- Password reset emails not being received
- Account repeatedly locking

#### Issue: "Google sign-in not working"

**Troubleshooting**:
1. Verify Google OAuth is configured (production environment)
2. Check browser allows popups
3. Try different browser
4. Clear browser cache/cookies

**Resolution**:
- Guide user to enable popups for the domain
- Suggest incognito/private browsing mode
- Offer alternative: password-based login

**Escalate if**:
- Google OAuth completely broken for all users
- Specific Google domains blocked

### Visit Tracking Issues

#### Issue: "Cannot clock in to visit"

**Troubleshooting**:
1. Verify mobile app has location permissions
2. Check internet connectivity
3. Verify visit is scheduled for today
4. Check if already clocked in

**Resolution**:
```
1. Location Permission:
   - iOS: Settings → Privacy → Location Services → Care Commons → "While Using"
   - Android: Settings → Apps → Care Commons → Permissions → Location → "Allow"

2. Offline Mode:
   - App will cache clock-in
   - Will sync when internet restored
   - Check "pending sync" indicator

3. Scheduled Visit:
   - Verify visit appears in app schedule
   - Check date/time of visit
   - Verify caregiver assigned to visit
```

**Escalate if**:
- Location services enabled but not working
- App crashes when attempting clock-in
- Multiple caregivers reporting same issue

#### Issue: "Visit not appearing in mobile app"

**Troubleshooting**:
1. Check when visit was created
2. Verify caregiver assigned to visit
3. Check last sync time in app
4. Try manual sync (pull to refresh)

**Resolution**:
```
1. Manual Sync:
   - Open app
   - Pull down on schedule screen to refresh
   - Wait for sync to complete

2. Verify Assignment:
   - Check web app: Is caregiver assigned to visit?
   - Check visit date: Is it within sync window?

3. Force Re-sync:
   - Log out of mobile app
   - Log back in
   - App will perform full sync
```

**Escalate if**:
- Visit created hours ago but still not syncing
- Multiple users experiencing sync issues
- App shows error during sync

### Performance Issues

#### Issue: "App is slow / pages loading slowly"

**Troubleshooting**:
1. Check internet connection speed
2. Verify system status (no known outages)
3. Ask which specific pages are slow
4. Check if affecting all users or specific user

**Resolution**:
```
1. Network Issues:
   - Test internet speed (speedtest.net)
   - Try different network (WiFi vs. cellular)
   - Restart router if on WiFi

2. Browser Issues (Web App):
   - Clear browser cache
   - Disable browser extensions
   - Try different browser
   - Try incognito mode

3. Mobile App Issues:
   - Close and restart app
   - Check for app updates
   - Restart device
   - Reinstall app (last resort)
```

**Escalate if**:
- Slowness affecting all users
- Specific feature consistently slow for everyone
- Slowness started after recent deployment

### Data Issues

#### Issue: "Client/Caregiver information missing or incorrect"

**Troubleshooting**:
1. When was the issue first noticed?
2. Was information ever correct, or always wrong?
3. Who has access to edit this information?
4. Recent changes to the record?

**Resolution**:
```
1. Check Edit History (if available):
   - View audit log for record
   - Identify who made recent changes

2. Verify Permissions:
   - Does user have permission to view this data?
   - Check branch assignments

3. Sync Issues:
   - Try refreshing the page (web)
   - Try syncing the app (mobile)
```

**Escalate if**:
- Data loss (information disappeared)
- Data corruption (information changed unexpectedly)
- Widespread data issues

---

## Escalation Guidelines

### Severity Levels

**CRITICAL - Escalate Immediately**:
- Complete system outage (no one can access)
- Data loss or corruption
- Security breach or unauthorized access
- Payment processing failures
- HIPAA compliance concerns

**HIGH - Escalate Within 30 Minutes**:
- Feature completely broken for all users
- Major functionality unavailable
- Multiple users reporting same issue
- Database errors

**MEDIUM - Escalate Within 2 Hours**:
- Feature broken for specific user
- Intermittent issues
- Performance degradation
- Non-critical bugs

**LOW - Create Ticket for Next Business Day**:
- Feature requests
- Minor UI issues
- Documentation questions
- General inquiries

### Escalation Contacts

**Tier 1 → Tier 2 (Engineering)**:
- Slack: #support-escalation
- Email: engineering@your-domain.com
- Hours: Mon-Fri 9 AM - 5 PM

**Tier 2 → On-Call (Critical Issues)**:
- Slack: @oncall
- PagerDuty: Page "Production On-Call"
- Hours: 24/7 for CRITICAL issues only

**Security Issues**:
- Slack: #security-incidents
- Email: security@your-domain.com
- Response: Immediate

---

## User Management

### Creating New Users

**Web Interface** (Admin Only):
```
1. Log in as Organization Admin
2. Navigate to: Settings → Users → Add User
3. Fill in:
   - Email address (required)
   - First name, last name
   - Role (Admin, Manager, Staff, Family)
   - Branch assignment
4. Click "Send Invitation"
5. User receives email with activation link
```

**What User Receives**:
- Email invitation
- Link to set password or use Google sign-in
- Link expires in 7 days

### Resetting User Password

**User-Initiated**:
```
1. Login page → "Forgot Password"
2. Enter email address
3. Receive reset link via email
4. Click link → Set new password
5. Password must be:
   - At least 8 characters
   - Include uppercase and lowercase
   - Include number
   - Include special character
```

**Admin-Initiated**:
```
1. Settings → Users → Find user
2. Click "..." menu → "Reset Password"
3. User receives password reset email
```

### Deactivating Users

**When to Deactivate**:
- Employee terminated
- User no longer needs access
- Security concern

**How to Deactivate**:
```
1. Settings → Users → Find user
2. Click "..." menu → "Deactivate"
3. Confirm deactivation
4. User immediately logged out
5. Cannot log in again
```

**Note**: Deactivation does NOT delete data. User's historical records (visits, notes, etc.) remain intact.

---

## Mobile App Support

### App Versions

**Current Supported Versions**:
- iOS: 1.0.0 and above (iOS 14+)
- Android: 1.0.0 and above (Android 8.0+)

**Where to Download**:
- iOS: App Store (search "Care Commons")
- Android: Google Play Store (search "Care Commons")

### Offline Mode

**How It Works**:
```
- App downloads data when online
- Can view schedules offline
- Can clock in/out offline
- Can complete tasks offline
- Data syncs when connection restored
```

**User Guidance**:
```
"The app is designed to work offline. When you don't have
internet, you can still clock in and complete tasks. Your
actions are saved locally and will automatically sync when
you reconnect to the internet. Look for the sync icon in
the app header - if it's spinning, data is syncing."
```

**Sync Status Indicators**:
- ✅ Green checkmark: Fully synced
- 🔄 Spinning icon: Currently syncing
- ⚠️ Warning icon: Pending changes (offline)
- ❌ Error icon: Sync failed (tap for details)

### App Permissions

**Required Permissions**:
1. **Location** (for EVV compliance):
   - Used to verify caregiver at client location
   - Only captured during clock-in/out
   - Required for visit tracking

2. **Camera** (optional):
   - Used to take photos for visit verification
   - Can be denied if photos not required

3. **Notifications** (optional):
   - Alerts for upcoming visits
   - Messages from coordinators

**How to Enable Permissions**:
```
iOS:
1. Settings → Privacy → Location Services
2. Find "Care Commons"
3. Select "While Using the App"

Android:
1. Settings → Apps → Care Commons
2. Permissions → Location
3. Select "Allow only while using the app"
```

---

## System Status and Monitoring

### Check System Status

**Health Check**:
- URL: https://your-domain.com/health
- Expected response: `{"status": "healthy"}`
- If status is not "healthy" → System issue, escalate

**Monitoring Dashboards**:
- Vercel Dashboard: https://vercel.com/[org]/[project]
- Sentry Errors: https://sentry.io/[org]/care-commons
- Status Page (if configured): https://status.your-domain.com

### Known Limitations

**Current Limitations**:
1. **Maximum File Upload**: 10 MB per file
2. **Session Timeout**: 24 hours (then must re-login)
3. **Concurrent Users**: No hard limit (serverless auto-scales)
4. **Mobile Offline Storage**: 30 days of data synced
5. **Report Generation**: Up to 10,000 records per export

**Browser Support**:
- ✅ Chrome (latest 2 versions)
- ✅ Safari (latest 2 versions)
- ✅ Firefox (latest 2 versions)
- ✅ Edge (latest 2 versions)
- ❌ Internet Explorer (not supported)

---

## Compliance and Security

### HIPAA Considerations

**What Support Team Should Know**:
- ✅ System is HIPAA compliant
- ✅ All data encrypted in transit and at rest
- ✅ Access logging enabled (audit trail)
- ✅ Role-based access control

**What NOT to Do**:
- ❌ Do not ask users for passwords
- ❌ Do not log in as users
- ❌ Do not share PHI via unencrypted channels
- ❌ Do not discuss user data in public Slack channels

**Handling PHI in Support**:
```
If user shares PHI in support ticket:
1. Move conversation to secure channel
2. Use encrypted email or secure portal
3. Do not store PHI in support ticketing system
4. Delete PHI from ticket after resolution
```

### Reporting Security Concerns

**If User Reports Security Issue**:
1. **Do NOT dismiss** even if seems unlikely
2. **Get details**: What did they observe?
3. **Escalate immediately** to #security-incidents
4. **Do NOT investigate yourself** (preserve evidence)
5. **Thank user** for reporting

**Examples of Security Concerns**:
- "I can see another user's data"
- "I received someone else's notification"
- "Logged in but showed wrong organization"
- "Suspicious login activity"

---

## Useful Support Commands

### Checking User Account Status

**Information to Collect**:
- User email address
- Organization name
- User role
- Last login time
- Account status (active/inactive)

**Where to Find**:
```
Web App (Admin Only):
1. Settings → Users
2. Search for user email
3. View user details
```

### Checking Visit Status

**Information to Collect**:
- Visit ID (if available)
- Client name
- Caregiver name
- Visit date and time
- Clock-in/out status

**Where to Find**:
```
Web App:
1. Visits → Schedule
2. Filter by date range
3. Search for client or caregiver
4. View visit details
```

---

## FAQs

### General Questions

**Q: Can I use the app without internet?**
A: Yes, the mobile app works offline. You can clock in/out and complete tasks. Data will sync when you reconnect.

**Q: How do I know if my data synced?**
A: Check the sync icon in the app header. A green checkmark means everything is synced.

**Q: Can I use the app on multiple devices?**
A: Yes, you can log in on web and mobile simultaneously. Data syncs across devices.

**Q: How do I update my profile information?**
A: Web: Click your profile icon → Settings → Profile. Mobile: Menu → Profile.

**Q: What if I forget my password?**
A: On the login page, click "Forgot Password" and follow the email instructions.

### Visit Tracking Questions

**Q: Can I clock in early to a visit?**
A: Yes, you can clock in up to 15 minutes before the scheduled start time.

**Q: What if I forget to clock out?**
A: Contact your supervisor to manually clock you out. They can adjust the clock-out time in the web app.

**Q: Why does the app need my location?**
A: Location is required for Electronic Visit Verification (EVV) to comply with state regulations.

**Q: Can I clock in from anywhere?**
A: The app captures your location but doesn't restrict clock-in. However, supervisors can see the GPS coordinates.

---

## Escalation Template

**When Creating Support Ticket for Engineering**:

```
Subject: [SEVERITY] Brief description of issue

Severity: CRITICAL / HIGH / MEDIUM / LOW

User Information:
- Email: user@example.com
- Organization: ABC Home Care
- Role: Caregiver
- User ID (if known): 12345

Issue Description:
[Detailed description of the problem]

Steps to Reproduce:
1. [Step 1]
2. [Step 2]
3. [Expected result vs. actual result]

Impact:
- Number of users affected: [1 / Multiple / All]
- Workaround available: [Yes/No - describe if yes]
- Blocking user's work: [Yes/No]

Troubleshooting Already Attempted:
- [List what you've tried]

Additional Context:
- Browser/Device: [Chrome on Windows / iPhone 12 iOS 15]
- Error messages: [Copy exact error message]
- Screenshots: [Attach if available]
- When issue started: [Date/time or "always been present"]
```

---

## Support Resources

**Documentation**:
- User Guide: [Link to user documentation]
- Video Tutorials: [Link to video library]
- FAQ: [Link to FAQ page]

**Internal Resources**:
- Engineering Team: #support-escalation (Slack)
- Product Team: #product-questions (Slack)
- Knowledge Base: [Link to internal KB]

**External Resources**:
- Status Page: https://status.your-domain.com
- Support Portal: https://support.your-domain.com

---

**Document Version**: 1.0
**Last Review**: 2025-11-08
**Next Review**: Monthly (as system evolves)

---

## Support Team Onboarding Checklist

**New Support Team Member**:
- [ ] Read this support brief
- [ ] Access to support ticketing system
- [ ] Access to Slack channels (#support, #support-escalation)
- [ ] Demo account in production (read-only)
- [ ] Completed training on HIPAA compliance
- [ ] Shadowed 5 support tickets
- [ ] Knows escalation procedures
- [ ] Has emergency contact information
