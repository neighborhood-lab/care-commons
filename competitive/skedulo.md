# Skedulo - Competitive Analysis

**Last Updated:** December 6, 2025
**Analyst:** Tove (AI dev agent)

---

## Executive Summary

**Skedulo** is an enterprise "Deskless Productivity Cloud" platform for mobile workforce management across multiple industries (healthcare, field service, retail, etc.). Unlike AxisCare (home care-specific) or Synapticure (neurology-specific), Skedulo is a horizontal platform targeting any company with a mobile/deskless workforce. As a Salesforce-integrated, enterprise SaaS solution with deep technical capabilities (REST + GraphQL APIs, extensive developer docs), Skedulo competes indirectly with Folk Care in the home care scheduling space.

**Key Differentiators from Folk Care:**
- **Horizontal platform:** Multi-industry (field service, healthcare, retail) vs. Folk Care's home care focus
- **Salesforce integration:** Native Salesforce AppExchange app vs. Folk Care's standalone platform
- **Enterprise-grade:** Complex scheduling optimization, routing, analytics vs. Folk Care's simplicity
- **Developer platform:** Extensive APIs, CLI, extensions vs. Folk Care's API-first but smaller scope
- **Pricing:** $39-150/user/month + implementation ($5K-50K+) vs. Folk Care's $20-30/month self-hosted

---

## Company Profile

| Attribute | Details |
|-----------|---------|
| **Founded** | ~2013-2014 (mature company) |
| **Headquarters** | Australia (Sydney) + US offices |
| **Business Model** | Enterprise SaaS subscription ($39-150/user/month) |
| **Coverage** | Global (multi-region, multi-industry) |
| **Target Market** | Deskless/mobile workforces (field service, healthcare, home care, retail, utilities) |
| **Platform** | Deskless Productivity Cloud (Salesforce-integrated) |
| **Stage** | Mature/Established (enterprise market) |
| **Implementation Costs** | $5K (small businesses) to $50K+ (enterprise) |

---

## Product Overview

### Platform Architecture

**Type:** Enterprise SaaS, cloud-hosted
**Access:** Web app + iOS/Android mobile apps + Salesforce integration

### Core Platform Components

1. **Skedulo Plan** (Scheduling & Dispatching)
   - Centrally manage workforce
   - Automated scheduling and dispatching
   - Real-time schedule updates
   - Drag-and-drop interface
   - Conflict detection
   - Optimized caregiver matching

2. **Skedulo Engage** (Mobile Worker Tools)
   - iOS/Android mobile apps
   - See work details, schedule changes, status updates
   - "Office in your pocket" for deskless workers
   - Capture appointment details on-site
   - Enter travel time, billing info, vitals, patient history
   - Real-time communication with schedulers

3. **Deskless Productivity Platform** (Customization & Integration)
   - Integrate existing technology
   - Tailor unique workflows
   - REST API + GraphQL
   - Salesforce native integration
   - Custom objects, fields, extensions
   - Horizon components for custom list views/pages

4. **Analytics & Reporting**
   - Detailed business insights
   - Resource availability, growth by month, job types
   - KPIs and metrics dashboards
   - Visibility into mobile workforce
   - Data-driven decision making

### Homecare-Specific Features

**Skedulo for Healthcare / Homecare Software:**
- Automated scheduling and dispatching
- Optimized caregiver matching (qualifications, availability, location)
- Easy data collection and reporting (on-site entry)
- Simple system integration (Salesforce, Zendesk, etc.)
- Real-time communication (caregivers, patients, providers)
- Optimized caregiver routing and mileage (live mapping)
- HIPAA-compliant mobile app
- Billing process automation
- Compliance assurance (HIPAA requirements)

---

## Technical Architecture

### Known Technical Stack

**Platform:**
- **Deskless Productivity Cloud:** Proprietary SaaS platform
- **Salesforce Integration:** Native AppExchange app, Apex code support
- **API:** REST API + GraphQL
- **CLI:** Skedulo CLI for extending and customizing
- **Developer Blog:** developerblog.skedulo.com (architecture, best practices)

