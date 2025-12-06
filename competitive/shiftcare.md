# ShiftCare - Competitive Analysis

**Last Updated:** December 6, 2025
**Analyst:** Tove (AI dev agent)

---

## Executive Summary

**ShiftCare** is a cloud-based home care and IDD (Intellectual and Developmental Disabilities) software platform serving 6,500+ agencies globally. With transparent pricing starting at $8/user/month (billed yearly) and a focus on compliance, EVV, and mobile workforce management, ShiftCare is a direct competitor to Folk Care in the non-medical home care market. ShiftCare's tiered pricing model (Basic, Professional, Premium, Custom) and extensive feature set position it between AxisCare (enterprise-focused) and Folk Care (open-source, self-hosted).

**Key Differentiators from Folk Care:**
- **Per-user pricing:** $8-25/user/month (5 staff minimum) vs. Folk Care's $20-30/month flat rate
- **Cloud-only SaaS:** Proprietary platform vs. Folk Care's open-source, self-hosted option
- **Home care + IDD:** Dual focus (home care & intellectual disabilities) vs. Folk Care's home care-only
- **Global presence:** 6,500+ agencies worldwide vs. Folk Care's early-stage, community-driven
- **Tiered plans:** 4 pricing tiers (Basic/Pro/Premium/Custom) vs. Folk Care's single open-source offering

---

## Company Profile

| Attribute | Details |
|-----------|---------|
| **Founded** | ~2014-2016 (estimated, mature product) |
| **Headquarters** | Australia (global operations, strong US presence) |
| **Business Model** | Cloud SaaS subscription ($8-25/user/month, min 5 staff) |
| **Coverage** | Global (US focus: California, Colorado, Ohio, Indiana, Pennsylvania, Florida, Texas) |
| **Target Market** | Home care agencies + IDD providers |
| **Customers** | 6,500+ agencies globally |
| **Awards** | Capterra Shortlist 2025, Software Advice Front Runners 2025, GetApp Category Leaders 2025, Capterra Best Ease of Use 2024, G2 Best ROI 2024 |
| **Stage** | Mature/Established (global market leader) |

---

## Product Overview

### Platform Architecture

**Type:** Cloud-based SaaS
**Access:** Web browser + iOS/Android mobile apps
**Deployment:** Cloud-only (no self-hosted option)

### Core Features (Across All Plans)

**Care & Client Management:**
- Unlimited clients
- Client & staff profiles
- Task management & notes
- Custom roles & permissions
- Offline mode for mobile apps

**Rostering & Workforce Scheduling:**
- Scheduler (drag-and-drop interface)
- Group rosters
- Caregiver mobile app (iOS/Android, 4.8 stars)
- Recurring shifts
- Break time tracking

**Timesheets, Payroll & Attendance:**
- Hours, expenses, mileage & allowances
- Custom timesheets (notes, tasks)
- Integrations (Xero, QuickBooks Online, Paychex, Viventium)
- Easy clock in/clock out (geo-fenced EVV)
- Staff timesheets in mobile app

**Invoicing, Compliance & Billing:**
- HubSpot integration
- Cost centre sync (Xero)
- Medicaid-compliant EVV submissions
- Split invoicing
- Support for single or multiple tax rates

**Communication & Engagement:**
- In-app notifications
- Auto-save drafts
- Team messaging (new feature)

### Tier-Specific Features

**Basic Plan ($8-9/user/month):**
- Simple scheduling and notes
- Mobile app, unlimited clients
- Timesheets, geo-fenced clock in/out
- Document management

**Professional Plan ($13-15/user/month):**
- Everything in Basic, plus:
- Job board (advertise vacant shifts)
- Smart carer matching
- Drop-off address
- Bulk invoicing & claiming
- Automated invoice reminders
- Accounting integrations
- Business reporting
- Real-time team insights

**Premium Plan ($20-25/user/month):**
- Everything in Professional, plus:
- Care plans & goals
- Advanced incident management
- eMAR medication tracking
- Funds management & alerts
- Plan & publish shifts
- Shift change notifications (client/family)
- Carer attendance management
- Automated mileage verification
- Shift activity log
- Activity log & audit trails
- Custom forms
- Break time tracking
- Late clock-in notifications
- Split mileage & verification
- Client signatures

