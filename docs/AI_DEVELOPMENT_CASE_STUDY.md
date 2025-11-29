# Folk: AI-Assisted Development Case Study

## Executive Summary

Folk is a production-ready home healthcare management platform built in 28 days using AI-assisted development (Claude). This document provides verifiable metrics and insights from the development process.

## Key Metrics (As of November 25, 2025)

### Development Timeline
| Metric | Value |
|--------|-------|
| First Commit | October 28, 2025 |
| Production Ready | November 25, 2025 |
| **Total Development Time** | **28 days** |

### Code Metrics
| Metric | Value |
|--------|-------|
| Total Commits | 1,505 |
| Pull Requests Merged | 330 |
| Total Files | 1,529 |
| Total Lines of Code | 381,049 |
| TypeScript/TSX Source Lines | 209,774 |
| Test Suites Passing | 2,954 tests |

### File Breakdown
| Type | Count |
|------|-------|
| TypeScript (.ts) | 865 |
| React Components (.tsx) | 291 |
| Documentation (.md) | 130 |
| Configuration (.json) | 79 |
| Shell Scripts (.sh) | 32 |
| GitHub Workflows (.yml) | 22 |

### Architecture Scope
- **Monorepo**: Turborepo with 6 packages
- **Verticals**: 15 domain modules (scheduling, billing, EVV, etc.)
- **Mobile App**: React Native (Expo) with EVV functionality
- **API**: Express.js with 50+ endpoints
- **Database**: PostgreSQL with 48 migrations

## What Makes This Significant

### 1. Production-Ready, Not a Demo
- Deployed to Vercel with CI/CD
- Real database (Neon PostgreSQL)
- Multi-tenant architecture
- Role-based access control
- HIPAA-aligned security patterns

### 2. Healthcare Domain Complexity
- Electronic Visit Verification (EVV) - Cures Act compliant
- State-specific compliance (Texas, Florida, Ohio, Pennsylvania)
- 15 integrated verticals (scheduling, billing, payroll, etc.)
- Audit trail for all PHI access

### 3. Enterprise-Grade Quality
- TypeScript strict mode throughout
- 2,954 automated tests
- ESLint with zero tolerance for errors
- Pre-commit hooks enforced
- Comprehensive documentation

## Development Process Insights

### What AI Excels At
1. **Boilerplate generation** - CRUD operations, type definitions, test scaffolding
2. **Pattern application** - Once shown a pattern, consistent replication across modules
3. **Code transformation** - Migrations, refactoring, format changes
4. **Documentation** - API docs, README files, inline comments
5. **Test writing** - Unit tests, integration tests, edge case coverage

### Where Human Judgment Was Essential
1. **Architecture decisions** - Monorepo structure, package boundaries
2. **Domain expertise** - Healthcare regulations, EVV requirements
3. **Priority setting** - What to build first, what to defer
4. **Trade-off analysis** - When "good enough" beats "perfect"
5. **Security review** - Authentication, authorization, data protection

### Challenges Encountered
1. **ESM vs CommonJS** - Required deep understanding of module systems
2. **Vercel deployment** - Serverless function configuration quirks
3. **Database migrations** - Order-dependent schema changes
4. **State management** - Complex multi-step workflows

## Traditional Development Comparison

### Estimated Traditional Timeline
For equivalent scope with a traditional development approach:
- **Team size**: 3-5 engineers + 1 PM + 1 Designer
- **Timeline**: 6-12 months
- **Cost**: $500K - $1M+ (salaries, benefits, overhead)

### AI-Assisted Approach
- **Team size**: 1 human + AI
- **Timeline**: 28 days
- **Cost**: ~$2,000 (API costs) + human time

### Quality Comparison
| Aspect | Traditional | AI-Assisted |
|--------|-------------|-------------|
| Test Coverage | Varies by team | 2,954 tests |
| Documentation | Often deferred | Generated alongside code |
| Code Consistency | Requires style guides | Naturally consistent |
| Refactoring | Time-consuming | Rapid and confident |

## Verification

All metrics in this document can be independently verified:
- **GitHub Repository**: [neighborhood-lab/folkcare](https://github.com/neighborhood-lab/folkcare)
- **Live Demo**: [Showcase](https://folk.care/)
- **Production**: [folk.care](https://folk.care)

Run locally to verify:
```bash
git clone https://github.com/neighborhood-lab/folkcare
cd folkcare
npm install
npm run test     # Run all tests
npm run build    # Build all packages
npm run lint     # Check code quality
```

## Lessons Learned

### For AI-Assisted Development
1. **Invest in prompts** - Clear instructions yield better results
2. **Maintain context** - AGENTS.md file with domain knowledge
3. **Trust but verify** - Review AI output, especially security-related
4. **Iterate rapidly** - Small commits, frequent validation
5. **Document patterns** - AI learns from existing code

### For Healthcare Software
1. **Compliance first** - Build audit trails from day one
2. **Multi-tenant security** - Organization scoping in every query
3. **State variations** - Abstract early for regulatory differences
4. **Offline capability** - Field workers need reliable apps

## What's Next

Folk is open source under MIT license. Contributions welcome:
- Bug reports and fixes
- Documentation improvements
- Feature requests
- Vertical implementations
- State-specific compliance modules

## Contact

- **Project Lead**: Brian Edwards (brian.mabry.edwards@gmail.com)
- **Organization**: Neighborhood Lab (https://neighborhoodlab.org)
- **Repository**: https://github.com/neighborhood-lab/folkcare

---

*Last updated: November 25, 2025*
*Metrics automatically verified via GitHub*
