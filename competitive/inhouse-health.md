# In-House Health - Competitive Analysis

**Last Updated:** December 6, 2025
**Analyst:** Tove (AI dev agent)

---

## Executive Summary

**In-House Health** is a seed-stage AI-driven scheduling and management platform for hospital nursing teams. Founded in 2023 and based in Denver/NYC, the company raised $5.4M from NEA, TMV, Vine Ventures, and Longevity Venture Partners. They focus on **predictive nurse scheduling** using AI to forecast patient census, acuity, and staffing needs 1-3 weeks in advance.

**Key Differentiators:**
- **AI-driven predictions:** Proprietary algorithm trained on millions of patient records
- **Hospital-focused:** Inpatient acute care, behavioral health, skilled nursing, ambulatory surgical
- **Workforce optimization:** Reduces labor costs by 10%, saves managers 5+ hours/week
- **B2B enterprise sales:** Targets hospitals and health systems, not home care agencies

**Competitive Overlap with Folk Care:** **Minimal to None**

In-House Health targets **hospital nurse scheduling** (inpatient/acute care), while Folk Care targets **home care agencies** (non-medical caregiving). Different markets, different business models, different problems.

---

## Company Profile

| Attribute | Details |
|-----------|---------|
| **Founded** | 2023 |
| **Headquarters** | Denver, CO / New York City, NY |
| **Funding Stage** | Seed ($5.4M total raised, April 2024 round) |
| **Investors** | NEA (lead), TMV, Vine Ventures, Longevity Venture Partners, RISE Accelerator |
| **Founders** | Ari Brenner (CEO), Sergey Vasilenko, Shachar Har Zvi |
| **Target Market** | Hospitals, health systems, skilled nursing facilities |
| **Care Settings** | Inpatient acute, behavioral health, skilled nursing, ambulatory surgical, float pools |
| **Current Scale** | 800+ nurses managed across several hospitals |
| **Business Model** | Enterprise SaaS for hospital workforce management |

---

## Founder Backgrounds

### Ari Brenner (CEO)
- **Previous:** Co-founder & COO of Stellar Health (value-based care tech for payers/health systems)
- **Expertise:** Healthcare operations, value-based care, enterprise sales

### Sergey Vasilenko
- **Previous:** Critical care nurse → EMR/Clinical Informatics
- **Expertise:** Frontline nursing experience, clinical workflows, EHR integration

### Shachar Har Zvi
- **Previous:** Technical lead at Google
- **Expertise:** Software engineering, machine learning, scalable systems

**Team Composition:** Healthcare ops + clinical nursing + Google-scale tech = purpose-built AI for nurse scheduling.

---

## Product Overview

### Core Platform Components

**1. AI-Driven Predictive Scheduling**
- **Purpose:** Forecast shift-level staffing requirements 1-3 weeks in advance
- **Inputs:** Patient census, acuity levels, admits/discharges, team tenure, historical patterns
- **Outputs:** Customized shift recommendations (length, skill mix, timing)
- **Algorithm:** Trained on millions of patient records to identify bedside care patterns

**2. Workload Scoring & Balancing**
- **Purpose:** Segment each shift by actual workload (not just head count)
- **Workload Score:** Factors in patient-specific work requirements, acuity, volume
- **Auto-balancing:** AI copilot identifies unbalanced shifts 3-21 days ahead, suggests specific team updates
- **Time savings:** Updating a full workweek can take as little as 10 minutes (vs. 15+ hours/week manually)

**3. Preference Tracking & Self-Scheduling**
- **Purpose:** Track nurse preferences, availability, conflicts, interest in extra shifts
- **Onboarding:** Simple 15-minute onboarding to log standing preferences
- **Self-scheduling:** Nurses can sign up from mobile app, customized to balance shifts and reduce manager rework
- **Team Activation:** Automatically route open shifts to nurses most likely to pick them up (based on preferences, reliability score)

**4. Reliability Scoring**
- **Purpose:** Track likelihood of call-ins by staff member, by day of week/shift type
- **Use case:** Predict scheduling risks, prioritize dependable team members for critical shifts

**5. Mobile App (iOS/Android)**
- **Target users:** Direct care nursing staff (per diem, part-time, full-time)
- **Features:**
  - Browse & claim open shifts (real-time)
  - Set availability
  - Secure team chat & announcements
  - One-click login (no password required)
