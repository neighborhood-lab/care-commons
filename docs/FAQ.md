# Frequently Asked Questions (FAQ)

**Last Updated**: November 27, 2025

---

## General

### What is Folk?

Folk is an open-source home healthcare management platform with state-specific Electronic Visit Verification (EVV) compliance for all 50 states. It provides comprehensive tools for scheduling, care plans, billing, and family engagement.

### Who is Folk for?

- **Home healthcare agencies** (skilled nursing, personal care, home health aides)
- **Home care agencies** (non-medical personal care)
- **Hospice agencies**
- **Private duty nursing**
- **Home health companies** (any size, but especially beneficial for 5-50 caregiver teams)

### Is Folk really free?

Yes! Folk is MIT-licensed open source software. You can:
- Use it commercially
- Self-host it
- Modify it for your needs
- Deploy it without paying us

We also offer a managed SaaS service starting at $99/month for agencies that prefer hosted solutions.

### What makes Folk different?

1. **State-Specific Compliance**: Automatic EVV rules for all 50 states (TX HHAeXchange, FL Sandata, etc.)
2. **Open Source**: Full code access, no vendor lock-in
3. **Data Ownership**: Your data stays yours
4. **Modern Technology**: Built with TypeScript, React, PostgreSQL (not legacy tech)
5. **Community Owned**: Developed transparently, contributions welcome

---

## Features

### What features are included?

**Core Features:**
- Client demographics and authorization tracking
- Caregiver/staff management with credentials
- Care plan creation and task management
- Visit scheduling with conflict detection
- GPS-verified Electronic Visit Verification (EVV)
- Family portal with real-time updates
- Billing and invoicing
- Analytics and reporting
- Mobile app for field caregivers (React Native)

**State-Specific:**
- Texas: HHAeXchange submission, 10-minute grace periods
- Florida: Multi-aggregator support, 15-minute grace periods
- All 50 states: Automatic geofence tolerances and compliance rules

### Does it support Medicare/Medicaid?

Yes! Folk tracks:
- Medicaid/Medicare authorization numbers
- Service authorizations and unit tracking
- EVV compliance for Medicaid-funded services
- Billing codes and claim generation

### Can it handle multiple states?

Yes! Folk has state-specific configurations for all 50 states. If you operate in multiple states, it automatically applies the correct rules for each location.

### Is there a mobile app?

Yes! Folk includes a React Native mobile app for iOS and Android with:
- Offline-first EVV (works without internet)
- GPS verification and geofencing
- Task checklists
- Visit notes
- Photo documentation
- Biometric app lock (HIPAA compliant)

---

## EVV Compliance

### Does it meet the 21st Century Cures Act requirements?

Yes! Folk captures all six required EVV elements:
1. Type of service performed
2. Individual receiving service
3. Date of service
4. Location of service
5. Individual providing service
6. Time service begins and ends

Plus GPS verification and state-specific aggregator submission.

### Which EVV aggregators are supported?

- **Texas**: HHAeXchange (mandatory for Medicaid)
- **Florida**: HHAeXchange, Sandata, others
- **Other states**: Multiple aggregators supported

We're continuously adding more aggregator integrations.

### What if my state doesn't have EVV requirements yet?

Folk works in all 50 states! Even if your state doesn't mandate EVV, you can still use GPS verification for quality assurance and operational visibility.

### How accurate is GPS verification?

Folk uses smartphone GPS with configurable geofence tolerances:
- **Texas**: 100m base + GPS accuracy allowance
- **Florida**: 150m base + GPS accuracy allowance
- **Other states**: Configurable per state requirements

GPS accuracy is typically 5-20 meters in open areas.

---

## Pricing & Licensing

### Is it really free?

Yes! The software is MIT-licensed and free to use. You only pay for:
- Infrastructure costs (if self-hosting)
- Your database and server hosting
- Support/managed service (if desired)

### What is the SaaS pricing?

Our managed service pricing:
- **Starter**: $99/month (up to 10 caregivers)
- **Growth**: $299/month (up to 50 caregivers)
- **Enterprise**: Custom pricing (50+ caregivers)

