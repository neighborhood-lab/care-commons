---
title: "AI-Assisted Development: What It Actually Is"
subtitle: "Separating the hype from the practice"
scheduled_date: 2025-12-06
image_prompt: "Flat illustration showing code editor with AI suggestions highlighted, verification checkmarks, terminal output, warm earth tones (orange, brown, cream, olive green), technical and precise aesthetic, simple geometric shapes"
tags: [technical, ai, development]
category: Technical
---

# AI-Assisted Development: What It Actually Is

On November 19, 2025, an Anthropic employee posted on r/vibecoding that "software engineering could be dead by next year." The same week, Bayada Home Health Care announced an AI partnership for fall prevention, and HHS launched a $2 million AI initiative for caregiving technology.

These three data points represent the current state of AI in software: hyperbolic claims from insiders, cautious enterprise adoption in healthcare, and government money flowing toward automation. What's actually happening?

This article explains AI-assisted development from first principles, using Care Commons—a home healthcare platform I built over 28 days—as a concrete reference point. The goal is precision, not persuasion.

---

## Definitions

**AI-assisted development** means using large language models (LLMs) during the software development process. This includes code generation, debugging, documentation, test writing, and refactoring.

**Vibe coding** is a colloquial term that emerged in 2024 for a specific workflow: describing desired behavior to an AI in natural language and accepting the generated code with minimal modification. The term implies low-rigor development.

**Traditional development** means writing code manually, using AI only for autocomplete or search (if at all).

These are points on a spectrum, not discrete categories. Most working developers today operate somewhere between traditional and AI-assisted, depending on the task.

---

## What LLMs Actually Do

LLMs are statistical models trained on text. When applied to code, they predict likely token sequences based on context. This has specific strengths and limitations.

**Strengths:**

1. **Pattern matching.** Given examples of a pattern, LLMs replicate it consistently. If your codebase has 10 API endpoints following a specific structure, the LLM will generate the 11th endpoint in the same structure.

2. **Documentation recall.** LLMs have ingested most public documentation. They can generate code using library APIs without requiring you to look up syntax.

3. **Boilerplate generation.** Repetitive code (CRUD operations, type definitions, test scaffolding) is exactly the kind of predictable output LLMs excel at.

4. **Translation.** Converting between equivalent representations—callbacks to promises, one framework to another, code to documentation—is pattern matching.

**Limitations:**

1. **No verification.** LLMs cannot execute code or prove correctness. They generate plausible output, not verified output.

2. **No domain knowledge.** LLMs don't understand your business requirements, regulatory constraints, or system architecture unless you explicitly provide that context.

3. **Hallucination.** LLMs sometimes generate code using APIs that don't exist or patterns that look correct but aren't.

4. **Context window.** LLMs can only consider limited context. Large codebases exceed this limit, causing inconsistency.

Understanding these properties explains both why AI-assisted development works and why it fails.

---

## The Care Commons Case

Care Commons is a home healthcare management platform. It handles Electronic Visit Verification (EVV), caregiver scheduling, compliance tracking, billing, and mobile visit documentation.

Development started October 28, 2025. Production deployment occurred November 25, 2025.

**Metrics (verifiable at github.com/neighborhood-lab/care-commons):**

| Metric | Value |
|--------|-------|
| Calendar days | 28 |
| Total commits | 1,500+ |
| Lines of code | 381,049 |
| TypeScript source | 209,774 lines |
| Automated tests | 3,154 |
| Database migrations | 48 |
| Domain modules | 15 |

These numbers require context to be meaningful.

**What "381,049 lines" includes:**

- Application code (TypeScript, React components)
- Test files (roughly 30% of total)
- Configuration (package.json, tsconfig, eslint)
- Documentation (markdown files)
- Generated types and schemas

**What "28 days" means:**

- Full-time effort (8-12 hours/day)
- Solo developer with 15+ years experience
- Prior domain expertise in healthcare IT
- AI assistance throughout

