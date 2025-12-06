# Folk Care Strategic Product Vision

**Document Date:** December 2025
**Status:** Living Document
**Purpose:** Define Folk Care's product identity, strategic direction, and competitive positioning

---

## Executive Summary

Folk Care is not a software product. Folk Care is a movement.

We are building the infrastructure for locally-owned home care businesses to thrive against private equity consolidation. We are building tools that put workers—caregivers, nurses, schedulers, and business owners—first. We are building technology that respects the dignity of elderly patients and their families.

Our competition spends millions on sales teams, steak dinners, and conference booths. They lock customers into multi-year contracts with opaque pricing. They optimize for investor returns, not patient outcomes.

We reject all of this.

Folk Care is open source (AGPL-3.0). Folk Care is free to self-host. Folk Care is designed by and for the people who actually use it.

---

## The Competitive Landscape

### The Private Equity Problem

The home care software market is dominated by two PE-backed giants:

**WellSky** (Thoma Bravo + Leonard Green)
- $1B+ revenue, 20K+ clients, 99% retention (through lock-in, not love)
- $800/user/month starting price
- 23 acquisitions to eliminate competition
- Aggressive upselling, complex multi-year contracts

**Axxess** (founder-led, but VC-backed)
- 9K+ organizations, 7M+ patients served
- Census-based pricing designed to scale with client growth
- $37B+ in claims processed (taking a cut of each)
- Massive sales team, annual AGILE conference for customer capture

These companies have one thing in common: **they exist to extract value from the healthcare system, not add it.**

### The Middle Market

**AxisCare** (33,500 users) and **ShiftCare** (6,500 agencies) represent the middle tier:
- More transparent pricing ($8-25/user/month for ShiftCare)
- Less aggressive sales tactics
- Still proprietary, still cloud-only, still vendor-locked

ShiftCare in particular shows glimpses of doing things right—transparent pricing, combined home care and IDD support, genuine feature development. But they're still a traditional SaaS company optimizing for recurring revenue.

### Adjacent Markets (Not Our Competition)

- **Skedulo**: Horizontal workforce management for any deskless worker. Different market.
- **In-House Health**: Hospital nurse scheduling. Different market entirely.
- **Synapticure**: Neurology telehealth. No overlap.

---

## Who We Serve

### The Elderly Patient

The person at the center of everything. They didn't ask to need help. They want to stay in their home, maintain their dignity, and be treated as a person—not a billing code.

**What they need:**
- Continuity of care (same caregivers who know them)
- Clear communication about who's coming and when
- Technology that doesn't get in the way
- Respect for their preferences and routines

### The Family

Adult children and spouses who are terrified, exhausted, and often guilt-ridden. They're trying to do right by their loved one while managing their own lives.

**What they need:**
- Visibility into care being provided
- Easy communication with caregivers and agency
- Peace of mind that their loved one is safe
- Simple billing and documentation

### The Caregiver

The backbone of home care. Underpaid, overworked, often treated as replaceable. They do this work because they care about people.

**What they need:**
- Reliable schedules they can count on
- Easy clock-in/clock-out that actually works
- Mobile tools that don't waste their time
- Recognition that they're professionals, not gig workers
- Fair pay and predictable hours

### The Nurse

Clinical professionals who provide skilled care. They need documentation that helps them do their job, not paperwork designed for billing audits.

**What they need:**
- Clinical tools that support decision-making
- Care plans that are living documents, not compliance checkboxes
- Easy coordination with caregivers and physicians
- Mobile access that works in patients' homes

### The Scheduler

The unsung hero. They're juggling caregiver availability, patient preferences, EVV compliance, and last-minute callouts. One person often manages hundreds of visits per week.

**What they need:**
- Intelligent scheduling that reduces cognitive load
- Real-time visibility into who's where
- Easy handling of changes and callouts
- Tools that prevent problems, not just report them

### The Small Business Owner

Running a home care agency is brutally hard. Margins are thin, regulations are complex, and you're competing against PE-backed giants with unlimited resources.

**What they need:**
- Software that doesn't eat their margins
- Compliance tools that actually help
- Business intelligence to make good decisions
- Technology that's an asset, not a liability
- Freedom from vendor lock-in

---

## Our Product Identity

### Core Principles

**1. Open Source, Community Owned**