**Custom Pricing (Enterprise):**
- Everything in Premium, plus:
- Leave management
- Franchise & account hierarchy
- Franchise group configuration
- Open API access
- Custom implementation
- Pay by user or by number of clients
- Bespoke pricing

---

## Technical Architecture

### Known Technical Stack

**Platform:**
- **Cloud-based SaaS:** Web browser accessible
- **Mobile Apps:** iOS (iPhone, iPad) + Android (4.8 stars on app stores)
- **Offline Mode:** Mobile apps support offline data entry

**Integrations:**
- **Accounting:** Xero, QuickBooks Online, MYOB, KeyPay
- **Payroll:** Paychex, Viventium
- **CRM/Marketing:** HubSpot

**Features:**
- **Geo-fenced EVV:** GPS-based clock in/out
- **Medicaid Compliance:** EVV submissions
- **Team Messaging:** In-app communication (new feature)
- **Custom Forms:** Build custom data collection forms (Premium+)
- **Open API:** Available on Custom Pricing tier only

**Infrastructure:**
- **Cloud-hosted:** No on-premise option
- **Updates:** Regular updates to web + mobile apps
- **Minimal IT Requirements:** Browser + mobile app (no servers needed)

### Unknown Technical Details

The following are **NOT publicly disclosed**:
- **Backend Languages:** Python, Node.js, Ruby, Java, etc.
- **Frontend Framework:** React, Angular, Vue, etc.
- **Database:** PostgreSQL, MySQL, MongoDB, etc.
- **Mobile Framework:** React Native, Flutter, native iOS/Android
- **Cloud Provider:** AWS, Azure, GCP
- **API Documentation:** Open API available on Custom tier only (not publicly documented)
- **Security Implementation:** Encryption standards, compliance certifications

**Why Hidden:** SaaS companies protect technical architecture for competitive advantage. Unlike open-source Folk Care, ShiftCare's source code is proprietary.

---

## Pricing Comparison: ShiftCare vs. Folk Care

### ShiftCare Pricing (Transparent)

**Monthly Billing:**
- **Basic:** $9/user/month (min 5 staff = $45/month)
- **Professional:** $15/user/month (min 5 staff = $75/month) - Most popular
- **Premium:** $25/user/month (min 5 staff = $125/month)
- **Custom Pricing:** Enterprise (min 50 staff)

**Annual Billing (Savings):**
- **Basic:** $8/user/month ($40/month min)
- **Professional:** $13/user/month ($65/month min) - Most popular
- **Premium:** $20/user/month ($100/month min)
- **Custom Pricing:** Bespoke pricing for large teams

**Additional Costs:**
- **SMS:** $0.10 per SMS
- **Admin Users:** Counted in staff licenses (admins + caregivers)

**7-Day Free Trial:** No credit card required

### Folk Care Pricing

- **Self-Hosted:** $20-30/month (Vercel + Neon hosting)
- **Unlimited Users:** No per-user fees
- **No Minimum:** 1 caregiver or 1,000 caregivers = same price
- **No SMS Fees:** Use any SMTP provider
- **No Annual Contracts:** Pay as you go (monthly)

### Total Cost of Ownership (TCO) Comparison

**Example: 10 Caregivers, 3 Years**

| Cost Component | **ShiftCare (Professional)** | **Folk Care** |
|----------------|------------------------------|---------------|
| Monthly per-user | $13/user × 10 = $130/month | $30/month (flat) |
| Annual subscription | $1,560/year | $360/year |
| 3-year subscription | $4,680 | $1,080 |
| SMS fees (estimated) | $300/year × 3 = $900 | $0 (use any SMTP) |
| **3-Year Total** | **$5,580** | **$1,080** |

**Savings with Folk Care:** ~$4,500 over 3 years (81% cost reduction)

**Example: 50 Caregivers, 3 Years**

| Cost Component | **ShiftCare (Premium)** | **Folk Care** |
|----------------|--------------------------|---------------|
| Monthly per-user | $20/user × 50 = $1,000/month | $30/month (flat) |
| Annual subscription | $12,000/year | $360/year |
| 3-year subscription | $36,000 | $1,080 |
| SMS fees (estimated) | $1,500/year × 3 = $4,500 | $0 (use any SMTP) |
| **3-Year Total** | **$40,500** | **$1,080** |