The relevant comparison isn't "could a human type this much code in 28 days?" (obviously not). It's "what would equivalent output require with traditional development?"

---

## Estimating Traditional Development

Scoping healthcare software is notoriously difficult because requirements emerge during development. However, some calibration points exist:

**Industry benchmarks:**

- A skilled developer produces 10-50 lines of production code per day (after tests, reviews, debugging)
- Healthcare IT projects typically take 2-3x longer than initial estimates due to compliance requirements
- Enterprise home health software (like HHAeXchange or Sandata) took years and large teams to build

**Rough estimate for Care Commons scope:**

A traditional team would likely need:
- 3-5 engineers
- 6-12 months
- $500K-$1M in salary costs

This estimate has wide error bars. The point is order-of-magnitude difference, not precise prediction.

---

## Where AI Added Value

Here are specific categories where AI assistance accelerated development:

### 1. CRUD Operations

Care Commons has 15 domain modules (scheduling, billing, EVV, etc.). Each module needs:
- Database schema and migrations
- Repository layer (data access)
- Service layer (business logic)
- API routes (HTTP endpoints)
- Type definitions
- Tests

Once the pattern was established in the first module, AI generated subsequent modules with high consistency. Human effort shifted from writing code to reviewing code.

### 2. Test Generation

Given a function signature and description, AI generates comprehensive test suites. Example prompt:

> Write tests for getCaregiverComplianceStatus. It takes organizationId and caregiverId, returns { canSchedule: boolean, blockingIssues: string[], warnings: string[] }. Blocking issues are expired credentials that prevent scheduling. Warnings are credentials expiring within 30 days.

AI output: 6-10 test cases covering happy path, edge cases, error conditions. Human review catches missing cases or incorrect assertions, but the scaffolding is done.

3,154 tests in 28 days would be impossible without this leverage.

### 3. Documentation

AI generates documentation alongside code. API endpoints get OpenAPI specs. Functions get JSDoc comments. READMEs get updated. This happens in the same pass as implementation, not as deferred work.

### 4. Refactoring

Renaming, extracting, restructuring—these are mechanical transformations that AI handles quickly. "Extract this validation logic into a separate function" or "rename userId to caregiverId across all files" completes in seconds instead of error-prone find-replace.

---

## Where AI Did Not Help

### 1. Architecture

The monorepo structure, package boundaries, deployment configuration, and database design were human decisions. AI implemented whatever architecture was described, but couldn't evaluate whether it was appropriate.

Example: I chose Turborepo for build orchestration. AI would have equally implemented Nx, Lerna, or no monorepo tooling. The choice required understanding deployment targets (Vercel), team size (one), and maintenance priorities.

### 2. Regulatory Compliance

Care Commons must comply with:
- HIPAA (health data privacy)
- 21st Century Cures Act (EVV requirements)
- State-specific regulations (Texas 26 TAC §558, Florida Chapter 59A-8)

AI doesn't know these regulations unless explicitly told. More importantly, AI can't identify when generated code violates regulations. A function that stores PHI without encryption looks syntactically identical to one that encrypts properly.

Domain expertise is the verification layer.

### 3. Security

AI generates code that appears secure—parameterized queries, input validation, authentication checks. But security requires adversarial thinking: "How would an attacker exploit this?"

Every authentication flow, permission check, and data access pattern required human review for security properties that AI cannot evaluate.

### 4. Prioritization

What to build first? What to defer? What's the minimum viable feature set? These are product decisions that require understanding business context, user needs, and resource constraints. AI implements priorities; it doesn't set them.

---

## Why "Vibe Coding" Fails

The r/vibecoding subreddit (102,000 members) contains many failure reports. Common patterns:

**1. No verification layer.**

Accepting AI output without review produces code that works for the demonstrated case and fails elsewhere. Without tests, failures surface in production.

**2. No domain expertise.**

If you can't evaluate whether generated code is correct for your domain, you can't distinguish working code from plausible-looking garbage.

**3. Exceeding context limits.**