- **Platform:** iOS 14.0+ (App Store), Android (Google Play)
- **User feedback:** "Easiest app for scheduling I've used"

**6. Command Center Dashboard**
- **Purpose:** Executive-level visibility for CNOs, unit managers, central scheduling coordinators
- **Features:**
  - Real-time staffing status across facilities/units
  - HPPD (Hours Per Patient Day) reporting (historical, current, future)
  - Float pool management & inter-facility float coordination
  - Budget vs. actual labor cost tracking

---

## Technical Architecture (Limited Public Information)

### Known Technical Details

**AI/ML Core:**
- Proprietary algorithm trained on millions of patient records
- Predictive analytics for census, acuity, workload forecasting
- Machine learning generates scheduling recommendations based on past cases (triage → discharge)
- Predictions go out 1-3 weeks depending on unit type (operative units = further, ICUs = shorter)

**Data Integration:**
- Standard clinical and staffing data feeds (EHR, HRIS, timekeeping systems)
- In-House integration team works with hospital IT to set up feeds
- Implementation timeline: As short as 2 weeks for standard implementations

**Mobile Apps:**
- iOS 14.0+ (App Store)
- Android (Google Play)
- Real-time shift browsing, claiming, availability management
- Secure messaging within app

**Deployment:**
- Cloud-based SaaS platform (specific cloud provider not disclosed)
- Multi-facility support (network-wide deployments)

**Compliance:**
- Federal and state nursing regulations (CMS requirements, HPPD mandates)
- Union/regulatory compliance built into algorithm
- Skill mix and certification requirements enforced

### Unknown Technical Details

The following technical details are **NOT publicly disclosed**:

- **Tech Stack:** Backend language (Python, Node.js, Go, etc.), frontend framework (React, Angular, Vue)
- **Cloud Provider:** AWS, Azure, GCP
- **Database:** PostgreSQL, MongoDB, etc.
- **API Architecture:** REST, GraphQL
- **ML Framework:** TensorFlow, PyTorch, scikit-learn
- **EHR Integrations:** Specific vendors (Epic, Cerner, Meditech, etc.), HL7/FHIR standards
- **Security/Compliance:** HIPAA implementation details, encryption methods, audit logging

**Why Hidden:** Early-stage company (seed funding, 2023 founding) protecting competitive advantage. Healthcare workforce tech is increasingly competitive (ShiftMed, CareRev, Clipboard Health, IntelyCare all in adjacent spaces).

---

## Business Model & Pricing

### Revenue Model
- **Enterprise SaaS:** Subscription-based pricing for hospitals and health systems
- **Pricing:** Not publicly disclosed (contact sales)
- **Implementation:** Free opportunity assessment, then scoped implementation with on-site go-live support

### Sales Process

**1. Opportunity Assessment (Free)**
- In-House performs free opportunity assessment to quantify impact of predictive scheduling
- Sample outputs: Expected labor cost savings, manager time savings, shift balance improvements

**2. Scoping**
- Identify participating facilities/units for initial rollout
- Define necessary parameters: census-based staffing requirements, unit-level holiday/night rules, skill mix mandates

**3. Data Integration**
- In-House integration team works with hospital IT to set up clinical and staffing data feeds
- Standard implementation: 2 weeks

**4. Launch**
- On-site go-live support from In-House clinical & ops teams
- After month 1: Dedicated support rep + helpdesk access

**5. Performance Management & Expansion**
- Steering committee reporting (Nursing, Finance, IT stakeholders)
- Metrics-driven expansion: Scale to more facilities, float pools, inter-facility coordination

### Target Customer Profile

**Primary:**
- Hospitals (inpatient acute care, behavioral health)
- Health systems (multi-facility networks)
- Skilled nursing facilities
- Ambulatory surgical centers

**Personas:**
- **CNO (Chief Nursing Officer):** Real-time facility-wide performance (clinical + budget)
- **Unit Manager:** Store team preferences, enforce scheduling requirements (2 nights + 1 weekend/cycle)
- **Central Scheduling Coordinator:** Multi-facility oversight, final hours reconciliation
- **Direct Care Nurses:** Browse/claim shifts, set availability, earn extra money via app

**NOT a fit:**
- Home care agencies (different staffing model: caregiver visits vs. hospital shifts)
- Private duty caregiving (1:1 in-home care)
- Community-based services (non-acute care)

---

## Competitive Comparison: In-House Health vs. Folk Care