**14-day free trial, no credit card required**

Self-hosting is always free!

### What's included in managed service?

- Hosted on Vercel + Neon (SOC 2 certified)
- Automatic updates and security patches
- Database backups (30-day retention)
- Email support
- Uptime monitoring
- HIPAA compliance infrastructure

### Can I migrate from self-hosted to managed later?

Yes! We provide migration assistance. Your data exports cleanly from self-hosted PostgreSQL to our managed service.

---

## Technical

### What are the system requirements?

**Self-Hosting:**
- Node.js 22.x
- PostgreSQL 14+ (17+ recommended)
- 2GB RAM minimum (4GB+ recommended)
- 10GB storage (varies with data volume)

**Recommended Hosting:**
- Vercel (frontend/API)
- Neon (PostgreSQL database)
- Both have generous free tiers!

### Is it secure?

Yes! Folk implements:
- JWT authentication with secure tokens
- CSRF protection
- Rate limiting
- SQL injection prevention (parameterized queries)
- XSS protection
- HTTPS required
- Audit logging for all PHI access
- Encryption at rest and in transit

See [SECURITY.md](../SECURITY.md) for full details.

### Is it HIPAA compliant?

Folk implements HIPAA-required **technical safeguards**:
- Access controls
- Audit trails
- Encryption
- Authentication

**However**: Full HIPAA compliance requires administrative and physical safeguards that are the responsibility of the covered entity (your agency). We provide the tools, you ensure proper policies and procedures.

### Can I integrate with my existing systems?

Yes! Folk provides:
- REST API for all operations
- Webhook support (coming soon)
- Data import/export tools
- Open database schema

We're building integrations with popular systems (QuickBooks, payroll providers, etc.)

### What database does it use?

PostgreSQL (14+ supported, 17+ recommended). We use JSONB for flexible state-specific data and have 83 performance indexes optimized for healthcare queries.

---

## Getting Started

### How do I try it?

1. **Showcase (no signup)**: https://folk.care/
2. **SaaS Trial (14 days free)**: https://folk.care/
3. **Self-Host**: Clone from GitHub and follow README

### How long does setup take?

- **SaaS**: Signup in 5 minutes, start using immediately
- **Self-Hosting**: 30-60 minutes for experienced developers

### Is training available?

Yes! We provide:
- Video tutorials (coming soon)
- Written documentation
- Sample workflows
- Demo data for exploration
- Community Discord for questions

### Can I import my existing data?

Yes! We're building data import wizards for:
- CSV files
- Common home health software (AlayaCare, ClearCare, WellSky, etc.)

Currently in development. Contact us for migration assistance.

---

## Support

### How do I get help?

- **Documentation**: README, docs/, inline code comments
- **Discord**: https://discord.gg/EkeXQZFq (community support)
- **GitHub Discussions**: https://github.com/neighborhood-lab/folkcare/discussions
- **Email**: brian.mabry.edwards@gmail.com (for SaaS customers)

### What is the response time?

- **Community Support** (Discord/GitHub): Best-effort from community
- **SaaS Customers**: 24-48 hour email response
- **Enterprise**: Dedicated support with SLA

### Can I hire someone to help?

Yes! Contact us for:
- Implementation assistance
- Data migration
- Custom development
- Training
- Compliance consulting

---

## Roadmap

### What's next?

**Near Term (Q1 2025):**
- Data import wizard for competitor migration
- Additional state configurations
- Mobile app in App Store / Play Store
- QuickBooks integration

**Medium Term (Q2 2025):**
- Medication management enhancements
- Incident reporting workflows
- Real-time family notifications
- Multi-language support

**Long Term (H2 2025):**
- API marketplace for community plugins
- Advanced analytics and ML insights
- Telehealth integration
- Voice-enabled documentation

### Can I request features?

Yes! Feature requests are welcome:
- GitHub Discussions (preferred)
- Discord #feature-requests channel
- Email suggestions