Large projects exceed LLM context windows. AI loses track of earlier decisions, generating inconsistent code. Without human architectural memory, the codebase becomes incoherent.

**4. Compounding errors.**

AI debugging AI-generated code often introduces new bugs. Without the ability to reason about code, error correction becomes random mutation.

These failure modes share a common cause: treating AI as autonomous rather than assistive.

---

## The Actual Workflow

Here's how AI-assisted development works in practice:

**1. Context loading.**

I maintain an `AGENTS.md` file (4,000+ lines) containing:
- Domain knowledge (healthcare regulations, terminology)
- Architecture decisions and rationale
- Coding standards and patterns
- Project structure and conventions

AI reads this before generating code. Context is the input that shapes output quality.

**2. Task specification.**

Prompts describe outcomes, not implementations:

> "Add compliance checking to visit scheduling. Before a visit can be created, verify the assigned caregiver has valid credentials. Block scheduling if any credential is expired. Return specific reasons for blocking."

AI generates implementation. Human reviews for correctness.

**3. Verification.**

Every commit runs:
- Linting (code style)
- Type checking (TypeScript)
- Tests (3,154 automated tests)
- Build (production compilation)

AI-generated code that fails checks gets fixed before merge. The verification layer catches AI errors.

**4. Incremental commits.**

Small changes, frequent commits. Average PR is ~50 lines. Problems surface quickly and scope is limited.

---

## Cost Analysis

**AI-assisted (Care Commons):**

| Item | Cost |
|------|------|
| Claude API (28 days) | ~$2,000 |
| Vercel (hosting) | $20/month |
| Neon (database) | $0 (free tier) |
| Human time (28 days) | Opportunity cost |

**Traditional estimate (equivalent scope):**

| Item | Cost |
|------|------|
| 4 engineers × 9 months × $150K/year | $450,000 |
| Project management | $50,000+ |
| Infrastructure | Comparable |

The 100x cost difference is real but requires qualification: traditional development might produce more robust architecture, better documentation of decisions, and knowledge distributed across a team rather than concentrated in one person.

AI-assisted development trades team resilience for speed and cost. Whether that tradeoff makes sense depends on context.

---

## Implications

**For individual developers:**

AI-assisted development extends what one person can build. Projects that required teams become feasible for individuals. The constraint shifts from implementation capacity to domain expertise and architectural judgment.

**For teams:**

AI accelerates certain tasks (boilerplate, tests, documentation) but doesn't eliminate coordination overhead. Small teams may benefit more than large teams, where communication costs dominate.

**For hiring:**

If AI handles implementation, value shifts toward:
- Domain expertise (validating correctness)
- Architecture (designing systems)
- Security (adversarial thinking)
- Product judgment (prioritization)

Pure coding speed becomes less differentiating.

**For healthcare IT specifically:**

The home healthcare software market is dominated by expensive enterprise vendors (HHAeXchange, Sandata, AlayaCare). If AI reduces development costs by 10-100x, market dynamics may shift toward smaller vendors and open-source alternatives.

Care Commons is a test of this hypothesis.

---

## What This Isn't

This article is not claiming:

- AI replaces software engineers (it doesn't)
- Anyone can build production software with AI (domain expertise still required)
- Vibe coding is a good practice (low-rigor development fails)
- Care Commons proves anything definitive (sample size of one)

The claim is narrower: AI-assisted development, done rigorously, produces real output faster than traditional development. The Care Commons metrics are verifiable. The tradeoffs are real.

---

## Verification

All claims in this article can be verified:

- **Repository:** github.com/neighborhood-lab/care-commons
- **Live demo:** neighborhood-lab.github.io/care-commons/
- **Production:** care-commons.vercel.app

Run locally:
```bash
git clone https://github.com/neighborhood-lab/care-commons
cd care-commons
npm install
npm run test     # 3,154 tests
npm run build    # Production build
npm run lint     # Code quality
```

---

*Brian Edwards builds Care Commons with Neighborhood Lab. Contact: brian.mabry.edwards@gmail.com*
