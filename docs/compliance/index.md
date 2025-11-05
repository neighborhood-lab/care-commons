# State Compliance Documentation

**Care Commons Regulatory Knowledge Base**

> "Reading Texas HHSC regulations at 2 AM shouldn't be necessary. The compliance rules should be encoded in the software itself." — Care Commons Philosophy

## Overview

This directory contains comprehensive regulatory compliance documentation for all 50 US states (starting with priority states). Each state has:

1. **REQUIREMENTS.md** - Detailed regulatory requirements with statutory citations
2. **IMPLEMENTATION.md** - How Care Commons implements these requirements in code
3. **TEST_SCENARIOS.md** - Comprehensive test cases for every requirement
4. **CHANGELOG.md** - Git-tracked history of regulatory changes

## Why This Matters

**For Home Health Agencies:**
- Confidence in meeting state requirements without hiring expensive compliance consultants
- Clear documentation for surveyors and auditors
- Reduced regulatory risk

**For Developers:**
- Regulations as code - requirements are testable and verifiable
- Clear implementation guidance
- Easy onboarding to new states

**For Community Contributors:**
- Framework for adding new states
- Template-based documentation
- Git-based change tracking

## State Coverage

### Priority 1: Implemented ✅

| State | Code | Aggregator | Market Size | Documentation | Implementation | Tests |
|-------|------|------------|-------------|---------------|----------------|-------|
| Texas | TX | HHAeXchange | 10,000+ agencies | ✅ | ✅ | ✅ |
| Florida | FL | Multi (HHAeXchange, Tellus) | 12,000+ agencies | ✅ | ✅ | ✅ |

### Priority 2: In Progress 🚧

| State | Code | Aggregator | Market Size | Documentation | Implementation | Tests |
|-------|------|------------|-------------|---------------|----------------|-------|
| Ohio | OH | Sandata (FREE) | 5,000+ agencies | 🚧 | 🚧 | ⏳ |
| Pennsylvania | PA | Sandata (FREE) | 8,000+ agencies | 🚧 | 🚧 | ⏳ |

### Priority 3: Planned 📋

| State | Code | Aggregator | Market Size | Documentation | Implementation | Tests |
|-------|------|------------|-------------|---------------|----------------|-------|
| Georgia | GA | Tellus | 6,000+ agencies | ⏳ | ⏳ | ⏳ |
| North Carolina | NC | Sandata (FREE) | 5,000+ agencies | ⏳ | ⏳ | ⏳ |
| Arizona | AZ | Sandata (FREE) | 4,000+ agencies | ⏳ | ⏳ | ⏳ |

### Future States 🔮

States will be prioritized based on:
1. **Community demand** - GitHub issues and votes
2. **Market size** - Number of agencies
3. **Regulatory complexity** - Unique requirements
4. **Contributor availability** - Community expertise

**Request a state**: Open a GitHub issue with tag `state-request`

## Using This Documentation

### For Agencies Using Care Commons

**Check your state's compliance status:**

1. Navigate to your state's directory (e.g., `docs/compliance/texas/`)
2. Read `REQUIREMENTS.md` to understand what regulations apply
3. Review `IMPLEMENTATION.md` to see how Care Commons handles compliance
4. Check `CHANGELOG.md` for recent regulatory changes

**Stay updated on regulatory changes:**

- Watch this repository for updates
- Subscribe to state-specific change notifications
- Review CHANGELOG.md quarterly

### For Developers

**Implementing a new state:**

1. Copy `_template/` directory to new state name (e.g., `massachusetts/`)
2. Research state regulations thoroughly
3. Complete REQUIREMENTS.md with statutory citations
4. Implement validators in `packages/core/src/compliance/[state]/`
5. Write comprehensive tests matching TEST_SCENARIOS.md
6. Update EVV config in `verticals/time-tracking-evv/src/config/state-evv-configs.ts`
7. Document implementation in IMPLEMENTATION.md
8. Submit PR with all documentation and tests

**Updating existing state requirements:**

1. Document change in state's CHANGELOG.md
2. Update REQUIREMENTS.md sections affected
3. Modify validator code
4. Update test scenarios
5. Update state configuration if needed
6. Submit PR with regulatory citation

### For Compliance Officers

**Verifying regulatory compliance:**

1. Review state's REQUIREMENTS.md for current requirements
2. Check that regulatory citations are current
3. Verify implementation matches requirements
4. Run test suite to validate compliance logic
5. Review audit trail and logging

**Preparing for surveys/audits:**

1. Print state's REQUIREMENTS.md for reference
2. Review IMPLEMENTATION.md for system capabilities
3. Run compliance reports from the system
4. Provide CHANGELOG.md showing regulatory diligence

## Architecture

### Documentation Layer

```
docs/compliance/
├── _template/          # Template for new states
├── texas/              # TX-specific docs
├── florida/            # FL-specific docs
├── ohio/               # OH-specific docs
└── [state]/
    ├── REQUIREMENTS.md      # What regulations require
    ├── IMPLEMENTATION.md    # How we implement it
    ├── TEST_SCENARIOS.md    # How we test it
    └── CHANGELOG.md         # Regulatory change history
```