Folk Care is AGPL-3.0 licensed. The code is public. Anyone can self-host. Anyone can contribute. This isn't a marketing gimmick—it's a commitment that we can't take back. When WellSky raises prices, their customers are trapped. When we're not meeting needs, our users can fork the code.

**2. Worker-First Design**

Every feature we build starts with the question: "How does this help the person doing the work?" Not "How does this help the owner bill more?" Not "How does this check a compliance box?" If it doesn't make a caregiver's day better, a scheduler's job easier, or a nurse's documentation clearer—we don't build it.

**3. Transparent and Fair Pricing**

- **Self-hosted**: Free forever
- **Cloud-hosted**: $20-30/month flat (not per-user, not per-patient)

We can do this because we're not optimizing for investor returns. We're not paying for a sales team. We're not spending millions on trade show booths. We build software. We charge a fair price. That's it.

**4. No Lock-In**

Your data is yours. Export it anytime, in standard formats. Migrate away if you want—we'll help you. We earn your business every month, not through contract terms.

**5. Compliance as Infrastructure, Not Product**

EVV, HIPAA, state regulations—these aren't features to upsell. They're table stakes. Every Folk Care deployment is compliant by default. 50-state EVV support included. HIPAA-ready architecture standard. We don't charge extra for not breaking the law.

---

## Strategic Direction

### Phase 1: Foundation (Current)

**What we have:**
- Full-featured scheduling and visit management
- 50-state EVV compliance
- Mobile app for caregivers
- Care plan management
- Multi-role access (patient, family, caregiver, coordinator, admin)
- Open source codebase

**What we're building:**
- Offline-first mobile experience (real homes have bad wifi)
- Intelligent scheduling suggestions
- Family portal with real-time visibility

### Phase 2: Intelligence (2025)

**Predictive Care Coordination**

Stop reacting to problems. Start preventing them.

- **Caregiver burnout detection**: Pattern recognition on hours, cancellations, late clock-ins. Alert coordinators before caregivers quit.
- **Patient decline indicators**: Subtle changes in care notes, visit patterns, task completion. Flag for clinical review before hospitalization.
- **Schedule optimization**: Not just "fill the slot"—consider caregiver-patient relationships, travel time, continuity of care.

**Documentation That Helps**

Current care documentation is designed for auditors, not caregivers. We're flipping that.

- **Narrative capture**: Voice-to-text notes that caregivers can dictate naturally
- **Smart prompting**: "You mentioned Mrs. Johnson seemed confused—want to flag this for the nurse?"
- **Automated compliance**: The system ensures documentation meets requirements without making caregivers think about it

### Phase 3: Ecosystem (2026)

**Interoperability Without Consultants**

FHIR, HL7, and standard APIs—but actually usable. Connect to:
- Physician EHRs for care coordination
- Pharmacies for medication management
- Hospitals for transition of care
- Payers for claims (without giving them your margins)

**Business Intelligence for Small Operators**

Enterprise analytics shouldn't require enterprise budgets.

- **Margin analysis**: Know which payers, which services, which geographies are profitable
- **Staff utilization**: Understand where your labor dollars go
- **Growth opportunity**: Where should you expand? Where should you exit?

### Phase 4: Community (2027+)

**Shared Infrastructure for Independent Operators**

Imagine if every locally-owned home care agency could benefit from:
- **Collective bargaining with payers**: "Here's data from 500 agencies proving this rate is unsustainable"
- **Shared training resources**: One agency creates great onboarding content, all agencies benefit
- **Benchmarking**: "How do my no-show rates compare to similar agencies?"
- **Referral networks**: Patient moving? Refer to another Folk Care agency with seamless care transition

This is the endgame. Not a software company—a cooperative infrastructure for independent home care.

---

## Competitive Advantages We Will Build

### 1. Offline-First Mobile

Every competitor assumes constant connectivity. We don't. Caregivers work in basements, rural areas, and buildings with terrible signal. Our mobile app will work completely offline and sync when connectivity returns.

**Why competitors can't copy this**: It requires architectural decisions made from day one. Retrofitting offline-first is nearly impossible.

### 2. AI That Serves Workers, Not Surveillance

The industry is moving toward AI—but they're building surveillance tools. "Did the caregiver wash their hands?" "Were they on their phone?"

We're building AI that helps workers:
- Drafts documentation from voice notes
- Suggests schedule optimizations that respect caregiver preferences
- Identifies patients who need clinical attention
- Reduces administrative burden, doesn't add to it