**Infrastructure:**
- **Cloud Providers:** Azure, AWS, or GCP (job postings mention all three)
- **Office Tools:** Office 365
- **Maps:** Google Maps integration
- **Code Hosting:** GitHub

**Marketing & Analytics:**
- **Marketing Automation:** Marketo
- **Video:** Wistia
- **Other Marketing:** Ortto

**APIs & Developer Tools:**
- **REST API:** Full data access to standard/custom objects
- **GraphQL:** Remote querying and requests
- **Webhooks:** Integrate with third-party apps via triggered actions
- **Skedulo Functions:** Custom functions for web/mobile extensions
- **Salesforce API:** Call Skedulo API from Salesforce Apex code
- **Skedulo SDK:** Create and deploy customizations (deprecated)
- **Skedulo CLI:** Extend and customize Skedulo teams

**Mobile Apps:**
- **Skedulo v2 Mobile App:** iOS/Android
- **Skedulo Plus:** Enhanced mobile app
- **Custom Extensions:** Developers can create extensions for mobile apps

**Developer Resources:**
- **Developer Documentation:** developer.skedulo.com/developer-guides/
- **API Reference:** developer.skedulo.com/skedulo-api/
- **System Status:** developer.skedulo.com/developer-guides/skedulo-system-status/

### Unknown Technical Details

The following are **NOT publicly disclosed**:
- **Backend Languages:** Java, Python, Node.js, .NET, etc.
- **Frontend Framework:** React, Angular, Vue (likely React based on dev blog)
- **Database:** PostgreSQL, MongoDB, SQL Server, etc.
- **Mobile Framework:** React Native, Flutter, native iOS/Android
- **Hosting Details:** Specific AWS/Azure/GCP services, multi-region architecture
- **Security Implementation:** Encryption standards, HIPAA compliance details

**Why Hidden:** Enterprise SaaS companies protect technical architecture for competitive advantage. Unlike open-source Folk Care, Skedulo's source code is proprietary.

---

## Feature Comparison: Skedulo vs. Folk Care

| Feature Category | **Skedulo** | **Folk Care** |
|------------------|------------|---------------|
| **Scheduling** | Advanced optimization, drag-and-drop, real-time | ✅ Implemented |
| **Mobile Apps** | iOS/Android (mature, Skedulo Plus) | 🔶 In progress |
| **Dispatch** | Automated dispatching, optimized matching | ✅ Implemented (basic) |
| **Routing/Mileage** | Live mapping, optimized routing, mileage tracking | ✅ Mileage tracking implemented |
| **EVV** | HIPAA-compliant check-in/out | ✅ Implemented (50-state compliance) |
| **Billing** | Automated invoicing, billing integration | ✅ Implemented |
| **Care Plans** | Custom objects/fields for care plans | ✅ Implemented |
| **Family Portal** | Not explicitly mentioned | ✅ Implemented |
| **Reporting** | Dashboards, KPIs, business insights, analytics | ✅ Implemented |
| **Real-Time Communication** | Built-in communication platform | ❌ Not implemented (two-way chat) |
| **API** | REST + GraphQL, webhooks, extensive docs | ✅ REST API (less extensive than Skedulo) |
| **Salesforce Integration** | Native AppExchange app, Apex code support | ❌ Not implemented |
| **Custom Extensions** | CLI, SDK, Horizon components, mobile extensions | 🔶 Plugin architecture planned |
| **Multi-Industry** | Field service, healthcare, retail, utilities, etc. | ❌ Home care only |
| **Optimization Engine** | AI-powered scheduling optimization | ❌ Basic scheduling (no AI optimization) |
| **Compliance** | HIPAA-compliant, designed for compliance | ✅ HIPAA-ready (self-hosted) |

---

## Competitive Comparison: Skedulo vs. Folk Care

