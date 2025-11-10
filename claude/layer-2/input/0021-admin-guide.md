# Task 0079: Administrator Quick Start Guide and Onboarding

**Priority:** 🔴 CRITICAL
**Estimated Effort:** 3-4 days
**Type:** Documentation / User Experience / Onboarding
**Persona:** Administrator

---

## Context

Administrators are the first users to interact with Care Commons when an agency deploys the platform. Their first 15-30 minutes determines whether they succeed in getting the platform configured or abandon it due to confusion.

**Current State:**
- Technical deployment documentation exists
- No persona-specific quick start guide
- No guided onboarding flow in the application
- Administrators must figure out configuration order themselves
- High risk of misconfiguration or incomplete setup

**Goal State:**
- Step-by-step guide for first 30 minutes
- Interactive onboarding wizard in application
- Clear success criteria at each step
- Administrator feels confident and successful
- Agency goes from deployment to first visit scheduled in <2 hours

---

## Objectives

1. **Create Administrator Quick Start Guide** (documentation)
2. **Build In-App Onboarding Wizard** (interactive UI)
3. **Create Video Walkthrough** (visual learning)
4. **Add Configuration Validation** (prevent mistakes)
5. **Create Troubleshooting Guide** (handle common issues)

---

## Deliverable 1: Administrator Quick Start Guide

**File:** `docs/user-guides/administrator-quick-start.md`

```markdown
# Administrator Quick Start Guide

**Time to Complete:** 30-45 minutes
**Goal:** Get your agency fully configured and ready to schedule the first visit

---

## Welcome to Care Commons! 🎉

This guide will walk you through setting up Care Commons for your home healthcare agency. By the end, you'll have:

✅ Your agency profile configured
✅ Your first coordinator account created
✅ EVV compliance settings configured
✅ Rate schedules set up
✅ Ready to onboard clients and caregivers

---

## Step 1: First Login (2 minutes)

1. **Access your deployed application:**
   - Vercel: `https://your-agency.vercel.app`
   - Self-hosted: `https://your-domain.com`

2. **Create your administrator account:**
   - Navigate to `/admin/setup` (only accessible on first deployment)
   - Enter your details:
     - **Email:** your-email@youragency.com
     - **Password:** Create a strong password (12+ characters, mixed case, numbers, symbols)
     - **First Name & Last Name:** Your name
   - Click **Create Admin Account**

3. **Verify your email** (if email verification is enabled)

✅ **Success Indicator:** You're logged in and see the admin dashboard

---

## Step 2: Configure Agency Profile (5 minutes)

1. **Navigate to:** Settings → Agency Profile

2. **Fill in agency information:**

   **Basic Information:**
   - Agency Name: Sunshine Home Healthcare
   - Phone: (512) 555-0100
   - Email: info@sunshinehomecare.com
   - Website: www.sunshinehomecare.com

   **Address:**
   - Street Address: 123 Main Street
   - City: Austin
   - State: Texas
   - ZIP: 78701

   **Operating Details:**
   - Operating States: Select all states where you provide care (TX, FL, OH, etc.)
   - Time Zone: America/Chicago (select your timezone)
   - Business Hours: 8:00 AM - 6:00 PM, Monday-Friday

3. **Upload Agency Logo** (optional but recommended)
   - Max size: 2MB
   - Recommended: 400x400 pixels, transparent background

4. **Click Save**

✅ **Success Indicator:** Agency name appears in top navigation

---

## Step 3: Configure EVV Compliance Settings (10 minutes)

**What is EVV?** Electronic Visit Verification is required by Medicaid for home healthcare services in most states. Care Commons helps you stay compliant.

1. **Navigate to:** Settings → EVV Configuration

