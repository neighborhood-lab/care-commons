---
title: "Vibe Coding Is Real, But Not What Reddit Thinks"
subtitle: "Building production healthcare software with AI in 28 days"
scheduled_date: 2025-12-06
image_prompt: "Flat illustration showing a developer and an AI assistant represented as a friendly robot working together at a desk, code symbols flowing between them, healthcare symbols (heart, cross) in the background, warm earth tones (orange, brown, cream, olive green), collaborative and productive mood, simple geometric shapes"
tags: [technical, ai, vibe-coding]
category: Technical Deep Dive
---

# Vibe Coding Is Real, But Not What Reddit Thinks

Three weeks ago, at 2:47 AM, I was staring at a gnarly EVV synchronization bug. Electronic Visit Verification requires caregivers to clock in and out of client visits with GPS coordinates, and our offline-first mobile app wasn't reconciling server state correctly after connectivity gaps.

I described the problem to Claude. Twenty minutes later, we had a working CRDT-based solution with conflict resolution, proper vector clocks, and a test suite covering twelve edge cases.

That's vibe coding. Not "prompt and pray." Not "ChatGPT wrote my homework." Real collaboration between human expertise and AI capability.

---

## What Reddit Gets Wrong

There's a 102,000-member subreddit called r/vibecoding. I lurked there last week, and the discourse is... revealing.

**The skeptics** say vibe coding doesn't work:

> "90% of vibe-coded projects never reach production"
> "Great for prototyping, can't fix its own bugs"
> "If you don't understand the code, you can't debug the code"

**The evangelists** say it changes everything:

> "Built my entire SaaS for $500 in a weekend"
> "Software engineering could be dead by next year"
> "I shipped features my senior devs said were impossible"

Both sides are wrong because they're arguing about different things.

The skeptics are right that prompting ChatGPT to "build me an app" produces garbage. The evangelists are right that AI dramatically accelerates capable developers. The confusion is about what "vibe coding" actually means.

---

## What Vibe Coding Actually Is

Here's my definition, after building Care Commons—a production healthcare platform—in 28 days:

**Vibe coding is AI-augmented development where you guide direction and validate output while the AI handles implementation velocity.**

The key words are *guide* and *validate*. You're not abdicating judgment. You're not blindly accepting output. You're collaborating with a tool that has perfect recall of documentation, infinite patience for boilerplate, and no ego about rewrites.

It's like pair programming with a junior developer who:
- Has read every library's documentation
- Never gets tired or frustrated
- Types 10x faster than you
- Needs clear direction and code review
- Sometimes confidently suggests nonsense

That last point is crucial. AI generates plausible code, not necessarily correct code. You need domain expertise to distinguish between the two.

---

## The Numbers: 28 Days to Production

Let me show you what this looks like in practice.

Care Commons is a home healthcare management platform. It handles:
- Electronic Visit Verification (EVV) - federally mandated
- Multi-state regulatory compliance (Texas, Florida, Ohio, Pennsylvania)
- Caregiver scheduling and credential tracking
- Client care plans and authorizations
- Billing and payroll integration
- Mobile app with offline support

Here are the verified metrics:

| Metric | Value |
|--------|-------|
| Development time | 28 days |
| Total commits | 1,505+ |
| Pull requests merged | 330+ |
| Lines of code | 381,049 |
| Automated tests | 3,154 |
| TypeScript/TSX source | 209,774 lines |