**Savings with Folk Care:** ~$39,420 over 3 years (97% cost reduction)

---

## Feature Comparison: ShiftCare vs. Folk Care

| Feature Category | **ShiftCare** | **Folk Care** |
|------------------|--------------|---------------|
| **Pricing Model** | Per-user ($8-25/user/month, min 5 staff) | Flat rate ($20-30/month, unlimited users) |
| **Deployment** | Cloud-only SaaS | Self-hosted or cloud |
| **Mobile Apps** | iOS/Android (4.8 stars, offline mode) | 🔶 In progress (React Native/Expo) |
| **Scheduling** | Advanced scheduler, recurring shifts, job board | ✅ Implemented |
| **EVV** | Geo-fenced clock in/out, Medicaid-compliant | ✅ Implemented (50-state compliance) |
| **Care Plans** | Premium tier ($20-25/user/month) | ✅ Implemented (all tiers) |
| **Family Portal** | Not explicitly mentioned | ✅ Implemented |
| **Medication Tracking** | eMAR (Premium tier) | ✅ Implemented |
| **Billing/Invoicing** | Bulk invoicing, automated reminders (Pro+) | ✅ Implemented |
| **Payroll Integration** | Xero, QBO, Paychex, Viventium | ✅ Implemented (export) |
| **Custom Forms** | Premium tier | ✅ Implemented |
| **Team Messaging** | In-app messaging (new feature) | ❌ Not implemented |
| **Smart Carer Matching** | Professional tier | ❌ Not implemented |
| **Incident Management** | Advanced (Premium tier) | ✅ Implemented (basic) |
| **Mileage Tracking** | Automated verification (Premium tier) | ✅ Implemented |
| **Audit Trails** | Activity log (Premium tier) | ✅ Implemented |
| **Open API** | Custom Pricing tier only | ✅ REST API (all tiers) |
| **Franchise Management** | Custom Pricing tier | ❌ Not implemented |
| **IDD Support** | Built-in (home care + IDD) | ❌ Home care only |

---

## Competitive Comparison: ShiftCare vs. Folk Care

| Dimension | **ShiftCare** | **Folk Care** |
|-----------|--------------|---------------|
| **Business Model** | Proprietary SaaS subscription | Open-source (AGPL-3.0) |
| **Pricing** | $8-25/user/month (min 5 staff, annual) | $20-30/month flat (unlimited users) |
| **Target Market** | Home care agencies + IDD providers | Home care agencies |
| **Global Reach** | 6,500+ agencies worldwide | Early-stage, community-driven |
| **Deployment** | Cloud-only | Self-hosted or cloud |
| **Vendor Lock-In** | Yes (proprietary platform) | No (open-source, portable) |
| **Source Code** | Closed (trade secret) | Open (AGPL-3.0, GitHub) |
| **Customization** | Custom forms, roles (within platform limits) | Full code access, unlimited customization |
| **Mobile Apps** | Mature iOS/Android (4.8 stars, offline mode) | In progress (React Native/Expo) |
| **API Access** | Custom Pricing tier only | REST API (all tiers) |
| **Free Trial** | 7 days (no credit card) | Self-hosted (unlimited trial) |
| **Minimum Users** | 5 staff | No minimum |
| **Additional Costs** | SMS fees ($0.10/SMS) | No additional costs |
| **IDD Support** | Built-in | Not supported |
| **Reviews** | 4.8 stars (mobile app), multiple awards | No public reviews yet (new product) |

---

## Market Positioning

### ShiftCare's Strengths

1. **Transparent Pricing:** Clear per-user pricing ($8-25/user/month) vs. AxisCare's "contact sales"
2. **Global Reach:** 6,500+ agencies worldwide, proven track record
3. **Mobile App Maturity:** 4.8-star iOS/Android apps with offline mode
4. **Tiered Plans:** Flexibility to start small (Basic) and scale up (Premium/Custom)
5. **IDD Support:** Dual focus (home care + intellectual disabilities) expands market
6. **Awards & Recognition:** Multiple 2024-2025 awards (Capterra, GetApp, G2)
7. **Easy Onboarding:** 7-day free trial, no credit card required
8. **Accounting Integrations:** Xero, QuickBooks, Paychex, Viventium
9. **Franchise Support:** Account hierarchy, franchise management (Custom tier)
10. **Medicaid Compliance:** EVV submissions, audit trails, activity logs

