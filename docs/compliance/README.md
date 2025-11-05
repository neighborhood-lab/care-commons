# State Compliance Documentation

**Regulations as Code for Home Healthcare Compliance**

> "Reading Texas HHSC regulations at 2 AM shouldn't be necessary. The compliance rules should be encoded in the software itself." — Care Commons Philosophy

## Quick Links

- **[Master Index](./index.md)** - State coverage matrix and roadmap
- **[Project Summary](./PROJECT_SUMMARY.md)** - Complete implementation overview
- **[Template](./template/)** - Start here to document a new state
- **[Texas](./texas/)** - Reference implementation (strict state)
- **[Florida](./florida/)** - Reference implementation (lenient state)

## What is This?

This directory contains comprehensive regulatory compliance documentation for all 50 US states. Each state has:

1. **REQUIREMENTS.md** - What regulations require (with statutory citations)
2. **IMPLEMENTATION.md** - How Care Commons implements it (code + config)
3. **TEST_SCENARIOS.md** - How we test it (comprehensive test cases)
4. **CHANGELOG.md** - When regulations change (git-tracked history)

This approach transforms regulations into **testable, verifiable, audit-ready code**.

## Why This Matters

### For Home Health Agencies
- ✅ **Confidence**: Know you're meeting state requirements
- ✅ **Audit-Ready**: Complete documentation for surveys
- ✅ **Cost Savings**: Reduce compliance consultant expenses
- ✅ **Risk Mitigation**: Automated validation prevents violations

### For Developers
- ✅ **Clear Requirements**: No ambiguity in what to implement
- ✅ **Test-Driven**: Automated verification of compliance
- ✅ **Extensible**: Easy to add new states
- ✅ **Maintainable**: Consistent patterns across states

### For the Care Commons Community
- ✅ **Contribution Framework**: Anyone with domain knowledge can add states
- ✅ **Quality Standards**: Template ensures consistency
- ✅ **Change Tracking**: Git history shows regulatory diligence
- ✅ **Best-in-Class**: Industry-leading compliance documentation

## How to Use

### I'm an Agency Using Care Commons

**Check Your State's Compliance:**
1. Navigate to your state directory (e.g., `texas/` or `florida/`)
2. Read `REQUIREMENTS.md` to understand what regulations apply
3. Review `IMPLEMENTATION.md` to see how Care Commons handles it
4. Check `CHANGELOG.md` for recent regulatory changes

**Stay Updated:**
- Watch this repository for changes (GitHub Watch button)
- Review your state's CHANGELOG.md quarterly
- Subscribe to GitHub notifications for your state's label

### I'm a Developer

**Implementing a Feature:**
1. Check relevant state REQUIREMENTS.md for regulatory context
2. Review IMPLEMENTATION.md for current implementation
3. Run tests to verify compliance logic
4. Update documentation if requirements change

**Adding a New State:**
1. Copy `_template/` to your state name (e.g., `ohio/`)
2. Research state regulations thoroughly
3. Complete all 4 documents with citations
4. Implement validators in `packages/core/src/compliance/[state]/`
5. Write comprehensive tests
6. Submit PR with all documentation and code