We prioritize features based on:
1. Compliance/regulatory requirements
2. Community votes
3. Implementation complexity
4. Strategic roadmap fit

### Can I contribute code?

Absolutely! See [CONTRIBUTING.md](../CONTRIBUTING.md) for:
- Development workflow
- Pull request process
- Coding standards
- Testing requirements

---

## Compliance & Regulations

### Which states are supported?

All 50 US states! State-specific configurations include:
- EVV grace periods
- Geofence tolerances
- Aggregator requirements
- Background check rules
- Credentialing requirements

### Does it handle OASIS assessments?

Not currently, but it's on the roadmap. Folk focuses on operational workflows (scheduling, EVV, billing) rather than clinical assessments.

### What about Plan of Care (POC) requirements?

Yes! Folk tracks:
- Care plan creation and updates
- Review cycles (60/90 days depending on state)
- Supervisor sign-offs
- Changes/amendments with audit trail

### How does it handle state licensure?

Caregiver management includes:
- License tracking by type
- Expiration alerts
- Registry checks (state-specific)
- Competency evaluations
- Training records

---

## Migration

### Can I migrate from [other system]?

We're building migration tools for popular systems:
- AlayaCare
- ClearCare
- WellSky (formerly Kinnser/MatrixCare)
- Homecare Homebase
- AxisCare

Contact us for migration assistance specific to your current system.

### Will my data be safe during migration?

Yes! Our migration process:
1. Test migration on sandbox environment
2. Validate data integrity
3. Run parallel systems during transition
4. Final cutover with backup
5. Post-migration verification

### How long does migration take?

Varies by data volume:
- **Small agency** (10-20 caregivers): 1-2 weeks
- **Medium agency** (20-50 caregivers): 2-4 weeks
- **Large agency** (50+ caregivers): 4-8 weeks

Includes data mapping, testing, training, and go-live support.

---

## Business Questions

### Who owns the software?

Folk is developed by [Neighborhood Lab](https://neighborhoodlab.org), a community-owned software organization. The code is MIT-licensed, meaning you have full rights to use, modify, and distribute it.

### Is this a venture-backed company?

No! Neighborhood Lab is funded by:
- Patreon supporters
- SaaS subscriptions (voluntary)
- Consulting/implementation services
- Community contributions

We're not seeking VC funding and won't be acquired. The software remains community-owned forever.

### What happens if Neighborhood Lab stops development?

Because it's open source (MIT license):
- Code remains available on GitHub
- Community can fork and continue development
- You retain full access to your data
- No vendor lock-in

### Can I white-label it?

Yes! The MIT license allows you to:
- Rebrand the software
- Offer it as your own service
- Modify the UI/UX
- Add your own features

We'd appreciate attribution but it's not required by the license.

---

## Community

### How can I contribute?

Many ways to help:
- 🐛 Report bugs
- 💡 Suggest features
- 💻 Submit code (features, fixes, tests)
- 📝 Improve documentation
- 🌍 Add state-specific compliance rules
- 🎨 Design UI/UX improvements
- 🎓 Help other users in Discord

### Is there a user community?

Yes! Join us:
- **Discord**: https://discord.gg/EkeXQZFq
- **GitHub Discussions**: Share tips, ask questions
- **Substack**: https://neighborhoodlab.substack.com/ (updates & articles)

### Can I sponsor development?

Yes! Support us via:
- **Patreon**: https://www.patreon.com/neighborhood_lab
- **SaaS subscription**: Use our managed service
- **Consulting**: Hire us for implementation help

All support funds continued development and maintenance.

---

## Still Have Questions?

- 💬 **Discord**: https://discord.gg/EkeXQZFq
- 💻 **GitHub**: https://github.com/neighborhood-lab/folkcare
- 📧 **Email**: brian.mabry.edwards@gmail.com
- 📰 **Substack**: https://neighborhoodlab.substack.com/

---

**Folk Care** - Shared care software, community owned.  
Built by [Neighborhood Lab](https://neighborhoodlab.org)