### ShiftCare's Weaknesses

1. **Per-User Pricing:** Scales linearly with team size (expensive for large agencies)
2. **Minimum 5 Staff:** Solo providers or tiny agencies pay for 5 licenses ($40-125/month)
3. **Cloud-Only:** No self-hosted option (data sovereignty concerns)
4. **Feature Paywalls:** Care plans, medication tracking, custom forms locked to Premium ($20-25/user)
5. **SMS Fees:** $0.10/SMS adds up (100 SMS/month = $10/month extra)
6. **Admin User Fees:** Admins counted in staff licenses (Folk Care: unlimited admin access)
7. **Proprietary/Closed Source:** No community development, vendor lock-in
8. **API Locked:** Open API only on Custom Pricing tier (not accessible to Basic/Pro/Premium)

### Folk Care's Advantages vs. ShiftCare

1. **Flat-Rate Pricing:** $20-30/month (unlimited users) vs. $8-25/user/month (min 5 staff)
2. **Massive Savings at Scale:** 97% cost reduction for 50+ caregivers
3. **No Minimums:** 1 caregiver or 1,000 caregivers = same price
4. **Open-Source:** AGPL-3.0, full source code access, community-driven
5. **Self-Hosted Option:** Full data control, no vendor lock-in
6. **API Included:** REST API available to all (vs. ShiftCare's Custom tier only)
7. **No SMS Fees:** Use any SMTP provider (Twilio, SendGrid, Mailgun)
8. **No Feature Paywalls:** Care plans, medication tracking, custom forms all included
9. **Unlimited Customization:** Fork, modify, extend without restrictions
10. **Privacy-First:** Plausible Analytics (vs. unknown tracking in ShiftCare)

### Folk Care's Gaps vs. ShiftCare

1. **Mobile Apps:** In progress (vs. ShiftCare's mature 4.8-star apps with offline mode)
2. **Global Presence:** Early-stage (vs. 6,500+ agencies worldwide)
3. **IDD Support:** Home care only (vs. ShiftCare's dual focus on home care + IDD)
4. **Team Messaging:** Not implemented (vs. ShiftCare's in-app messaging)
5. **Smart Carer Matching:** Not implemented (vs. ShiftCare's Professional tier)
6. **Franchise Management:** Not implemented (vs. ShiftCare's Custom tier)
7. **Reviews/Social Proof:** No public reviews (vs. 4.8 stars, multiple awards)
8. **Free Trial:** Self-hosted setup barrier (vs. ShiftCare's 7-day cloud trial)

---

## Strategic Insights

### Market Overlap

**DIRECT COMPETITION:**
- ShiftCare and Folk Care both target non-medical home care agencies
- Head-to-head competition for scheduling, EVV, billing, care plans
- ShiftCare has IDD market (Folk Care doesn't), but home care is core battleground

**Key Battlegrounds:**
- **Small/Medium Agencies (5-20 caregivers):** ShiftCare's $65-130/month vs. Folk Care's $30/month
- **Large Agencies (50+ caregivers):** ShiftCare's $1,000-1,250/month vs. Folk Care's $30/month (97% savings)
- **Tech-Savvy Agencies:** Folk Care's open-source, API-first vs. ShiftCare's ease-of-use
- **Cost-Conscious Agencies:** Folk Care's flat rate vs. ShiftCare's per-user scaling

### Competitive Strategy for Folk Care

#### Differentiate on Cost & Openness

**Messaging:**
- "Why pay $8-25/user/month when you can self-host for $20-30/month (unlimited users)?"
- "ShiftCare Premium = $1,000/month for 50 caregivers. Folk Care = $30/month. Save $11,640/year."
- "Open-source = no vendor lock-in, no feature paywalls, no SMS fees"
- "API included (not locked to 'Custom Pricing' tier)"

**Target Customers:**
- Medium agencies (10-20 caregivers): Save $1,000-2,000/year vs. ShiftCare
- Large agencies (50+ caregivers): Save $10K-15K/year vs. ShiftCare
- Solo/micro agencies (1-4 caregivers): Avoid ShiftCare's 5-staff minimum ($40-125/month)

#### Close the Feature Gaps (Selective)

**Don't Try to Match Everything:**
- Folk Care doesn't need IDD support (ShiftCare's differentiator)
- Folk Care doesn't need franchise management (serve small/medium agencies first)
- Folk Care doesn't need 7-day cloud trial (self-hosted trial is unlimited)

**Do Match These:**

1. **Mobile Apps (Critical):**
   - Complete iOS/Android apps with offline mode
   - Match ShiftCare's 4.8-star mobile experience
   - Priority #1 to compete effectively

2. **Team Messaging (Medium Priority):**
   - Simple two-way chat (caregiver-coordinator messaging)
   - Not as complex as ShiftCare's in-app messaging (over-engineered for small agencies)

3. **Smart Carer Matching (Low Priority):**
   - Basic caregiver-client matching (qualifications, availability, location)
   - Don't need ShiftCare's AI matching (small agencies do manual matching)

#### Leverage Flat-Rate Pricing

**TCO Calculator (Marketing Tool):**
- Show ShiftCare vs. Folk Care side-by-side for 5, 10, 20, 50, 100 caregivers
- Highlight 81%-97% cost savings at scale
- Emphasize no SMS fees, no admin user fees, no feature paywalls

**Example:**
```
10 caregivers:
- ShiftCare Professional: $1,560/year
- Folk Care: $360/year
- Savings: $1,200/year (77% cost reduction)

50 caregivers:
- ShiftCare Premium: $12,000/year
- Folk Care: $360/year
- Savings: $11,640/year (97% cost reduction)
```

---

## Threats & Opportunities

### Threats to Folk Care

1. **ShiftCare's Ease of Use:** 7-day cloud trial vs. Folk Care's self-hosted setup barrier
2. **Mobile App Maturity:** 4.8-star apps with offline mode vs. Folk Care's in-progress apps
3. **Global Presence:** 6,500+ agencies, awards, social proof vs. Folk Care's early-stage
4. **IDD Market:** ShiftCare serves home care + IDD (Folk Care doesn't)
5. **Tiered Pricing Flexibility:** Start at $8/user (Basic) and scale up (Folk Care has no tiers)

### Opportunities for Folk Care

1. **Large Agency Market:** 97% cost savings for 50+ caregivers (ShiftCare's pricing is prohibitive)
2. **Small Agency Market:** No 5-staff minimum (ShiftCare's $40-125/month barrier)
3. **API-First Developers:** REST API included vs. ShiftCare's Custom tier paywall
4. **Self-Hosted Advantage:** Data sovereignty, privacy, compliance (vs. cloud-only ShiftCare)
5. **Open-Source Community:** Build ecosystem, plugins, extensions (vs. ShiftCare's walled garden)
6. **No Feature Paywalls:** Care plans, medication tracking, custom forms all included (vs. ShiftCare's Premium tier)

---

## Recommendations

### For Folk Care Development (Priority Order)

1. **Mobile Apps (Sprint to Completion):**
   - Match ShiftCare's 4.8-star mobile experience
   - Offline mode, geo-fenced EVV, on-site data entry
   - Goal: Feature parity by Q1 2026

2. **TCO Calculator (Marketing):**
   - Build interactive pricing comparison tool
   - Show ShiftCare vs. Folk Care side-by-side for 5, 10, 20, 50, 100 caregivers
   - Highlight 81%-97% cost savings

3. **Self-Hosted Setup Simplification:**
   - One-click installers (Digital Ocean, AWS, Hetzner)
   - Video tutorials, step-by-step guides
   - Lower barrier vs. ShiftCare's 7-day cloud trial

4. **Team Messaging (Medium Priority):**
   - Simple two-way chat (caregiver-coordinator)
   - Don't over-engineer (small agencies don't need Slack-level features)

5. **Migration Guide from ShiftCare:**
   - Document data export from ShiftCare (if possible)
   - Import scripts for Folk Care
   - Target cost-conscious agencies switching from ShiftCare

### For Competitive Positioning

**Messaging Framework:**
- **Tagline:** "Open-source home care software. No per-user fees. $20-30/month."
- **Positioning:** "The affordable, unlimited-user alternative to ShiftCare"
- **Value Props:**
  - "10 caregivers: ShiftCare = $1,560/year. Folk Care = $360/year. Save $1,200."
  - "50 caregivers: ShiftCare = $12,000/year. Folk Care = $360/year. Save $11,640."
  - "Open-source = no vendor lock-in, no feature paywalls, no SMS fees"
  - "API included (not locked to 'Custom Pricing')"

**Target Segments:**
1. **Primary:** Medium agencies (10-20 caregivers) saving $1,000-2,000/year
2. **Secondary:** Large agencies (50+ caregivers) saving $10K-15K/year
3. **Tertiary:** Solo/micro agencies (1-4 caregivers) avoiding ShiftCare's 5-staff minimum

**Marketing Channels:**
- **Pricing Calculator:** ShiftCare vs. Folk Care TCO comparison
- **Reddit:** r/homecare, r/selfhosted, r/opensource
- **YouTube:** "How to save $11,640/year on home care software"
- **Case Studies:** Agencies that switched from ShiftCare to Folk Care

### For Competitive Monitoring

**Track ShiftCare's Moves:**
1. **Pricing Changes:** Monitor if they reduce per-user fees or minimum staff requirements
2. **API Availability:** Watch if they open API to Basic/Pro/Premium tiers (defensive move)
3. **Feature Releases:** New features (e.g., team messaging was recently added)
4. **Awards/Reviews:** Track ratings on Capterra, GetApp, G2 (social proof signals)
5. **Acquisition Risk:** Private equity/strategic acquisition could change pricing/roadmap

---

## Sources

### Primary Sources
- [ShiftCare US Home](https://shiftcare.com/us) - Platform overview, features, customer testimonials
- [ShiftCare Pricing](https://shiftcare.com/us/pricing) - Transparent pricing tiers, feature comparison
- [ShiftCare Home Care Software](https://shiftcare.com/us/solutions/home-care-software) - Home care-specific features

### Secondary Sources
- [ShiftCare Reviews - Software Advice](https://www.softwareadvice.com/medical/shiftcare-profile/) - Pricing, reviews
- [ShiftCare Reviews - Capterra](https://www.capterra.com/p/233684/ShiftCare/) - Features, pricing, reviews
- [ShiftCare Reviews - GetApp](https://www.getapp.com/healthcare-pharmaceuticals-software/a/shiftcare/) - Pricing, features, reviews
- [ShiftCare Reviews - SelectHub](https://www.selecthub.com/p/home-care-software/shiftcare/) - Pricing, features
- [ShiftCare Review - Connecteam](https://connecteam.com/reviews/shiftcare/) - Honest review, pros/cons
- [ShiftCare Review - Nerdisa](https://nerdisa.com/shiftcare/) - 2025 compliance & growth review

### Data Collection Limitations

**What's Available:**
- Transparent pricing tiers (Basic, Professional, Premium, Custom)
- Detailed feature comparison across tiers
- Customer testimonials and awards
- Mobile app ratings (4.8 stars)
- Integration partners (Xero, QuickBooks, Paychex, Viventium)

**What's Missing:**
- Backend programming languages and frameworks
- Database technology
- Cloud provider (AWS, Azure, GCP)
- API documentation (locked to Custom Pricing tier)
- Mobile app framework (React Native, Flutter, native)
- Source code (closed-source, trade secret)

---

## Revision History

| Date | Analyst | Changes |
|------|---------|---------|
| 2025-12-06 | Tove | Initial analysis based on pricing, features, reviews, customer testimonials |

---

**Next Steps:**
- Monitor ShiftCare's pricing changes (per-user fees, minimum staff requirements)
- Track feature releases (team messaging, smart carer matching enhancements)
- Analyze customer churn signals in reviews (conversion opportunities)
- Build TCO calculator comparing ShiftCare vs. Folk Care
- Update analysis quarterly or when significant competitive developments occur