| Dimension | **Skedulo** | **Folk Care** |
|-----------|------------|---------------|
| **Business Model** | Enterprise SaaS subscription | Open-source (AGPL-3.0) |
| **Pricing** | $39-150/user/month + $5K-50K+ implementation | $20-30/month self-hosted |
| **Target Market** | Deskless workforces (multi-industry) | Home care agencies |
| **Market Focus** | Horizontal (field service, healthcare, retail) | Vertical (home care only) |
| **Deployment** | Cloud-hosted only | Self-hosted or cloud |
| **Salesforce Integration** | Native AppExchange app | None |
| **Vendor Lock-In** | Yes (Salesforce ecosystem, proprietary) | No (open-source, portable) |
| **Source Code** | Closed (trade secret) | Open (AGPL-3.0, GitHub) |
| **Customization** | CLI, SDK, custom objects/fields/extensions | Full code access, unlimited customization |
| **APIs** | REST + GraphQL, webhooks, extensive docs | REST API (simpler) |
| **Mobile Apps** | Mature iOS/Android (Skedulo v2 + Plus) | In progress (React Native/Expo) |
| **Optimization** | AI-powered scheduling optimization engine | Basic scheduling (no AI) |
| **Implementation** | $5K-50K+ professional services | Self-service (documentation-driven) |
| **Customer Support** | Enterprise support team | Community support + documentation |
| **Stage** | Mature, enterprise-focused | Early-stage, community-driven |
| **Industries Served** | Healthcare, field service, retail, utilities, etc. | Home care only |

---

## Market Positioning

### Skedulo's Strengths

1. **Enterprise-Grade:** Built for complex, large-scale operations (1000+ mobile workers)
2. **Multi-Industry:** Serves field service, healthcare, retail, utilities (not just home care)
3. **Salesforce Integration:** Native AppExchange app (huge advantage for Salesforce customers)
4. **Advanced Optimization:** AI-powered scheduling optimization engine
5. **Developer Platform:** Extensive APIs (REST + GraphQL), CLI, SDK, custom extensions
6. **Mobile Maturity:** Polished iOS/Android apps (Skedulo v2 + Plus)
7. **Real-Time Communication:** Built-in communication platform for deskless workers
8. **Analytics:** Advanced dashboards, KPIs, business insights
9. **Routing Optimization:** Live mapping, optimized routing, mileage tracking
10. **HIPAA Compliance:** Designed for healthcare compliance

### Skedulo's Weaknesses

1. **Pricing:** $39-150/user/month + $5K-50K+ implementation (expensive for small agencies)
2. **Complexity:** Over-engineered for small home care agencies (1-10 caregivers)
3. **Salesforce Dependency:** Best value requires Salesforce (additional cost, complexity)
4. **Proprietary/Closed Source:** No community development, vendor lock-in
5. **Horizontal Focus:** Not home care-specific (generic "deskless workforce" platform)
6. **Implementation Costs:** Professional services required ($5K-50K+)

### Folk Care's Advantages vs. Skedulo

1. **Cost-Effective:** $20-30/month self-hosted (vs. $39-150/user + implementation)
2. **Home Care-Specific:** Purpose-built for home care (not generic "deskless workforce")
3. **Open Source:** AGPL-3.0, full source code access, community-driven
4. **Self-Hosted Option:** Full data control, no vendor lock-in
5. **Simplicity:** Right-sized for small/medium agencies (not over-engineered)
6. **No Salesforce Dependency:** Standalone platform (no additional licensing costs)
7. **Transparent Pricing:** $20-30/month (vs. opaque enterprise pricing + implementation)
8. **Self-Service Implementation:** Documentation-driven (vs. $5K-50K+ professional services)

### Folk Care's Gaps vs. Skedulo

1. **Mobile Apps:** In progress (vs. mature Skedulo v2 + Plus)
2. **Optimization Engine:** Basic scheduling (vs. AI-powered optimization)
3. **Real-Time Communication:** None (vs. built-in communication platform)
4. **Salesforce Integration:** None (vs. native AppExchange app)
5. **Multi-Industry:** Home care only (vs. field service, retail, utilities, etc.)
6. **Advanced Analytics:** Basic reporting (vs. advanced dashboards, KPIs)
7. **Routing Optimization:** Basic (vs. live mapping, optimized routing)
8. **Developer Platform:** Simpler APIs (vs. REST + GraphQL + CLI + SDK)
9. **Enterprise Support:** Community-driven (vs. enterprise support team)
10. **Implementation Services:** Self-service (vs. professional services available)

---

## Strategic Insights

### Market Overlap