**Why this matters**: Workers will choose employers who give them tools that help, not tools that spy.

### 3. True Data Portability

Every competitor locks in your data. Export is either impossible, expensive, or produces unusable formats.

We're building:
- One-click full export in standard formats (JSON, CSV, FHIR)
- Migration tools that work (even to competitors)
- API access included at every tier

**Why this builds trust**: Agencies know they can leave. So they don't.

### 4. Community-Powered Development

Our roadmap isn't decided in a board room. It's shaped by the people using the software.

- Public roadmap with voting
- Community feature requests
- Open source contributions
- User advisory council

**Why this produces better software**: The people doing the work know what they need.

### 5. Sustainable Business Model

We're not racing to an exit. We're not promising 10x returns to investors. We're building a sustainable organization that can exist indefinitely.

- Revenue covers costs with margin for development
- No VC pressure to grow at all costs
- No PE owners demanding extraction
- Aligned incentives with our users

**Why this matters long-term**: We'll still be here in 20 years. Will WellSky?

---

## What We Will NOT Build

### 1. Surveillance Tools

No GPS tracking beyond EVV requirements. No "productivity monitoring." No screenshot capture. No AI analyzing caregiver facial expressions.

Caregivers are professionals. Treat them like it.

### 2. Engagement Maximization

No gamification designed to make people use the app more. No push notifications optimized for addiction. No "streaks" or "points."

Our success metric is: did the software help you do your job and then get out of the way?

### 3. Upsell Machinery

No features held back for higher tiers. No "contact sales" for basic needs. No artificial limitations designed to push upgrades.

If a feature helps users, it's in the base product.

### 4. Lock-In Mechanisms

No proprietary data formats. No "integrations" that only work one-way. No contracts with termination penalties.

Earn trust through quality, not through trapping.

---

## Competitive Positioning Matrix

| Dimension | WellSky/Axxess | AxisCare/ShiftCare | Folk Care |
|-----------|---------------|-------------------|-----------|
| **Pricing** | $800+/user/month | $8-25/user/month | Free-$30/month flat |
| **Source** | Proprietary | Proprietary | Open Source (AGPL-3.0) |
| **Deployment** | Cloud only | Cloud only | Self-host or Cloud |
| **Lock-in** | High (contracts, data) | Medium (data) | None (export anytime) |
| **Sales Model** | Enterprise sales team | Inside sales | Community + self-serve |
| **Target** | Large agencies | SMB agencies | Independent operators |
| **Ownership** | PE firms | VC-backed | Community |
| **Development** | Closed roadmap | Closed roadmap | Open roadmap + contributions |
| **AI Direction** | Surveillance + analytics | Basic automation | Worker assistance |

---

## Success Metrics

We measure success differently than our competitors.

### They Measure:
- Annual Recurring Revenue
- Net Revenue Retention
- Customer Acquisition Cost
- Lifetime Value

### We Measure:
- **Caregiver time saved**: Hours of administrative burden eliminated
- **Scheduler cognitive load**: Reduction in manual intervention needed
- **Agency survival rate**: Do our users stay in business?
- **Community contributions**: Pull requests, feature suggestions, forum activity
- **Data liberation**: Exports and migrations (yes, even to competitors)

---

## The Path Forward

Folk Care exists because the home care industry deserves better.

Better than software designed to extract maximum revenue from an already-stressed system.

Better than tools built for compliance checkboxes instead of patient care.

Better than technology that treats caregivers as surveillance targets instead of professionals.

We're building the alternative. Open source. Worker-first. Community-owned.

The giants have money, salespeople, and market share. We have something better: alignment with the people actually doing the work.

Join us.

---

## Appendix: Competitive Analysis Sources

Detailed competitive analyses are available in this directory:
- [AxisCare](./axiscare.md) - Enterprise home care platform
- [ShiftCare](./shiftcare.md) - Global care management solution
- [Skedulo](./skedulo.md) - Horizontal deskless workforce platform
- [WellSky](./wellsky.md) - PE-backed market leader
- [Axxess](./axxess.md) - Founder-led challenger
- [In-House Health](./inhouse-health.md) - Hospital nurse scheduling (different market)
- [Synapticure](./synapticure.md) - Neurology telehealth (different market)

---

*This document is part of Folk Care's open development process. Feedback welcome via GitHub issues or community discussions.*