### Code Layer

```
packages/core/src/compliance/
├── types.ts            # Common compliance types
├── validator.ts        # Base validator interface
└── [state]/
    ├── credentials.ts       # Caregiver credential validation
    ├── authorization.ts     # Client authorization validation
    ├── documentation.ts     # Visit documentation validation
    └── __tests__/
        ├── credentials.test.ts
        ├── authorization.test.ts
        └── documentation.test.ts
```

### EVV State Configuration

```
verticals/time-tracking-evv/src/
├── config/
│   └── state-evv-configs.ts    # All state EVV configs
├── providers/
│   ├── texas-evv-provider.ts   # TX-specific provider
│   ├── florida-evv-provider.ts # FL-specific provider
│   └── [state]-evv-provider.ts
└── aggregators/
    ├── sandata-aggregator.ts   # Shared by OH, PA, NC, AZ
    ├── tellus-aggregator.ts    # Shared by GA (and FL)
    └── hhaeexchange-aggregator.ts  # TX (and FL)
```

## Key Compliance Areas

### 1. Caregiver Credentials

Every state requires verification of caregiver credentials, but specifics vary:

- **Background Screening**: Level 1, Level 2, fingerprinting, frequency
- **Professional Licensure**: RN, LPN, CNA, HHA requirements
- **Registry Checks**: State-specific registries (abuse, nurse aide, etc.)
- **Training**: Mandatory training requirements
- **Competency**: Skills validation and delegation

### 2. Client Authorization

Service authorization requirements vary by state and payor:

- **Prior Authorization**: Services requiring pre-approval
- **Plan of Care**: Frequency of review and physician signature
- **Service Limits**: Authorized units and time periods
- **Eligibility**: Medicaid program enrollment

### 3. Visit Documentation

Documentation standards for each visit:

- **Required Elements**: Tasks performed, client response, observations
- **Timeliness**: Documentation completion windows
- **Quality Standards**: Objective vs. subjective notes
- **Signatures**: Electronic vs. wet signatures

### 4. Electronic Visit Verification (EVV)

Federal EVV mandate with state variations:

- **Six Data Elements**: Type, individual receiving, individual providing, date, location, time
- **Aggregators**: State-mandated vs. open choice
- **Geofencing**: GPS requirements and tolerances
- **Grace Periods**: Clock-in/out flexibility
- **Manual Overrides**: Correction procedures

### 5. Data Retention

Varying retention requirements:

- **Federal Minimum**: 6 years (HIPAA)
- **State Requirements**: May be longer (e.g., PA requires 7 years)
- **Record Types**: Different retention for different record types

### 6. Privacy & Security

HIPAA baseline with state variations:

- **Access Control**: Role-based permissions
- **Audit Trails**: PHI access logging
- **Encryption**: Data protection requirements
- **State Privacy Laws**: Additional requirements beyond HIPAA

## Aggregator Reference

### Sandata (4 states)

**States**: Ohio, Pennsylvania, North Carolina, Arizona

**Code Reuse**: Single implementation serves all 4 states

**API**: RESTful, JSON format

**Features**:
- Real-time and batch submission
- Visit status queries
- Comprehensive error handling
- State-specific routing

**Configuration**: `verticals/time-tracking-evv/src/aggregators/sandata-aggregator.ts`

### HHAeXchange (Texas mandated)

**States**: Texas (mandated), Florida (optional)

**API**: RESTful, JSON format

**Features**:
- VMUR (Visit Maintenance Unlock Request) for Texas
- Real-time submission
- Detailed rejection codes

**Configuration**: `verticals/time-tracking-evv/src/aggregators/hhaeexchange-aggregator.ts`

### Tellus (Netsmart)

**States**: Georgia (primary), Florida (optional)

**API**: RESTful, JSON format

**Features**:
- HCBS waiver focus
- Flexible rural exceptions
- Multi-payor support

**Configuration**: `verticals/time-tracking-evv/src/aggregators/tellus-aggregator.ts`

## Testing Philosophy

**Every regulation must have a test.**

### Test-Driven Compliance

1. **Document requirement** in REQUIREMENTS.md with statutory citation
2. **Write test scenario** in TEST_SCENARIOS.md
3. **Implement validator** to make test pass
4. **Verify with stakeholders** that implementation matches regulation
5. **Monitor for changes** and update when regulations change

### Test Coverage Requirements

- **Blocking validations**: 100% coverage (prevents regulatory violations)
- **Warning validations**: 100% coverage (alerts users to issues)
- **Edge cases**: 80% minimum coverage
- **Performance**: Must complete in <100ms per validation

### Continuous Validation

All tests run:
- On every commit (pre-commit hook)
- On every PR (GitHub Actions)
- Nightly (full compliance suite)
- Before deployment (smoke tests)

## Regulatory Change Process

### 1. Monitoring

**Who**: Assigned compliance officer per state  
**Frequency**: Weekly scan of state sources  
**Tools**: Google Alerts, state RSS feeds, industry associations