You can verify these yourself: [github.com/neighborhood-lab/care-commons](https://github.com/neighborhood-lab/care-commons)

For comparison, a traditional team would estimate this scope at 6-12 months with 3-5 engineers. I did it in a month with Claude.

---

## Where AI Excels

Let me be specific about what the AI is actually good at.

### 1. Boilerplate and CRUD

Building a new API endpoint with validation, database queries, error handling, and tests? AI does this in minutes with consistent patterns.

```typescript
// I describe what I need:
// "Add endpoint to get caregiver compliance status, 
//  check credentials, return blocking issues"

// AI generates complete implementation:
export async function getCaregiverComplianceStatus(
  organizationId: UUID,
  caregiverId: UUID
): Promise<ComplianceStatus> {
  const credentials = await credentialRepository.findByCaregiver(
    organizationId,
    caregiverId
  );
  
  const blockingIssues = credentials
    .filter(c => isExpired(c) && c.blocksScheduling)
    .map(c => `${c.type} expired ${formatDate(c.expirationDate)}`);
    
  return {
    canSchedule: blockingIssues.length === 0,
    blockingIssues,
    warnings: getUpcomingExpirations(credentials, 30),
  };
}
```

### 2. Pattern Replication

Once you establish a pattern in your codebase, AI replicates it flawlessly. We have 15 "verticals" (domain modules) in Care Commons. After building the first two, I could say "create the incident-reporting vertical following the scheduling-visits pattern" and get consistent architecture.

### 3. Test Generation

This is AI's superpower. Given a function, AI will generate:
- Happy path tests
- Edge cases you forgot
- Error condition coverage
- Mock setup boilerplate

```typescript
// Me: "Write tests for the compliance status function"

describe('getCaregiverComplianceStatus', () => {
  it('returns canSchedule true when no blocking credentials expired', async () => {
    // Complete test with mocks, assertions, cleanup
  });
  
  it('returns blocking issues for expired credentials', async () => {
    // Edge case I might have forgotten
  });
  
  it('includes warnings for credentials expiring within 30 days', async () => {
    // Another edge case
  });
  
  it('handles caregiver with no credentials', async () => {
    // Error case
  });
});
```

Our 3,154 tests? Most were AI-generated, then human-reviewed.

### 4. Documentation

AI writes better documentation than most developers. It's patient, thorough, and doesn't resent the work. Our API docs, README files, and inline comments are consistently high quality because AI never rushes documentation.

### 5. Refactoring

This is where AI saves the most time. "Rename this function across the codebase." "Extract this logic into a service." "Convert these callbacks to async/await." Tasks that would take an hour of careful find-replace take seconds.

---

## Where Human Judgment Is Essential

Here's where the Reddit skeptics have a point. There are things AI cannot do, and pretending otherwise leads to the disasters people complain about.

### 1. Architecture Decisions

AI will happily implement whatever architecture you describe. It won't tell you that your architecture is wrong for your problem. When I decided on a monorepo structure with Turborepo, I made that call based on understanding our deployment constraints, team size (one), and long-term maintenance needs.

AI would have built a microservices architecture if I'd asked. It would have been wrong for this project.

### 2. Domain Expertise

Care Commons handles healthcare compliance. Texas requires different EVV rules than Florida. HIPAA mandates specific data handling. The 21st Century Cures Act specifies six required data elements for visit verification.

AI doesn't *know* these things. It can look them up if prompted, but it can't spot when code violates regulations you didn't mention. My years of healthcare IT experience are what make the AI output correct, not just syntactically valid.

### 3. Security Review

AI generates code that *looks* secure. Parameterized queries, input validation, authentication checks. But it doesn't think adversarially. When I review AI-generated auth code, I'm asking: "How would I break this?" That's a human skill.

### 4. Priority and Scope

What should we build first? What can we defer? What's the minimum viable feature set? AI will build everything you ask for. Deciding what to ask for is strategy, not implementation.

### 5. Trade-off Analysis

"Good enough" is a human judgment. When the AI generates a perfect but complex solution, sometimes a simpler hack is better for now. Knowing when technical debt is acceptable requires understanding the business context.

---

## The Workflow That Works

Here's how I actually work with Claude:

**1. Start with context.** I maintain an `AGENTS.md` file with domain knowledge, coding standards, and project context. The AI reads this first.

**2. Describe the outcome.** Not "write a function that..." but "I need to track caregiver credential expirations and prevent scheduling when licenses are invalid."

**3. Review critically.** Every piece of AI output gets reviewed. I'm looking for:
   - Logic errors (does this actually solve the problem?)
   - Security issues (can this be exploited?)
   - Pattern violations (does this match our architecture?)
   - Missing edge cases (what about null inputs?)

**4. Iterate rapidly.** Small commits, frequent validation. Our average PR is ~50 lines. If something's wrong, we catch it fast.

**5. Run the checks.** Every commit runs lint, typecheck, and tests. If AI-generated code breaks the build, it gets fixed before merge.

---

## The Honest Math

Here's what vibe coding actually cost for Care Commons:

| Item | Cost |
|------|------|
| Claude API (28 days) | ~$2,000 |
| Vercel hosting | $20/month |
| Neon database | $0 (free tier) |
| GitHub | $0 (free tier) |
| My time (28 days) | Priceless? |

Compare to traditional development:
- 4-person team for 9 months
- Fully loaded cost: ~$150K/engineer/year
- Total: $450K minimum

I'm not claiming AI replaces teams. I'm claiming AI dramatically extends what a skilled individual can build. For a bootstrapped open-source project, that's transformational.

---

## Why Most Vibe-Coded Projects Fail

The Reddit skeptics observe real failures. Here's why:

**1. No domain expertise.** If you don't understand healthcare compliance, you can't validate that AI-generated compliance code is correct. The AI will generate plausible-looking garbage.

**2. No engineering fundamentals.** AI amplifies capability. If you can't read code, you can't review code. Debugging AI output requires understanding what it should do.

**3. Skipping validation.** "It works!" No—it appears to work for the one case you tested. The AI generated 3,154 tests for Care Commons because I insisted on test coverage.

**4. Wrong problem selection.** Some problems are hard because they require deep original thinking, not implementation velocity. AI doesn't help you invent new algorithms; it helps you implement known patterns faster.

**5. Premature production.** Vibe-coded prototypes ship before they're ready. The pressure to show progress leads to skipping the hardening phase where AI output gets properly reviewed and tested.

---

## The Future Is Collaboration

I don't think software engineering is "dead by next year." But I think the job is changing.

The developers who thrive will be:
- **Domain experts** who can validate AI output in their specialty
- **Architects** who can design systems that AI implements
- **Reviewers** who can spot AI's blind spots
- **Product thinkers** who know what to build

The developers who struggle will be:
- **Pure implementers** whose only value is typing speed
- **Copy-paste programmers** who don't understand what they're modifying
- **Documentation-avoiders** whose code can't be AI-extended

Vibe coding is real. It's not magic, and it's not fraud. It's a new mode of development that rewards expertise differently.

Care Commons is proof. Twenty-eight days, one human, 381,000 lines of production healthcare software.

The vibe is real. The code is on GitHub. Go verify it yourself.

---

*Brian Edwards builds Care Commons with [Neighborhood Lab](https://neighborhoodlab.org). The entire codebase is open source at [github.com/neighborhood-lab/care-commons](https://github.com/neighborhood-lab/care-commons).*

*Built with [OpenCode](https://opencode.ai/), Anthropic's open-source CLI for Claude.*