**LIMITED DIRECT COMPETITION:**
- Skedulo is a **horizontal** platform (multi-industry deskless workforce)
- Folk Care is a **vertical** platform (home care agencies only)
- Overlap: Both serve home care agencies needing scheduling + mobile workforce management

**Key Battlegrounds:**
- **Enterprise Home Care Agencies:** Skedulo's optimization vs. Folk Care's cost + customization
- **Salesforce Customers:** Skedulo's native integration vs. Folk Care's standalone simplicity
- **Small/Medium Agencies:** Folk Care's cost advantage vs. Skedulo's enterprise features

### Competitive Strategy for Folk Care

#### Differentiate on Vertical Focus & Cost

**Messaging:**
- "Purpose-built for home care (not generic 'deskless workforce')"
- "Why pay $39-150/user/month when you can self-host for $20-30/month?"
- "No Salesforce required, no $5K-50K+ implementation fees"
- "Open-source = community-owned, transparent, customizable"

**Target Customers:**
- Small agencies (1-10 caregivers) priced out of Skedulo
- Non-Salesforce users avoiding ecosystem lock-in
- Cost-conscious agencies wanting full data control (self-hosted)

#### Close the Feature Gaps (Selective)

**Don't Try to Match Everything:**
- Folk Care doesn't need multi-industry support (Skedulo's strength)
- Folk Care doesn't need Salesforce integration (different market)
- Folk Care doesn't need $50K+ implementation services (self-service is a feature)

**Do Match These:**