**Sources**:
- State Medicaid websites
- State registers of regulations
- Agency bulletins
- Industry association updates

### 2. Analysis

**When regulation changes:**

1. **Assess impact**: Critical, high, medium, low
2. **Identify affected components**: List code modules
3. **Determine timeline**: Effective date and implementation window
4. **Estimate effort**: Hours to implement and test

### 3. Implementation

**Git-based change tracking:**

```bash
# Create branch
git checkout -b update/texas-background-check-frequency

# Update documentation
vim docs/compliance/texas/REQUIREMENTS.md
vim docs/compliance/texas/CHANGELOG.md

# Update code
vim packages/core/src/compliance/texas/credentials.ts

# Update tests
vim packages/core/src/compliance/__tests__/texas/credentials.test.ts

# Commit with detailed message
git commit -m "Texas: Background screening now required every 6 months

Updated from annual to semi-annual per 26 TAC §558.353 amendment
effective 2025-03-01.

Changes:
- REQUIREMENTS.md: Updated §1.1 frequency and expiration
- credentials.ts: Changed expiration from 365 to 180 days
- credentials.test.ts: Updated test scenarios

90-day transitional grace period until 2025-05-30.

References:
- Texas Register: Vol 50, No 3
- https://texreg.sos.state.tx.us/..."

# Push and create PR
git push origin update/texas-background-check-frequency
gh pr create --title "Texas: Background screening frequency update" --body "..."
```

### 4. Communication

**Notify customers**:

- Email announcement with effective date
- In-app notification for affected agencies
- Documentation link in help center
- Training session if significant change

**Timeline**:
- 30 days before effective date: Initial notification
- 7 days before: Reminder
- Effective date: Final reminder and system enforcement

## Contributing

### Adding a New State

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for detailed guidelines.

**Quick start**:

1. **Fork the repository**
2. **Copy the template**: `cp -r docs/compliance/_template docs/compliance/[state-name]/`
3. **Research regulations**: Document requirements with citations
4. **Implement validators**: Add to `packages/core/src/compliance/[state]/`
5. **Write tests**: Match TEST_SCENARIOS.md
6. **Update EVV config**: Add to state-evv-configs.ts
7. **Submit PR**: Include documentation and tests

### Updating Existing State

1. **Document the change**: Update CHANGELOG.md first
2. **Update requirements**: Modify REQUIREMENTS.md
3. **Update implementation**: Change validator code
4. **Update tests**: Modify test scenarios
5. **Submit PR**: Reference regulation in commit message

### Review Process

**All compliance PRs require**:

1. **Regulatory citation**: Link to official source
2. **Effective date**: When change takes effect
3. **Test coverage**: 100% for blocking validations
4. **Documentation**: REQUIREMENTS.md and CHANGELOG.md updated
5. **Review by compliance officer**: Domain expert approval

## Resources

### Official Sources

- **CMS EVV Requirements**: https://www.medicaid.gov/medicaid/home-community-based-services/guidance/electronic-visit-verification-evv/index.html
- **21st Century Cures Act**: https://www.congress.gov/bill/114th-congress/house-bill/34
- **State Medicaid Agencies**: Links in each state's REQUIREMENTS.md

### Industry Associations

- **Home Care Association of America (HCAOA)**: https://www.hcaoa.org/
- **National Association for Home Care & Hospice (NAHC)**: https://www.nahc.org/
- **Partnership for Medicaid Home-Based Care**: https://www.medicaidhomecare.org/

### Care Commons Resources

- **GitHub Repository**: https://github.com/neighborhood-lab/care-commons
- **Community Forum**: https://github.com/neighborhood-lab/care-commons/discussions
- **Issue Tracker**: https://github.com/neighborhood-lab/care-commons/issues
- **Documentation**: https://docs.carecommons.org (coming soon)

## Roadmap

### Q1 2025
- [x] Texas compliance documentation ✅
- [x] Florida compliance documentation ✅
- [ ] Ohio compliance documentation 🚧
- [ ] Pennsylvania compliance documentation 🚧

### Q2 2025
- [ ] Georgia compliance documentation
- [ ] North Carolina compliance documentation
- [ ] Arizona compliance documentation
- [ ] Automated regulatory monitoring script

### Q3 2025
- [ ] New York compliance documentation
- [ ] California compliance documentation
- [ ] Illinois compliance documentation
- [ ] Regulatory change notification system

### Q4 2025
- [ ] Additional 10 states based on community demand
- [ ] Machine-readable compliance rules (JSON schema)
- [ ] Automated compliance reporting dashboard

## Support

### Questions?

- **General questions**: Open a GitHub Discussion
- **Bug reports**: Open a GitHub Issue
- **Regulatory interpretation**: Tag with `compliance` label
- **New state requests**: Tag with `state-request` label

### Commercial Support

For agencies needing dedicated compliance support:
- **Regulatory consulting**: Domain experts available
- **Custom state implementation**: Priority development
- **Training and onboarding**: Staff training sessions
- **Audit preparation**: Compliance documentation support

Contact: **support@carecommons.org**

---

**Care Commons** - Shared care software, community owned  
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