**Step-by-step guide**: See [Contributing](#contributing) below

### I'm a Compliance Officer

**Preparing for Survey/Audit:**
1. Print your state's REQUIREMENTS.md
2. Review IMPLEMENTATION.md for system capabilities
3. Run compliance reports from Care Commons
4. Provide CHANGELOG.md showing regulatory tracking

**Verifying Compliance:**
1. Review REQUIREMENTS.md for current regulations
2. Check statutory citations are accurate
3. Verify IMPLEMENTATION.md matches requirements
4. Run test suite to validate logic
5. Review audit trail and logging

## State Status

### ✅ Completed (Reference Implementations)

| State | Requirements | Implementation | Tests | Notes |
|-------|--------------|----------------|-------|-------|
| **Texas** | ✅ Complete | ✅ Documented | 🚧 Planned | HHAeXchange aggregator, VMUR process |
| **Florida** | ✅ Complete | 🚧 Planned | 🚧 Planned | Multi-aggregator model, lenient policies |

### 🚧 In Progress

| State | Status | Priority | Aggregator | Market Size |
|-------|--------|----------|------------|-------------|
| Ohio | Planned | High | Sandata (FREE) | 5,000+ agencies |
| Pennsylvania | Planned | High | Sandata (FREE) | 8,000+ agencies |

### 📋 Planned

| State | Priority | Aggregator | Market Size | Notes |
|-------|----------|------------|-------------|-------|
| Georgia | Medium | Tellus | 6,000+ | Most lenient rural policies |
| North Carolina | Medium | Sandata (FREE) | 5,000+ | Managed care focus |
| Arizona | Medium | Sandata (FREE) | 4,000+ | NO LICENSE REQUIRED for non-medical |

### 🔮 Future (Community-Driven)

Remaining 43 states will be prioritized based on:
1. **Community Demand** - GitHub issues and votes
2. **Market Size** - Number of agencies
3. **Regulatory Complexity** - Unique requirements
4. **Contributor Availability** - Domain expertise

**Request a state**: Open a [GitHub issue](https://github.com/neighborhood-lab/care-commons/issues/new) with tag `state-request`

## Document Structure

### REQUIREMENTS.md

**Purpose**: Human-readable regulatory requirements with statutory citations

**Sections**:
1. Caregiver Credentials (background checks, licenses, registries)
2. Client Authorization (service auth, plan of care)
3. Visit Documentation (required fields, timeliness)
4. Electronic Visit Verification (EVV mandate, aggregator, geofence)
5. Data Retention (years required by regulation)
6. Privacy & Security (HIPAA + state laws)
7. Reporting Requirements (incident reporting)
8. State Programs (Medicaid programs, waivers)

**Key Elements**:
- **Statutory Authority**: Specific laws/regulations cited
- **Requirement**: What must be done
- **Frequency**: How often (at hire, annual, etc.)
- **Implementation**: Database fields and validation rules
- **Test Scenarios**: Specific test cases
- **Edge Cases**: Complex situations
- **Related Requirements**: Cross-references

### IMPLEMENTATION.md

**Purpose**: How Care Commons implements each requirement in code

**Sections**:
1. Implementation Status (what's done, what's planned)
2. Code Structure (validator classes, configuration)
3. Database Schema Extensions (state-specific fields)
4. API Endpoints (state-specific routes)
5. Testing Strategy (test file locations)
6. Configuration (environment variables)
7. Deployment Checklist (dev, staging, production)
8. Known Limitations (what's not automated)
9. Future Enhancements (planned improvements)

**Key Elements**:
- **Code Examples**: TypeScript implementation samples
- **Configuration**: State-specific settings
- **Test References**: Links to test files
- **Deployment Notes**: Production considerations

### TEST_SCENARIOS.md

**Purpose**: Comprehensive test cases for every regulation

**Format**:
```markdown
#### Test Case: EMR-001 - No EMR Check on File
**Requirement**: [Link to REQUIREMENTS.md]
**Priority**: High
**Type**: Blocking Validation

**Given**: Caregiver with no EMR check
**When**: Attempt to assign to visit
**Then**: 
- Assignment blocked
- Error: "No Employee Misconduct Registry check on file"
- Citation: "26 TAC §558.353"
- Remediation: "Perform EMR search"

**Test Data**: [TypeScript test data]
**Assertion**: [Expected test result]
```

**Categories**:
- Blocking validations (prevent regulatory violations)
- Warning validations (alert but allow)
- Edge cases (complex scenarios)
- Performance tests (speed requirements)
- Integration tests (end-to-end workflows)

### CHANGELOG.md

**Purpose**: Track regulatory changes over time via git

**Format**:
```markdown
## 2025-03-15 - EMR Check Frequency Change

### Change Description
Texas HHSC amended 26 TAC §558.353 to require EMR checks 
every 6 months instead of annually.

### Effective Date
2025-05-01 (90-day implementation window)

### Impact Analysis
- Severity: High
- Affected: EMR validation logic
- Customer Impact: 47% of caregivers need re-verification
- Breaking Change: Yes

### Implementation Changes
- Updated expiration from 365 to 180 days
- Modified tests
- Updated documentation

### References
- Texas Register: Vol XX, No X
- HHSC Bulletin: 2025-001
```

**Benefits**:
- Git history shows regulatory diligence
- Audit trail for compliance reviews
- Impact analysis for each change
- Customer communication templates

## Contributing

### Adding a New State (Step-by-Step)

#### 1. Claim the State
Open a GitHub issue: "Document [STATE] Compliance Requirements"
- Tag: `compliance`, `state-request`
- Assign yourself
- Mention estimated completion date

#### 2. Set Up Documentation

```bash
# Copy template to state directory
cp -r docs/compliance/_template docs/compliance/[state-name]/

# Example for Ohio:
cp -r docs/compliance/_template docs/compliance/ohio/
```

State directory names should be:
- Lowercase
- Full state name (not abbreviation)
- Hyphenated if multi-word (e.g., `north-carolina`)

#### 3. Research Regulations

**Essential Sources**:
- State Medicaid website
- State home health licensing regulations
- State administrative code (home health chapter)
- State EVV policy documents
- Background screening requirements
- Nurse aide registry requirements

**Key Information to Gather**:
- Caregiver credential requirements
- Authorization processes
- Documentation standards
- EVV aggregator and requirements
- Data retention periods
- Incident reporting procedures

**Document Everything With Citations**:
- Statute/regulation number
- Section/subsection
- URL to official source
- Last verified date

#### 4. Complete REQUIREMENTS.md

Follow the template structure exactly:

```markdown
# [STATE] Home Healthcare Compliance Requirements

**State Code**: [XX]
**Last Updated**: [YYYY-MM-DD]
**Verified By**: [Your Name/Organization]
**Next Review Date**: [YYYY-MM-DD + 90 days]

## 1. Caregiver Credentials

### 1.1 Background Screening

**Statutory Authority:**
- [State Code §X.XXX]
- [Link to official source]

**Requirement:**
[Detailed requirement description]

**Frequency:**
- Initial: [When]
- Renewal: [How often]

**Implementation:**
```typescript
// Database fields
[field_name]: [type]

// Validation rules
- BLOCKING: [What prevents action]
- WARNING: [What alerts user]
```

**Test Scenarios:**
- [ ] [Scenario 1]
- [ ] [Scenario 2]
```

**Tips**:
- Be specific, not vague
- Include exact regulatory citations
- Provide implementation guidance
- Think about edge cases
- Add test scenarios

#### 5. Complete IMPLEMENTATION.md

Show how each requirement translates to code:

```typescript
export class [State]ComplianceValidator extends BaseComplianceValidator {
  readonly state: StateCode = '[XX]';
  
  protected readonly credentialConfig: StateCredentialConfig = {
    // State-specific configuration
  };
  
  // State-specific validation methods
}
```

**Sections to Complete**:
- Implementation status checklist
- Validator class structure
- EVV provider implementation
- Database schema extensions
- Test file references
- Configuration requirements
- Deployment checklist

#### 6. Complete TEST_SCENARIOS.md

Write comprehensive test cases:

```markdown
#### Test Case: BG-001 - No Background Check

**Given**: Caregiver with no background check
**When**: Assign to visit
**Then**: Blocked with error message

**Test Data**:
```typescript
const caregiver = { 
  background_check_date: null 
};
```

**Assertion**:
```typescript
expect(result.canProceed).toBe(false);
expect(result.issues[0].type).toBe('[STATE]_BACKGROUND_MISSING');
```
```

**Coverage Requirements**:
- All blocking validations: 100%
- All warning validations: 100%
- Edge cases: 80% minimum

#### 7. Complete CHANGELOG.md

Initialize with:
- Initial documentation entry
- Monitoring sources
- Alert triggers
- Contact information
- Historical context (if available)

#### 8. Implement Validators

Create state-specific validator:

```bash
# Create state directory
mkdir -p packages/core/src/compliance/[state]

# Create validator file
touch packages/core/src/compliance/[state]/credentials.ts
```

Extend `BaseComplianceValidator`:

```typescript
import { BaseComplianceValidator } from '../base-validator.js';

export class [State]ComplianceValidator extends BaseComplianceValidator {
  readonly state: StateCode = '[XX]';
  
  // Implement state-specific methods
}
```

#### 9. Write Tests

Create test file:

```bash
mkdir -p packages/core/src/compliance/__tests__/[state]
touch packages/core/src/compliance/__tests__/[state]/credentials.test.ts
```

Write tests matching TEST_SCENARIOS.md:

```typescript
describe('[STATE] Caregiver Credentials', () => {
  const validator = new [State]ComplianceValidator();
  
  it('blocks assignment if no background check on file', async () => {
    // Test implementation matching TEST_SCENARIOS.md
  });
});
```

**All tests must pass before submitting PR.**

#### 10. Update EVV Configuration

If state has EVV requirements:

```typescript
// verticals/time-tracking-evv/src/config/state-evv-configs.ts

[XX]: {
  state: '[XX]',
  aggregatorType: '[AGGREGATOR]',
  aggregatorEndpoint: '[URL]',
  gracePeriodMinutes: [X],
  geofenceRadiusMeters: [X],
  geofenceToleranceMeters: [X],
  retryPolicy: EXPONENTIAL_BACKOFF,
  statePrograms: [
    '[PROGRAM_1]',
    '[PROGRAM_2]',
  ],
  stateDepartment: '[AGENCY]',
}
```

#### 11. Update Master Index

Add your state to `docs/compliance/index.md`:

```markdown
### Priority X: In Progress

| State | Code | Aggregator | Market Size | Documentation | Implementation | Tests |
|-------|------|------------|-------------|---------------|----------------|-------|
| [State] | [XX] | [Aggregator] | [Size] | ✅ | 🚧 | ⏳ |
```

#### 12. Run Validation

```bash
# Build
npm run build

# Type check
npm run typecheck

# Lint
npm run lint

# Test
npm test

# Full check
./scripts/check.sh
```

**All checks must pass.**

#### 13. Submit Pull Request

```bash
git checkout -b compliance/[state]
git add docs/compliance/[state]/
git add packages/core/src/compliance/[state]/
git commit -m "[STATE]: Add compliance documentation and validators

- Comprehensive regulatory documentation
- State-specific validators
- [X] test scenarios
- EVV configuration

References:
- [State Regulation X]
- [State Regulation Y]
"
git push origin compliance/[state]
gh pr create --title "[STATE]: Compliance Documentation" --body "..."
```

**PR Requirements**:
- [ ] All 4 documentation files complete
- [ ] Regulatory citations accurate
- [ ] Validators implemented
- [ ] Tests written and passing
- [ ] EVV config added (if applicable)
- [ ] Master index updated
- [ ] All CI checks passing

#### 14. Review Process

PRs reviewed by:
1. **Compliance Team**: Regulatory accuracy
2. **Technical Team**: Code quality
3. **Domain Expert**: State-specific knowledge (if available)

**Approval requires**:
- Regulatory citations verified
- Implementation matches requirements
- Tests comprehensive
- Documentation clear

### Quality Standards

**Documentation**:
- ✅ Specific, not vague
- ✅ Regulatory citations for all requirements
- ✅ Implementation guidance clear
- ✅ Edge cases considered
- ✅ Professional writing style

**Code**:
- ✅ TypeScript strict mode
- ✅ Extends BaseComplianceValidator
- ✅ Comprehensive error messages
- ✅ Regulatory citations in issues
- ✅ Production-grade quality

**Tests**:
- ✅ 100% coverage of blocking validations
- ✅ Matches TEST_SCENARIOS.md
- ✅ Deterministic (no flaky tests)
- ✅ Proper mocking
- ✅ Clear assertion messages

## Common Questions

### How do I find state regulations?

**Start with**:
1. State Medicaid website (search "[state] medicaid home health")
2. State licensing board (search "[state] home health license")
3. State administrative code (search "[state] administrative code home health")
4. State EVV information (search "[state] EVV policy")

**Common Patterns**:
- Most states publish administrative code online
- Medicaid manuals available on state websites
- EVV policies often in separate documents
- Licensing requirements in health/human services code

### What if a state has unique requirements?

**That's expected!** Every state is different. Document the unique requirements clearly:

1. In REQUIREMENTS.md: Explain what makes it unique
2. In IMPLEMENTATION.md: Show state-specific implementation
3. In validators: Use state-specific extension methods
4. In tests: Test the unique scenarios

**Examples of unique requirements**:
- Texas VMUR process (no other state has this)
- Florida multi-aggregator model (most states single)
- Arizona non-medical exemption (unique)

### How often should regulations be reviewed?

**Review Schedule**:
- **Weekly**: Monitor state alerts and bulletins
- **Monthly**: Scan state register for proposed rules
- **Quarterly**: Review state website for policy updates
- **Annually**: Full review of all regulations

**When regulations change**:
1. Update REQUIREMENTS.md
2. Update CHANGELOG.md with change details
3. Update validators if logic changes
4. Update tests if scenarios change
5. Submit PR with regulatory citation

### What if I'm not sure about a regulation?

**Options**:
1. **Contact the state agency**: Most have provider support lines
2. **Consult industry associations**: State home care associations
3. **Review survey findings**: Common deficiencies indicate areas of focus
4. **Ask the community**: Open GitHub discussion
5. **Mark as uncertain**: Document what's unclear, research further

**In REQUIREMENTS.md**:
```markdown
**Note**: This requirement interpretation is uncertain. 
State code §X.XX is ambiguous regarding [issue].
Recommended: Contact [State Agency] for clarification.
Last attempted: [Date]
```

### Can I contribute if I'm not a developer?

**Yes!** We need domain experts who understand regulations:

**Non-developer contributions**:
- Research and document state requirements
- Verify regulatory citations
- Review existing documentation for accuracy
- Provide real-world operational context
- Test documentation clarity
- Report regulatory changes

**Process**:
1. Open GitHub issue describing your expertise
2. Claim a state to document
3. Complete REQUIREMENTS.md and CHANGELOG.md
4. Submit PR (developer will help with implementation)
5. Review technical implementation for accuracy

## Resources

### Federal Regulations
- **21st Century Cures Act**: https://www.congress.gov/bill/114th-congress/house-bill/34
- **CMS EVV**: https://www.medicaid.gov/medicaid/home-community-based-services/guidance/electronic-visit-verification-evv/index.html
- **HIPAA**: https://www.hhs.gov/hipaa/index.html
- **Medicare CoP**: https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-484

### State Resources
- **State Medicaid Agencies**: See index.md for links
- **NASUAD** (aging/disability): https://www.nasuad.org/
- **National Conference of State Legislatures**: https://www.ncsl.org/

### Industry Associations
- **Home Care Association of America**: https://www.hcaoa.org/
- **National Association for Home Care & Hospice**: https://www.nahc.org/
- **Partnership for Medicaid Home-Based Care**: https://www.medicaidhomecare.org/

### Care Commons
- **GitHub Repository**: https://github.com/neighborhood-lab/care-commons
- **Discussions**: https://github.com/neighborhood-lab/care-commons/discussions
- **Issues**: https://github.com/neighborhood-lab/care-commons/issues
- **Contributing Guide**: [../../CONTRIBUTING.md](../../CONTRIBUTING.md)

## Support

### Questions?
- **General**: Open a GitHub Discussion
- **Bug Reports**: Open a GitHub Issue
- **Regulatory Interpretation**: Tag with `compliance` label
- **New State Request**: Tag with `state-request` label

### Commercial Support
For agencies needing dedicated compliance support:
- Regulatory consulting
- Custom state implementation
- Staff training
- Audit preparation

Contact: **support@carecommons.org**

---

**Care Commons** - Shared care software, community owned  
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