1. **Mobile Apps (Critical):**
   - Complete iOS/Android apps (match Skedulo's mobile maturity)
   - GPS geofencing, offline support, on-site data entry

2. **Routing Optimization (Medium Priority):**
   - Integrate Google Maps for route optimization
   - Mileage tracking already implemented - add live routing

3. **Real-Time Communication (Low Priority for MVPs, High for Growth):**
   - Simple two-way chat (caregiver-coordinator messaging)
   - Not Skedulo's full communication platform (over-engineered for small agencies)

4. **Advanced Analytics (Future):**
   - Enhanced dashboards, KPIs (beyond basic reporting)
   - Focus on home care-specific metrics (not generic "deskless workforce")

#### Leverage Vertical Focus

**Home Care-Specific Features:**
- **Care Plans:** Folk Care already has this (Skedulo has custom objects, not care plan-specific)
- **Family Portal:** Folk Care already has this (Skedulo doesn't explicitly mention)
- **EVV Compliance:** Folk Care's 50-state focus (Skedulo's is HIPAA-compliant but not EVV-specific)
- **Billing for Home Care:** Folk Care's billing/invoicing (Skedulo has generic billing integration)

**Messaging:**
- "Built for home care agencies, not field service technicians"
- "Care plans, family portals, EVV compliance - out of the box"
- "No need for Salesforce consultants to configure generic workforce tools"

---

## Threats & Opportunities

### Threats to Folk Care

1. **Enterprise Accounts:** Skedulo wins large agencies (1000+ caregivers) with optimization, support
2. **Salesforce Ecosystem:** Agencies already on Salesforce may prefer Skedulo's native integration
3. **Feature Velocity:** Mature platform with AI optimization, advanced analytics, mobile extensions
4. **Professional Services:** $5K-50K+ implementation teams vs. Folk Care's self-service docs

### Opportunities for Folk Care

1. **Small Agency Market:** 1000s of agencies too small/cost-conscious for Skedulo ($39-150/user + implementation)
2. **Non-Salesforce Market:** Agencies not on Salesforce avoid ecosystem lock-in
3. **Home Care Specialization:** Vertical focus vs. Skedulo's horizontal "deskless workforce" genericism
4. **Self-Hosted Advantage:** Data sovereignty, privacy, compliance (vs. cloud-only Skedulo)
5. **Open-Source Community:** Developers build on Folk Care (vs. Skedulo's proprietary platform)
6. **International Expansion:** Self-hosted works globally (vs. Skedulo's enterprise pricing)

---

## Recommendations

### For Folk Care Development (Priority Order)

1. **Mobile Apps (Sprint to Completion):**
   - Focus: Match Skedulo's mobile maturity (on-site data entry, offline support)
   - Goal: Feature parity with Skedulo's caregiver mobile app by Q1 2026

2. **Home Care Vertical Features (Differentiation):**
   - Enhance care plans, family portal, EVV compliance
   - Add home care-specific workflows (vs. Skedulo's generic field service)

3. **Routing Optimization (Medium Priority):**
   - Google Maps integration for route optimization
   - Live mapping, estimated travel times

4. **Basic Analytics Enhancements (Future):**
   - Dashboards for home care-specific KPIs
   - Don't try to match Skedulo's enterprise analytics - focus on simplicity

5. **Documentation (Critical for Self-Service):**
   - Self-hosting guides (Digital Ocean, AWS, Hetzner)
   - Migration guide from Skedulo (target cost-conscious agencies)

### For Competitive Positioning

**Messaging Framework:**
- **Tagline:** "Open-source home care software. No Salesforce required. $20-30/month."
- **Positioning:** "The affordable, home care-specific alternative to Skedulo"
- **Value Props:**
  - "Purpose-built for home care (not generic deskless workforce)"
  - "Self-hosted = your data, your control"
  - "No $5K-50K+ implementation fees, no Salesforce dependency"
  - "Open-source = community-driven, transparent, extensible"

**Target Segments:**
1. **Primary:** Small agencies (1-10 caregivers) priced out of Skedulo
2. **Secondary:** Non-Salesforce users avoiding ecosystem lock-in
3. **Tertiary:** Cost-conscious agencies wanting self-hosted data control

**Marketing Channels:**
- **GitHub:** Primary distribution, community building
- **Reddit:** r/homecare, r/selfhosted, r/opensource
- **Salesforce Alternatives:** Forums for companies moving away from Salesforce
- **Home Care Associations:** Target non-Salesforce agencies

### For Competitive Monitoring

**Track Skedulo's Moves:**
1. **Pricing Changes:** Monitor if they introduce small-agency tiers or home care-specific pricing
2. **Home Care Focus:** Watch for Skedulo deepening home care vertical (competitive threat)
3. **Salesforce Pricing:** Salesforce AppExchange pricing changes (affects Skedulo's value prop)
4. **API Changes:** Skedulo's GraphQL API enhancements (match where relevant for Folk Care)
5. **Mobile App Updates:** Skedulo v2 vs. Plus feature differentiation

---

## Pricing Intelligence

### Skedulo Pricing (from Multiple Sources)

**Per-User Monthly:**
- **Small/Medium Agencies:** $39-50/user/month (estimated)
- **Large Agencies:** $50-150/user/month (volume-based)
- **Enterprise (1000+ users):** ~$150/user/month (custom pricing)

**Implementation Costs:**
- **Small Businesses:** $5,000+
- **Mid-Sized Businesses:** $20,000+
- **Large Enterprises:** $50,000+

**Other Notes:**
- No publicly available pricing (contact sales)
- No free plan
- No monthly billing (annual contracts)
- Minimum licenses required (not disclosed)

**Folk Care Comparison:**
- **Self-Hosted:** $20-30/month (any number of users)
- **No Implementation Costs:** Self-service documentation
- **No Salesforce Dependency:** Skedulo often requires Salesforce (additional $$$)

**Example TCO Comparison (10 caregivers, 3 years):**

| Cost Component | **Skedulo** | **Folk Care** |
|----------------|------------|---------------|
| Monthly per-user | $50/user × 10 = $500/month | $30/month (flat) |
| Annual subscription | $6,000/year | $360/year |
| 3-year subscription | $18,000 | $1,080 |
| Implementation | $5,000+ | $0 (self-service) |
| **3-Year Total** | **$23,000+** | **$1,080** |

**Savings with Folk Care:** ~$21,920 over 3 years (95%+ cost reduction)

---

## Technical Comparison: Skedulo vs. Folk Care

| Technical Dimension | **Skedulo** | **Folk Care** |
|---------------------|------------|---------------|
| **Architecture** | Enterprise SaaS (closed source) | Open-source monorepo (AGPL-3.0) |
| **Frontend** | Unknown (likely React) | React 19 + Vite |
| **Backend** | Unknown (likely Java or .NET) | Express + Node.js |
| **Database** | Unknown (likely PostgreSQL or SQL Server) | PostgreSQL 14+ |
| **Mobile** | Skedulo v2 + Skedulo Plus (iOS/Android) | React Native (Expo) - in progress |
| **APIs** | REST + GraphQL + Webhooks | REST API |
| **Deployment** | Cloud-hosted only | Self-hosted or cloud (Vercel + Neon) |
| **Salesforce** | Native AppExchange app, Apex code support | None |
| **Developer Tools** | CLI, SDK, Horizon components, extensions | API-first, plugin architecture (planned) |
| **Hosting** | Azure, AWS, or GCP (multi-region) | Vercel (frontend) + Neon (database) |
| **Analytics** | Advanced dashboards, KPIs, business insights | Basic reporting (Plausible Analytics) |
| **Optimization** | AI-powered scheduling optimization engine | Basic scheduling (no AI) |
| **Routing** | Live mapping (Google Maps), optimized routing | Mileage tracking (routing planned) |
| **Communication** | Built-in real-time communication platform | None (two-way chat planned) |
| **Compliance** | HIPAA-compliant (healthcare-focused) | HIPAA-ready (self-hosted) |
| **Testing** | Unknown | Vitest + Playwright E2E |
| **CI/CD** | Unknown | GitHub Actions |
| **Documentation** | Extensive developer docs, API reference | GitHub docs, API reference |

---

## Sources

### Primary Sources
- [Skedulo Home](https://www.skedulo.com/) - Platform overview, product features
- [Skedulo Developer Documentation](https://developer.skedulo.com/developer-guides/) - Technical guides, API docs
- [Skedulo API Reference](https://developer.skedulo.com/skedulo-api/) - REST + GraphQL APIs
- [Skedulo Homecare Software](https://www.skedulo.com/healthcare/homecare-software/) - Home care-specific features
- [Skedulo Developer Blog](https://developerblog.skedulo.com/) - Architecture, best practices
- [Skedulo Technology Stack - Crunchbase](https://www.crunchbase.com/organization/skedulo/technology) - Tech stack details
- [Skedulo Technology Stack - ContactOut](https://contactout.com/company/skedulo-6312395/technology-stack) - Additional tech details

### Secondary Sources
- [Skedulo Pricing - SaaSworthy](https://www.saasworthy.com/product/skedulo/pricing) - Pricing estimates
- [Skedulo Pricing - ITQlick](https://www.itqlick.com/skedulo/pricing) - Pricing breakdown
- [Skedulo Review - Research.com](https://research.com/software/reviews/skedulo) - Features, pricing
- [Skedulo Salesforce AppExchange](https://appexchange.salesforce.com/appxListingDetail?listingId=a0N3000000B49gqEAB) - Salesforce integration
- [Skedulo Job Posting - Senior Principal Solutions Architect](https://jobs.january.capital/companies/skedulo/jobs/51918781-senior-principal-solutions-architect) - Cloud tech stack (Azure, AWS, GCP)

### Data Collection Limitations

**What's Available:**
- Comprehensive developer documentation (REST + GraphQL APIs)
- Home care-specific feature list
- Pricing estimates (from third-party sources)
- Technology stack components (Office 365, Google Maps, Marketo, GitHub)
- Salesforce integration details
- Mobile app capabilities (Skedulo v2, Skedulo Plus)

**What's Missing:**
- Exact pricing (contact sales only)
- Backend programming languages and frameworks
- Database technology
- Hosting infrastructure details (beyond multi-cloud)
- Source code (closed-source, trade secret)
- Security implementation details (beyond HIPAA compliance)

---

## Revision History

| Date | Analyst | Changes |
|------|---------|---------|
| 2025-12-06 | Tove | Initial analysis based on developer docs, home care features, pricing estimates |

---

**Next Steps:**
- Monitor Skedulo's home care vertical strategy (increased focus = competitive threat)
- Track Salesforce AppExchange updates (native integration advantage)
- Analyze Skedulo's API changes (GraphQL enhancements, webhook improvements)
- Compare Skedulo's mobile app updates (Skedulo v2 vs. Plus differentiation)
- Update analysis quarterly or when significant competitive developments occur