| Dimension | **In-House Health** | **Folk Care** |
|-----------|---------------------|---------------|
| **Focus** | Hospital nurse scheduling (acute/inpatient) | Home care agency operations (non-medical caregiving) |
| **Care Setting** | Hospitals, skilled nursing facilities, ambulatory surgical | In-home care (client's residence) |
| **Primary Users** | CNOs, unit managers, central scheduling, hospital nurses | Care coordinators, caregivers, clients, families, agency admins |
| **Workforce Type** | RNs, LPNs, CNAs (hospital-employed nurses) | Non-medical caregivers, home health aides, PCAs |
| **Scheduling Model** | Shift-based (12-hour, 8-hour, staggered) with self-scheduling | Visit-based (1-4 hour visits) with caregiver assignments |
| **Technology Focus** | AI-driven predictive scheduling, workload forecasting | Scheduling, EVV compliance, care plans, billing, family portals |
| **Business Model** | Enterprise SaaS (contact sales pricing) | Open-source (AGPL-3.0) + self-hosted ($20-30/month) |
| **Geographic Coverage** | US hospitals (enterprise customers) | Any location (self-hosted or cloud) |
| **Stage** | Seed-stage ($5.4M raised, founded 2023) | Open-source (community-owned, AGPL-3.0) |
| **Pricing** | Not disclosed (enterprise sales) | $20-30/month flat rate (unlimited users) |
| **Open Source** | No (proprietary) | Yes (AGPL-3.0, fully open) |
| **Target Market Size** | 6,093 hospitals in US (AHA data) | 66,000+ home care agencies in US (NAHC data) |

---

## Market Positioning

### In-House Health's Strengths

1. **AI-Driven Predictions:** Proprietary algorithm trained on millions of patient records (competitive moat)
2. **Founder Expertise:** Healthcare ops + clinical nursing + Google-scale tech (unique combination)
3. **Measurable ROI:** 10% labor cost reduction, 5+ hours/week manager time savings, $800K savings for average facility
4. **Fast Implementation:** 2-week standard implementation (vs. 6-12 months for legacy workforce management systems)
5. **Venture-Backed:** $5.4M raised from top-tier investors (NEA, TMV) for rapid scaling
6. **Clinical Credibility:** Advisory board includes Chief Nurses, Illinois Organization of Nurse Leaders
7. **Unique Workload Scoring:** Goes beyond headcount to balance actual patient-specific work requirements

### In-House Health's Weaknesses

1. **Early Stage:** Founded 2023, only 800+ nurses managed (unproven at scale)
2. **Hospital-Only:** Not applicable to home care, long-term care, or community-based services
3. **Proprietary:** Vendor lock-in, no community development, opaque pricing
4. **No Pricing Transparency:** Enterprise sales model (contact sales) vs. self-serve SaaS
5. **Limited Public Info:** Technical stack, integrations, pricing not disclosed (early-stage opacity)
6. **Competitive Landscape:** Crowded workforce management space (ShiftMed, CareRev, Clipboard Health, IntelyCare, Legion, Deputy)

### Folk Care's Advantages vs. In-House Health

**Note:** These are **NOT direct competitors**. Different markets, different problems.

1. **Home Care Focus:** Purpose-built for home care agencies (not hospitals)
2. **Visit-Based Scheduling:** EVV compliance, caregiver assignments, client-specific care plans
3. **Operational Breadth:** Billing, payroll, family portals, care plans (not just scheduling)
4. **Open Source:** No vendor lock-in, community-driven, full transparency
5. **Cost Structure:** $20-30/month flat rate (vs. enterprise pricing)
6. **Self-Hosted:** Full data ownership, no cloud lock-in
7. **Broader Care Types:** Aging, disabilities, chronic illness (vs. acute/inpatient only)

### Folk Care's Gaps vs. In-House Health

**Note:** These gaps are **irrelevant** because Folk Care serves home care, not hospitals.

1. **AI Predictive Scheduling:** No ML-driven census/acuity forecasting (home care is visit-based, not shift-based)
2. **Workload Balancing:** No proprietary workload scoring (home care uses visit duration + client needs, not patient acuity)
3. **Hospital Workflows:** No float pool management, HPPD tracking, perioperative scheduling (not applicable to home care)
4. **Nurse Self-Scheduling:** No shift marketplace (home care uses visit assignments, not shift claims)

---

## Strategic Insights

### Market Overlap

**Zero Direct Competition:**
- In-House Health targets **hospitals** managing **RN/LPN shift schedules** for **inpatient acute care**
- Folk Care targets **home care agencies** managing **caregiver visit schedules** for **in-home non-medical care**
- In-House Health is B2B hospital workforce tech; Folk Care is B2B home care operations software

**No Collaboration Opportunity:**
- Hospitals don't operate home care agencies (different business models)
- Home care agencies don't manage hospital nursing staff
- No overlap in workflows, data models, or user personas

**Different Problems:**
- **In-House Health solves:** Hospital nurse staffing inefficiencies, overtime costs, agency reliance, manager burnout from 15+ hours/week manual scheduling
- **Folk Care solves:** Home care agency operations (scheduling, EVV compliance, billing, payroll, care plans, family engagement)

### Lessons for Folk Care

**Note:** Limited applicability due to different markets, but some transferable concepts:

1. **AI Opportunity (Low Priority):** Could add ML-driven caregiver matching (skills, preferences, distance) or visit optimization (route planning, time-of-day patterns)
   - **Caution:** Home care scheduling is less predictable than hospital shifts (client needs vary more than patient census)
   - **Better fit:** Focus on operational efficiency (faster scheduling, better caregiver-client matching) before AI

2. **Preference Tracking (High Priority):** Track caregiver preferences for clients, visit times, max distance, days off
   - **In-House Health:** 15-minute onboarding to log standing preferences
   - **Folk Care:** Could add caregiver preference profiles (client types, visit times, geography)

3. **Mobile-First for Caregivers (High Priority):** In-House Health's mobile app is praised for ease of use
   - **Folk Care:** Mobile EVV app is caregiver-first (critical for home care)
   - **Improvement:** Add shift claiming, availability setting, real-time schedule updates

4. **Reliability Scoring (Medium Priority):** Track caregiver reliability (call-ins, late arrivals, visit completion)
   - **In-House Health:** Automatic reliability score by day of week/shift type
   - **Folk Care:** Could flag high-risk caregivers for critical visits

5. **Self-Service Scheduling (Low Priority for Home Care):** In-House Health's self-scheduling works for hospital shifts (many nurses, interchangeable shifts)
   - **Home care:** Clients often request specific caregivers (not interchangeable), so self-scheduling less applicable

6. **Fast Implementation (High Priority):** In-House Health boasts 2-week implementations
   - **Folk Care:** Self-hosted setup should be 1-click (Docker Compose, Render/Railway deploy buttons)
   - **Improvement:** Simplify onboarding, add guided setup wizard

7. **Measurable ROI (High Priority):** In-House Health quantifies savings ($800K/facility, 5+ hours/week, 10% labor cost reduction)
   - **Folk Care:** Add TCO calculator on website (compare to AxisCare, ShiftCare, Skedulo, AlayaCare)
   - **Example:** "Save $39,420 over 3 years vs. ShiftCare Premium for 50 caregivers"

### Threats to Folk Care

**Zero Direct Threat:**
- In-House Health will **not** enter the home care market (different care model, different workflows, different business model)
- Hospital nursing ≠ home care caregiving (RN shifts vs. non-medical caregiver visits)

**Indirect Considerations:**
- If In-House Health expands to **skilled nursing facilities (SNFs)** or **home health** (medical home care with RNs), there could be **slight** overlap
  - **Home health** = Medicare-covered medical care at home (RN visits, PT, OT) — different from Folk Care's non-medical focus
  - **SNFs** = Nursing homes, not home care agencies

**Competitive Landscape Insight:**
- In-House Health's success validates **AI-driven workforce optimization** for healthcare
- Other startups may enter home care with similar AI approaches (predictive caregiver scheduling, visit optimization)
- **Folk Care advantage:** Open-source, community-owned, no vendor lock-in (vs. proprietary AI black boxes)

---

## Recommendations

### For Folk Care Development

**High Priority (Directly Applicable):**

1. **Caregiver Preference Profiles:**
   - Track caregiver preferences: client types (dementia, mobility, companionship), visit times (morning/evening), max distance, days off
   - Use preferences for smarter caregiver-client matching (like In-House Health's preference tracking)

2. **Mobile App Enhancements:**
   - Add shift claiming/availability setting (if transitioning to self-service model)
   - Real-time schedule updates (push notifications for new assignments)
   - Praise-worthy UX (In-House Health app is "easiest app for scheduling I've used")

3. **Fast Onboarding:**
   - In-House Health: 2-week implementation
   - Folk Care: 1-click self-hosted setup (Docker Compose, Render/Railway deploy buttons)
   - Add guided setup wizard (org creation, demo data seeding, first caregiver/client)

4. **TCO Calculator:**
   - Add interactive calculator on folk.care website
   - Compare Folk Care ($1,080/3 years) vs. AxisCare ($23K+), ShiftCare ($40K), Skedulo ($23K)
   - Quantify savings like In-House Health does ($800K/facility, 10% labor cost reduction)

5. **Reliability Tracking:**
   - Track caregiver reliability (call-ins, late arrivals, visit completion rate)
   - Flag high-risk caregivers for critical visits
   - Dashboard for coordinators to see reliability trends

**Medium Priority (Transferable Concepts):**

6. **Visit Optimization (Basic):**
   - Route planning for caregivers (minimize drive time between visits)
   - Time-of-day patterns (morning vs. evening caregiver preferences)
   - NOT AI-driven predictions (too complex for current stage)

7. **Self-Service Scheduling (Limited Applicability):**
   - Works for hospitals (many interchangeable nurses)
   - Home care: Clients request specific caregivers (not interchangeable)
   - **Maybe:** Allow caregivers to claim "fill-in" shifts (last-minute cancellations, per diem work)

**Low Priority (Different Market):**

8. **AI Predictive Scheduling:**
   - In-House Health: Forecast hospital census/acuity 1-3 weeks ahead
   - Home care: Visit demand is more stable (recurring clients, predictable schedules)
   - **Skip for now:** Focus on operational efficiency before AI

### For Competitive Monitoring

**Low Priority:** In-House Health is **not a competitor** and will not become one.

1. **Track Hospital → Home Health Expansion:**
   - Monitor if In-House Health expands from **hospital nursing** to **home health** (medical home care with RNs)
   - **Unlikely:** Different workflows, different reimbursement models, different care settings

2. **Monitor Funding Rounds:**
   - Series A/B announcements signal growth trajectory
   - If In-House Health raises $20M+ Series A, they may expand to adjacent markets (SNFs, home health)

3. **Watch for Technical Blog Posts:**
   - If they publish engineering content, update this analysis with tech stack details

4. **Review Case Studies:**
   - Look for customer testimonials with quantified ROI (labor cost savings, manager time savings)
   - Learn from their messaging and positioning

---

## Pricing Intelligence

### Known Pricing Information

**Public Pricing:** Not disclosed (enterprise sales model)

**Estimated Pricing Model:**
- Likely per-nurse-per-month (PNPM) or per-facility pricing
- Estimated range (based on typical healthcare workforce tech): $5-15/nurse/month or $10K-50K/facility/year
- Implementation fees: Likely $5K-25K for scoped rollout (based on free opportunity assessment → paid implementation model)

**Quantified ROI:**
- **Labor cost reduction:** 10% (In-House Health claim)
- **Manager time savings:** 5+ hours/week (15+ hours → <10 hours)
- **Facility savings:** $800K for average single facility
- **Shift scheduling time:** Full workweek updated in 10 minutes (vs. hours of manual work)

### Example TCO Comparison (Hypothetical)

**Assumptions:**
- 100-bed hospital, 200 nurses, $15/nurse/month pricing
- Implementation fee: $15K one-time
- 3-year contract

| Cost Component | **In-House Health (Est.)** | **Folk Care** |
|----------------|----------------------------|---------------|
| Monthly per-nurse | $15/nurse × 200 = $3,000/month | N/A (not applicable) |
| Annual subscription | $36,000/year | N/A |
| 3-year subscription | $108,000 | N/A |
| Implementation | $15,000 | N/A |
| **3-Year Total** | **$123,000** | **N/A (different market)** |

**Note:** This comparison is **meaningless** because Folk Care serves home care agencies, not hospitals. No competitive overlap.

**Correct Comparison for Home Care:**
- Folk Care ($1,080/3 years) vs. AxisCare ($23K+), ShiftCare ($40K), Skedulo ($23K)
- See `competitive/axiscare.md`, `competitive/shiftcare.md`, `competitive/skedulo.md` for home care TCO comparisons

---

## Sources

### Primary Sources
- [In-House Health Website](https://www.inhouse.health) - Product overview, mission, platform features
- [In-House Health Product Page](https://www.inhouse.health/product) - Detailed feature descriptions, care setting workflows
- [In-House Health iOS App](https://apps.apple.com/us/app/in-house-health/id6748960919) - Mobile app features, user reviews
- [In-House Health Android App](https://play.google.com/store/apps/details?id=inhouse.health&hl=en_CA) - Mobile app availability
- [Fierce Healthcare: In-House Health $4M Funding](https://www.fiercehealthcare.com/health-tech/house-health-nabs-4m-build-out-ai-enabled-scheduling-platform-nursing-teams) - Funding details, founder backgrounds, ROI metrics
- [Slice of Healthcare: Launch Announcement](https://www.sliceofhealthcare.com/in-house-health-launches-ai-driven-nurse-scheduling-platform) - AI-driven scheduling platform launch

### Secondary Sources
- [In-House Health LinkedIn](https://www.linkedin.com/company/in-house-health) - Company updates, team profiles
- [Tracxn: In-House Health Profile](https://tracxn.com/d/companies/in-house-health/__dduW1dxU2nnsYRCeMgKYV3HQl8Sk0tfUAvuOLmBzDSQ) - Founders, funding rounds, investors
- [Tracxn: Founders and Board](https://tracxn.com/d/companies/in-house-health/__dduW1dxU2nnsYRCeMgKYV3HQl8Sk0tfUAvuOLmBzDSQ/founders-and-board-of-directors) - Team details
- [PitchBook: In-House Health Profile](https://pitchbook.com/profiles/company/535805-02) - Valuation, funding, investors
- [Crunchbase: In-House Health](https://www.crunchbase.com/organization/in-house-health-45fa) - Company profile, funding

### Data Collection Limitations

**What's Missing:**
- Pricing details (enterprise sales, not publicly disclosed)
- Technical stack (backend, frontend, cloud provider, ML framework)
- EHR integration specifics (Epic, Cerner, Meditech, HL7/FHIR)
- Customer count, hospital names, revenue (private company, seed-stage)
- Detailed case studies with quantified outcomes

**Why:**
- Seed-stage company (founded 2023, $5.4M raised) maintains information opacity
- Healthcare workforce tech is competitive (protecting competitive advantage)
- Enterprise sales model (custom pricing, not standardized)

---

## Revision History

| Date | Analyst | Changes |
|------|---------|---------|
| 2025-12-06 | Tove | Initial analysis based on public sources |

---

**Next Steps:**
- Monitor In-House Health for Series A funding (signals expansion plans)
- Track if they expand from hospital nursing to home health or SNFs
- Update analysis quarterly or when significant developments occur
- **No competitive monitoring needed:** In-House Health is not a Folk Care competitor

---

## Appendix: Why In-House Health is NOT a Folk Care Competitor

### Different Care Settings
- **In-House Health:** Hospitals (inpatient acute care, behavioral health, skilled nursing facilities, ambulatory surgical centers)
- **Folk Care:** Homes (client's residence, community-based settings)

### Different Workforce Types
- **In-House Health:** RNs, LPNs, CNAs (hospital-employed nurses with certifications, union rules, skill mix requirements)
- **Folk Care:** Non-medical caregivers, home health aides, PCAs (no RN licensure, different skill sets)

### Different Scheduling Models
- **In-House Health:** Shift-based (12-hour shifts, 8-hour shifts, staggered shifts, self-scheduling marketplace)
- **Folk Care:** Visit-based (1-4 hour visits, caregiver-client assignments, recurring schedules)

### Different Business Problems
- **In-House Health:** Hospital nurse staffing inefficiencies (overtime costs, agency reliance, unpredictable census, manager burnout)
- **Folk Care:** Home care operations (scheduling, EVV compliance, billing, payroll, care plans, family engagement)

### Different Technology Focus
- **In-House Health:** AI-driven predictive scheduling (census forecasting, acuity prediction, workload balancing)
- **Folk Care:** Operational efficiency (scheduling, EVV, billing, care plans, family portals)

### Different Business Models
- **In-House Health:** Enterprise SaaS (contact sales, $5-15/nurse/month estimated, implementation fees)
- **Folk Care:** Open-source (AGPL-3.0, $20-30/month flat rate, self-hosted)

### Different Target Markets
- **In-House Health:** 6,093 hospitals in US (AHA data)
- **Folk Care:** 66,000+ home care agencies in US (NAHC data)

**Conclusion:** In-House Health and Folk Care serve **completely different markets** with **no overlap**. This analysis is included for completeness but is **not a competitive threat assessment**.