2. **For each operating state:**

   **Texas Example:**
   - **State:** Texas
   - **EVV Provider:** Select your state's mandated system (e.g., Sandata, HHAeXchange)
   - **Provider Account ID:** Your account ID with the EVV vendor
   - **API Credentials:** Enter credentials provided by EVV vendor
   - **GPS Verification:** Enable
   - **GPS Tolerance:** 300 feet (recommended)
   - **Signature Required:** Yes (for Texas Medicaid)

   **Not sure which EVV provider?**
   - [Texas HHSC EVV Information](https://hhs.texas.gov/services/health/medicaid-chip/provider-information/behavioral-health-services-providers/electronic-visit-verification-evv)
   - Contact your state Medicaid office

3. **Test EVV Connection:**
   - Click **Test Connection** button
   - You should see: ✅ "Connection successful"

4. **Click Save EVV Settings**

✅ **Success Indicator:** All operating states show ✅ "Configured"

**Troubleshooting:**
- ❌ "Connection failed" → Verify API credentials are correct
- ❌ "Invalid account ID" → Contact your EVV vendor

---

## Step 4: Set Up Service Rate Schedules (5 minutes)

1. **Navigate to:** Settings → Billing → Rate Schedules

2. **Create rate schedule for each service type:**

   **Example: Personal Care Services**
   - **Service Name:** Personal Care
   - **Service Code:** PC001 (your billing code)
   - **Base Rate:** $25.00/hour
   - **Weekend Rate:** $30.00/hour (optional)
   - **Holiday Rate:** $35.00/hour (optional)
   - **Overtime Rate:** $37.50/hour (time-and-a-half)

   **Example: Skilled Nursing**
   - **Service Name:** Skilled Nursing
   - **Service Code:** SN001
   - **Base Rate:** $65.00/hour

3. **Click Add Rate Schedule** for each service

4. **Set default rate schedule** (used for new clients)

✅ **Success Indicator:** Rate schedules appear in dropdown when creating visits

---

## Step 5: Create Coordinator Accounts (5 minutes)

Coordinators manage day-to-day operations (scheduling, client/caregiver management).

1. **Navigate to:** Users → Add User

2. **For each coordinator:**
   - **Email:** coordinator@youragency.com
   - **First Name:** Emily
   - **Last Name:** Rodriguez
   - **Role:** Coordinator
   - **Send Invitation Email:** ✅ Checked

3. **Click Create User**

4. **Coordinator receives email:**
   - Subject: "Welcome to [Your Agency] Care Commons"
   - Contains: Temporary password or password reset link
   - They log in and set their own password

5. **Repeat for all coordinators** (recommend 2-3 to start)

✅ **Success Indicator:** Coordinators can log in and see coordinator dashboard

---

## Step 6: Configure Notification Settings (3 minutes)

1. **Navigate to:** Settings → Notifications

2. **Email Notifications:**
   - **Provider:** SendGrid (recommended) or AWS SES
   - **API Key:** Your SendGrid API key
   - **From Email:** notifications@youragency.com
   - **From Name:** Your Agency Name

3. **Test Email:**
   - Click **Send Test Email**
   - Check your inbox for test email

4. **SMS Notifications (optional but recommended):**
   - **Provider:** Twilio
   - **Account SID:** Your Twilio account SID
   - **Auth Token:** Your Twilio auth token
   - **From Number:** Your Twilio phone number

5. **Test SMS:**
   - Enter your phone number
   - Click **Send Test SMS**

✅ **Success Indicator:** You receive test email and SMS

---

## Step 7: Review Dashboard (2 minutes)

1. **Navigate to:** Dashboard

2. **You should see:**
   - **Welcome message** with setup progress
   - **Quick stats:** 0 clients, 0 caregivers, 0 visits (expected for new setup)
   - **Quick actions:** Add Client, Add Caregiver, Schedule Visit
   - **Recent activity:** Empty (will populate as you use the system)

---

## Next Steps: Onboarding Clients and Caregivers

Now that your agency is configured, you're ready to:

1. **Add Clients** → See [Client Onboarding Guide](./client-onboarding.md)
2. **Add Caregivers** → See [Caregiver Onboarding Guide](./caregiver-onboarding.md)
3. **Schedule First Visit** → See [Scheduling Guide](./scheduling-guide.md)
4. **Invite Family Members** → See [Family Portal Guide](./family-portal.md)

---

## Quick Reference: What You Just Set Up

| Step | What You Did | Why It Matters |
|------|--------------|----------------|
| 1 | Created admin account | Gives you full access to configure the platform |
| 2 | Agency profile | Your agency info appears on invoices, emails, and family portal |
| 3 | EVV compliance | Ensures visits are compliant with state regulations |
| 4 | Rate schedules | Enables accurate billing for services |
| 5 | Coordinator accounts | Delegates daily operations to your team |
| 6 | Notifications | Keeps everyone informed of visit updates |
| 7 | Dashboard review | Central hub for monitoring agency operations |

---

## Troubleshooting

**Can't access /admin/setup?**
- This page is only available before the first admin account is created
- If already created, log in with existing credentials

**Email notifications not sending?**
- Verify SendGrid API key is correct
- Check SendGrid account is active and verified
- Check spam folder

**EVV test connection failed?**
- Double-check API credentials
- Ensure account is active with EVV vendor
- Contact vendor support if needed

**Need help?**
- 📚 [Full Documentation](https://docs.care-commons.com)
- 💬 [Community Forum](https://forum.care-commons.com)
- 📧 [Email Support](mailto:support@care-commons.com)

---

## What's Next?

- **Learn More:** [Full Administrator Guide](./administrator-complete-guide.md)
- **Video Tutorial:** [Watch Setup Walkthrough](https://www.youtube.com/watch?v=xxx)
- **Demo Data:** [Seed Demo Data](./demo-data-setup.md) to explore features

**Ready to onboard your first client?** → [Client Onboarding Guide](./client-onboarding.md)
```

---

## Deliverable 2: In-App Onboarding Wizard

**File:** `packages/web/src/components/onboarding/AdminOnboardingWizard.tsx`

```tsx
import React, { useState } from 'react';
import { CheckCircle, Circle } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export function AdminOnboardingWizard() {
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'agency-profile',
      title: 'Configure Agency Profile',
      description: 'Set up your agency name, address, and contact info',
      completed: false,
    },
    {
      id: 'evv-settings',
      title: 'Configure EVV Compliance',
      description: 'Set up Electronic Visit Verification for your operating states',
      completed: false,
    },
    {
      id: 'rate-schedules',
      title: 'Set Up Rate Schedules',
      description: 'Define billing rates for your services',
      completed: false,
    },
    {
      id: 'coordinators',
      title: 'Add Coordinator Accounts',
      description: 'Invite your care coordinators to the platform',
      completed: false,
    },
    {
      id: 'notifications',
      title: 'Configure Notifications',
      description: 'Set up email and SMS notifications',
      completed: false,
    },
  ]);

  const [currentStep, setCurrentStep] = useState(0);

  const progress = (steps.filter(s => s.completed).length / steps.length) * 100;

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">
          Welcome to Care Commons!
        </h2>
        <p className="mt-2 text-gray-600">
          Let's get your agency set up in just a few steps. This should take about 30 minutes.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Setup Progress
          </span>
          <span className="text-sm font-medium text-gray-700">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`
              flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all
              ${step.completed
                ? 'border-green-500 bg-green-50'
                : index === currentStep
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
            onClick={() => setCurrentStep(index)}
          >
            <div className="flex-shrink-0 mr-4">
              {step.completed ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <Circle className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {index + 1}. {step.title}
              </h3>
              <p className="text-gray-600">{step.description}</p>
              {index === currentStep && !step.completed && (
                <button
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  onClick={() => {
                    // Navigate to the relevant settings page
                    window.location.href = `/settings/${step.id}`;
                  }}
                >
                  Complete This Step →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {progress === 100 && (
        <div className="mt-8 p-6 bg-green-50 border-2 border-green-500 rounded-lg">
          <h3 className="text-xl font-bold text-green-900 mb-2">
            🎉 Setup Complete!
          </h3>
          <p className="text-green-800 mb-4">
            Your agency is now configured and ready to go. You can now add clients,
            onboard caregivers, and schedule visits.
          </p>
          <div className="flex gap-4">
            <button
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              onClick={() => window.location.href = '/clients/new'}
            >
              Add Your First Client
            </button>
            <button
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              onClick={() => window.location.href = '/dashboard'}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Help Link */}
      <div className="mt-8 text-center">
        <a
          href="/docs/administrator-quick-start"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          View Full Setup Guide
        </a>
      </div>
    </div>
  );
}
```

**Show wizard on first admin login:**

```tsx
// packages/web/src/pages/Dashboard.tsx

export function Dashboard() {
  const { user } = useAuth();
  const { data: agencyConfig } = useQuery('/api/agency/config');

  const showOnboarding = user.role === 'administrator' && !agencyConfig?.setup_completed;

  if (showOnboarding) {
    return <AdminOnboardingWizard />;
  }

  return <RegularDashboard />;
}
```

---

## Deliverable 3: Video Walkthrough

**Script for Video (to be recorded):**

```
Title: "Care Commons Administrator Setup - Complete Walkthrough"
Duration: 15-20 minutes

[INTRO - 0:00-0:30]
"Welcome to Care Commons! In this video, I'll walk you through setting up
your home healthcare agency from scratch. By the end, you'll be ready to
schedule your first visit. Let's get started!"

[STEP 1: FIRST LOGIN - 0:30-2:00]
- Show accessing the deployment URL
- Creating admin account
- First login experience
- Show the onboarding wizard appearing

[STEP 2: AGENCY PROFILE - 2:00-4:00]
- Navigate to Settings → Agency Profile
- Fill in agency details
- Upload logo
- Save and show where info appears

[STEP 3: EVV CONFIGURATION - 4:00-8:00]
- Explain what EVV is and why it matters
- Show configuring Texas as an example
- Selecting EVV provider
- Entering credentials
- Testing connection
- Show success message

[STEP 4: RATE SCHEDULES - 8:00-10:00]
- Navigate to Billing → Rate Schedules
- Create Personal Care rate
- Create Skilled Nursing rate
- Set default rate
- Show how rates are used in billing

[STEP 5: COORDINATOR ACCOUNTS - 10:00-12:00]
- Navigate to Users → Add User
- Create 2 coordinator accounts
- Show invitation emails
- Log in as coordinator to show their view

[STEP 6: NOTIFICATIONS - 12:00-14:00]
- Configure SendGrid for email
- Send test email
- (Optional) Configure Twilio for SMS
- Show notification preferences

[STEP 7: DASHBOARD TOUR - 14:00-16:00]
- Review admin dashboard
- Show quick stats
- Show recent activity
- Show quick actions

[NEXT STEPS - 16:00-17:00]
- Preview adding first client
- Preview adding first caregiver
- Preview scheduling first visit
- Direct to additional guides

[OUTRO - 17:00-17:30]
"And that's it! Your agency is now fully configured. Check out our other
guides to learn how to add clients, onboard caregivers, and schedule visits.
Thanks for watching!"
```

**Upload to:**
- YouTube
- Vimeo
- Embedded in docs

---

## Deliverable 4: Configuration Validation

**File:** `packages/core/src/services/onboarding-validator.ts`

```typescript
export interface ValidationResult {
  field: string;
  status: 'valid' | 'invalid' | 'warning';
  message: string;
}

export class OnboardingValidator {
  async validateAgencySetup(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Validate agency profile
    const agency = await this.getAgencyConfig();
    if (!agency.name) {
      results.push({
        field: 'agency.name',
        status: 'invalid',
        message: 'Agency name is required',
      });
    }

    // Validate EVV configuration for each operating state
    for (const state of agency.operating_states) {
      if (!agency.evv_providers[state]) {
        results.push({
          field: `evv.${state}`,
          status: 'invalid',
          message: `EVV configuration missing for ${state}`,
        });
      }
    }

    // Validate at least one rate schedule exists
    const rateSchedules = await this.getRateSchedules();
    if (rateSchedules.length === 0) {
      results.push({
        field: 'billing.rate_schedules',
        status: 'invalid',
        message: 'At least one rate schedule is required',
      });
    }

    // Validate at least one coordinator exists
    const coordinators = await this.getCoordinators();
    if (coordinators.length === 0) {
      results.push({
        field: 'users.coordinators',
        status: 'warning',
        message: 'No coordinators added yet - recommended to add at least one',
      });
    }

    // Validate notification settings
    const notifConfig = await this.getNotificationConfig();
    if (!notifConfig.email_configured) {
      results.push({
        field: 'notifications.email',
        status: 'warning',
        message: 'Email notifications not configured - users won\'t receive alerts',
      });
    }

    return results;
  }
}
```

---

## Success Criteria

- [ ] Administrator Quick Start Guide published in docs
- [ ] In-app onboarding wizard implemented and tested
- [ ] Video walkthrough recorded and uploaded
- [ ] Configuration validation prevents incomplete setup
- [ ] User testing shows 90%+ can complete setup in <45 minutes
- [ ] No showstopper issues found during first-time setup
- [ ] Administrators feel confident after completing onboarding

---

## Related Tasks

- Task 0074: End-to-End User Journey Validation
- Task 0075: Production Deployment Runbook
- Task 0076: Demo Data Seeding and Showcase
- Task 0080: Coordinator Quick Start Guide
