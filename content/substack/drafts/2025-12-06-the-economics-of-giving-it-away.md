# The Economics of Giving It Away

## How Vibe Coding Makes Open Source Home Care Software Sustainable—and Why the Giants Cannot Follow

---

In the previous essay, I made a claim that probably seemed too good to be true. Folk Care is open source—free to self-host, free to modify, free to fork. For agencies that want managed hosting, we charge twenty to thirty dollars per month. Not per user. Not per patient. A flat fee for the entire agency.

Meanwhile, the incumbent vendors charge between two hundred and eight hundred dollars per user per month. WellSky, with its twenty-three acquisitions and six billion dollars in private equity backing, starts around eight hundred dollars per user. Axxess, processing thirty-seven billion dollars in annual claims, uses census-based pricing that scales with your success. A medium-sized agency might pay three hundred thousand dollars annually for software that we would host for three hundred sixty dollars.

If you are a home care business owner considering Folk Care, you have probably already done this math. And if you are sophisticated, you have probably already identified the problem with it.

The math does not add up.

Software development is expensive. Good software developers in the United States earn between one hundred fifty thousand and three hundred thousand dollars annually. A small team of five developers costs between seven hundred fifty thousand and one and a half million dollars per year in salary alone, before you account for benefits, infrastructure, management overhead, and the thousand other costs of running a software company.

If Folk Care charges thirty dollars per month and has a thousand customers—an optimistic assumption for a new entrant in a market dominated by entrenched incumbents—that generates three hundred sixty thousand dollars annually. Not enough to pay even two developers at market rates. Not enough to maintain the software, let alone improve it.

Open source helps. Community contributions can supplement paid development. But open source has existed since the 1970s. Linux is over thirty years old. The model of "give away the software, charge for support and hosting" has been tried countless times. Sometimes it works—Red Hat built a billion-dollar business on it. Usually it does not. Usually the project stagnates, the maintainers burn out, and the users who depended on it are left scrambling for alternatives.

You would be right to be skeptical. You would be right to ask: what has changed that makes this viable now, when it was not viable before?

The answer is a single word: Claude.

More specifically, the answer is Claude 4.5, released by Anthropic in late 2025, and the practice it enabled that we now call vibe coding.

---

## December 2025: The Turning Point

We are living through a turning point in the history of software development. Most people have not noticed yet. In five years, everyone will look back at this moment and wonder how they missed it.

Claude 4.5—first Sonnet, then Opus—changed what is possible. Not incrementally. Fundamentally. Previous AI coding assistants could help with routine tasks: autocomplete, boilerplate generation, simple refactoring. They were productivity tools, like a faster keyboard. Useful, but not transformative.

Claude 4.5 is different in kind. It understands entire codebases. It holds architectural context across thousands of lines. It can implement complex features from high-level descriptions, handling edge cases and error conditions without being told. It writes code that works on the first try more often than most human developers.

More importantly, it works reliably within established patterns. Home care software is not novel computer science. It is scheduling, documentation, compliance tracking, billing integration. These are solved problems with known architectures. The question was never whether a computer could theoretically write this software—it was whether doing so was economically viable.

With Claude 4.5, it became viable.

The tool that enables this, Claude Code, is Anthropic's command-line interface for development. You describe what you want. Claude writes the code. It runs tests. It fixes problems. It commits changes. The human provides direction and judgment. The AI provides implementation at superhuman speed.

The Folk Care repository tells the story in numbers. Over fifteen hundred commits since November first. Forty commits per day, every day, for five weeks. Tens of thousands of lines of TypeScript—backend APIs, web frontends, mobile applications, database migrations, test suites, deployment configurations. In a single month, we completed competitive analysis of seven market players, implemented performance monitoring, resolved dozens of security vulnerabilities, improved calendar views with density controls and tooltips, built infrastructure for bulk issue creation, and wrote an essay you might have read.

A traditional development team producing this volume of work would require five to ten engineers working full time. We are doing it with two humans and Claude.

---

## The Cost Structure That Changes Everything

To understand why this matters, you need to understand what AI coding assistance actually costs.

Claude is priced by token—essentially by the amount of text processed. For Sonnet, Anthropic charges three dollars per million input tokens and fifteen dollars per million output tokens. For Opus, the most capable model, fifteen dollars per million input tokens and seventy-five dollars per million output tokens.

Let me make these numbers concrete.

A typical coding session might involve Claude reading several thousand lines of existing code for context, processing a request, and generating a few hundred lines of new or modified code. Call it fifty thousand input tokens and ten thousand output tokens. At Sonnet pricing, that session costs about thirty cents.

A forty-hour work week of intensive AI-assisted development might involve two hundred such sessions. Total cost: sixty dollars at Sonnet pricing.

Compare this to employing a human developer. At a fully-loaded cost of two hundred thousand dollars annually—a modest estimate for a competent developer in a major market—one week of human development costs roughly four thousand dollars. Claude costs sixty dollars for equivalent output. Claude works at any hour. Claude does not need health insurance.

This comparison is imperfect. Claude requires human direction. It makes mistakes that require human correction. It cannot do everything a skilled developer can do—particularly tasks requiring deep domain insight or genuinely novel solutions.

But it does not need to replace human developers entirely to transform the economics of software production. It needs only to multiply what a human can accomplish.

That multiplication factor is currently somewhere between five and twenty, depending on the task. And it is increasing rapidly.

---

## What Vibe Coding Actually Is

The term "vibe coding" emerged in early 2025 to describe this new way of building software. The name is slightly ridiculous, which is probably why it stuck. It captures something important: the shift from writing code to directing code.

In traditional software development, a human programmer thinks about what they want to accomplish, translates that intention into precise instructions in a programming language, types those instructions into an editor, runs the code, discovers it does not work, debugs it, tries again, and eventually—after hours or days or weeks—has something functional. The human is doing two jobs simultaneously: deciding what to build and figuring out how to express it in code.

In vibe coding, those jobs are separated. The human decides what to build. The AI figures out how to express it in code.

This sounds like a minor efficiency improvement. It is not. It changes what kinds of projects are economically viable.

Consider what actually consumes time in traditional software development. A senior developer might spend twenty percent of their time on high-level design decisions—architecture, trade-offs, which features to build and which to defer. They might spend another ten percent on code review and quality assurance. The remaining seventy percent goes to implementation: the mechanical work of translating intentions into syntax, debugging, writing tests, fixing edge cases, updating documentation.

That seventy percent—the majority of what software developers do—is precisely what Claude now handles. Not perfectly. Not without supervision. But well enough, and fast enough, that a single human directing Claude can accomplish what previously required a team.

---

## Early 2026: The Acceleration

Where are we heading? The best forecasting work on this question comes from a project called AI 2027, which attempts to map the trajectory of AI capabilities through the end of the decade. Their predictions are sobering.

By early 2026—roughly three months from now—they forecast that AI coding capabilities will have improved substantially. Their estimate: AI systems will achieve fifty percent faster algorithmic progress through research and development automation. Public models will become ten times cheaper while maintaining current capability levels. Competition from Google Gemini and OpenAI is driving prices down rapidly.

What does this mean for projects like Folk Care?

First, the cost of development drops further. If current AI costs sixty dollars per work-week, a ten-fold price reduction brings that to six dollars. The marginal cost of adding features, fixing bugs, and maintaining the codebase approaches zero.

Second, the capability gap narrows. The tasks that currently require human intervention—catching occasional hallucinations, understanding complex context, coordinating intricate changes across many files—become increasingly handleable by AI systems themselves. The human role shifts further toward direction and taste, further away from implementation details.

Third, the quality baseline rises. We already run automated linting, type checking, testing, and security scanning on every commit. With more capable AI, we can add comprehensive security audits, performance analysis, accessibility verification—every form of automated checking that currently requires expert human review. The guardrails become essentially free.

---

## Late 2026: The Job Market Transforms

The AI 2027 project forecasts that by late 2026, "the job market for junior software engineers is in turmoil." Their assessment: AI systems can now "do everything taught by a CS degree."

This is a tragedy for many individual workers. People who invested four years and substantial debt in computer science degrees will find that the skills they acquired are no longer scarce. The transition will be painful, disorienting, and for many, financially devastating.

It is also an opportunity for projects like Folk Care.

Consider what happens when large numbers of skilled developers find themselves displaced. Some will find new roles—managing AI systems, moving into product management, transitioning to adjacent fields. But many will have time, skills, and motivation they did not have before. Some of them will want to contribute to projects that matter.

Open source has always depended on volunteer contributions. The challenge has been that the people with the most skill—employed developers—have the least time. They are exhausted from their day jobs. They have families, obligations, limited hours to donate.

When skilled developers are displaced, this equation changes. Suddenly there are people with deep expertise who have time to contribute. Some will contribute because they want to stay sharp. Some because they are building portfolios for the new economy. Some because they believe in the mission of a particular project and want to be part of something meaningful.

Folk Care is positioned to benefit from this. We are not a company optimizing for shareholder returns. We are infrastructure for community-owned home care—a mission that resonates with people who have seen how private equity extracts value from essential services. When developers have time to choose how they contribute to the world, some of them will choose us.

We are not the only ones recognizing this. A growing community of developers is building open source alternatives to extractive software across many domains. Community ownership over extraction. Sustainability over growth. The economics of vibe coding make these projects viable in ways they never were before.

---

## March 2027: Superhuman Coders

The AI 2027 project's central prediction: by March 2027, roughly fifteen months from now, AI systems will achieve superhuman coding ability. Not superhuman in a narrow sense—better at specific benchmarks—but comprehensively superhuman. Their definition: "an AI system that can do any coding tasks that the best AGI company engineer does, while being much faster and cheaper."

Fifteen months. That is not a long time. That is barely enough time to complete a traditional software development project.

What does superhuman coding mean for Folk Care?

Our development velocity—already remarkable—will accelerate further. Features that currently take days will take hours. The entire codebase could be refactored in an afternoon. New capabilities that we currently defer because of resource constraints become trivially achievable.

Consider what becomes possible.

Documentation that writes itself. Not just code comments, but user guides, training materials, contextual help—all generated and kept current automatically. A caregiver opening the app for the first time could receive personalized onboarding generated specifically for their role and experience level.

Testing that covers everything. Not just automated unit tests, but comprehensive integration testing, edge case exploration, security fuzzing, performance profiling—all running continuously. Bugs found before users ever see them.

Adaptation to change. When healthcare regulations shift, the software updates itself. When a state changes its EVV requirements, compliance is maintained automatically. When a new integration standard emerges, Folk Care speaks it within days.

These capabilities will be available to everyone with access to AI systems. But Folk Care will be positioned to deploy them immediately because we have built our architecture to work with AI from the beginning. The incumbents will be wrestling with legacy systems designed for a different era.

---

## Why the Giants Cannot Follow

Large software organizations have enormous inertia. Their codebases are massive—millions of lines accumulated over decades. Their processes are optimized for human developers working in traditional ways. Their management structures assume that engineering is done by humans who need coordination, performance reviews, office space.

WellSky has been built through twenty-three acquisitions. Each acquired company brought its own codebase, its own architecture, its own technical debt. Integrating these systems took years and cost hundreds of millions of dollars. The result is a sprawling legacy that works but cannot easily change.

Axxess grew from startup to processing thirty-seven billion in annual claims. That growth required building systems that could scale, which meant making architectural decisions that are now baked into the foundation. Those decisions made sense for the world of 2015. They make less sense for the world of 2027.

When AI can do the work of developers, what happens to the VP of Engineering managing two hundred people? What happens to the middle managers, the scrum masters, the technical leads? What happens to the developers themselves—the employees with stock options, the institutional knowledge holders, the people who know where the bodies are buried in those legacy codebases?

These organizations face a collective action problem. Adopting vibe coding means admitting that most of their engineering staff is no longer necessary. It means restructuring the entire company around a handful of humans directing AI systems. It means writing off years of process development, tools investment, organizational design.

No one at WellSky will make this decision. Not because they cannot see the future coming—anyone paying attention can see it—but because making this decision would destroy their position within the company. The VP of Engineering who advocates firing ninety percent of their staff is next on the chopping block. The CEO who restructures around AI admits that their previous strategy was wrong.

Private equity ownership makes this worse. PE firms have short time horizons—five to seven years to exit. Their incentive is not to rebuild the company for the AI age; it is to maximize the appearance of value for the next buyer. Fundamental restructuring is risk. Incremental extraction is safety.

Folk Care has none of these constraints. We have no legacy organization to protect. We have no VPs who need to justify their existence. We have no PE owners demanding returns on a timeline that precludes transformation.

We are building from scratch, with AI, for AI. When the tools improve, we improve. When the costs drop, our costs drop. When new capabilities emerge, we adopt them immediately.

---

## September 2027: Beyond Human Comprehension

The AI 2027 project forecasts that by September 2027—less than two years from now—AI systems will surpass humans not just at coding but at AI research itself. Their assessment: "An individual copy of the model, running at human speed, is already qualitatively better at AI research than any human."

At this point, AI development accelerates beyond human ability to follow. Their estimate: three hundred thousand AI instances running at fifty times human thinking speed, achieving "a year's worth of algorithmic progress every week."

What does this mean for software in general?

The honest answer is that we do not know. When AI systems can improve AI systems faster than humans can comprehend, prediction becomes genuinely difficult. The future beyond this point is not just unknown but unknowable in detail.

But some things we can say.

The fundamental problems of home care do not change. Elderly patients will still need care. Caregivers will still need tools that help rather than hinder. Families will still need visibility and peace of mind. Agencies will still need to manage scheduling, documentation, compliance, billing.

What changes is our ability to address these problems.

Consider documentation. Currently, caregivers spend substantial portions of their visits typing notes on small phones. Even with current AI assistance, this takes time. With vastly more capable AI, the system could observe a visit through ambient sensing, understand what happened, generate compliant documentation, and submit it—all without the caregiver touching a keyboard. The caregiver's job becomes care, not paperwork.

Consider scheduling. Currently, even excellent scheduling software requires human schedulers to make judgment calls about caregiver-patient matching, travel optimization, preference management. With superhuman AI, the system could consider every variable simultaneously, predict problems before they occur, and generate optimal schedules that no human could improve.

Consider clinical monitoring. Currently, early signs of patient decline often go unnoticed until a crisis occurs. With AI analyzing every visit note, every vital sign, every behavioral observation—and understanding what they mean at a level humans cannot match—we could identify concerning patterns weeks earlier. Prevention rather than reaction.

Folk Care will be positioned to deploy these capabilities because we have built our system to work with AI from the beginning. Our architecture assumes AI will continue improving. Our code is structured to be readable by AI systems. We are building for the world that is coming.

---

## What Must Change About Software Engineering

The transition to vibe coding requires rethinking practices that have governed software engineering for decades.

Some practices must be abandoned entirely.

The idea that humans should write all code from scratch—typing every character, debugging every error—made sense when humans were the only option. It makes no sense when AI can write functionally equivalent code faster and often better.

The idea that documentation is expensive and should be minimized—that made sense when documentation required human time that could otherwise go to features. When AI generates and updates documentation essentially for free, comprehensive documentation becomes costless.

The idea that testing is a cost to be managed—that you write tests for critical paths and accept risk elsewhere—that made sense when writing tests consumed human hours. When AI generates comprehensive test suites as easily as it generates code, there is no reason not to test everything.

Other practices must be altered rather than abandoned.

Code review remains essential, but the focus shifts. Instead of reviewing for implementation correctness—the AI handles that—humans review for intent alignment. Does this code accomplish what we actually wanted? Does it fit the product vision? Does it handle the cases that matter to real users?

Architecture still matters, but the time horizon compresses. Traditional architecture assumed that major decisions were expensive to reverse. With AI that can refactor an entire codebase in hours, the cost of changing direction drops dramatically. Architecture becomes more experimental, more iterative.

Security becomes simultaneously easier and more critical. Easier because AI can perform exhaustive security audits. More critical because the same capabilities are available to attackers. The arms race accelerates.

---

## The Human Role That Remains

After all of this—after AI can code better than any human, after implementation becomes essentially free—what remains for humans to do?

Three things, at least.

First: judgment about what matters. AI systems can generate infinite variations of any software feature. They cannot decide which variations matter to users. They cannot feel the frustration of a caregiver fighting with a clunky interface. They cannot understand why a family member's anxiety about their elderly parent is not just a problem to be solved but a human experience to be respected.

Folk Care exists because someone decided that home care workers deserve better tools. That decision was not an optimization problem solvable by AI. It was a value judgment about what kind of world should exist.

Second: taste about what good means. When a hundred implementations are possible, which one is best? "Best" is not a mathematical concept. It involves aesthetics, culture, history, context. The decision to make Folk Care's interface warm and domestic rather than clinical and corporate reflects a design sensibility that no amount of AI capability can generate from first principles.

Third: accountability and trust. Someone must be responsible for the software's behavior. When AI generates code that causes harm, someone must answer for it. AI cannot be held responsible in any meaningful sense. Humans can.

Folk Care is built by people with names and contact information. If something goes wrong, there is a human to talk to. That accountability does not go away because AI writes the code. If anything, it becomes more important.

---

## Built by Vibe Coding, for Vibe Coding

Folk Care is not just built using AI assistance. It is built to work with AI—both for ongoing development and for the agencies that use it.

Our codebase is structured for AI comprehension. Explicit types everywhere. Comprehensive test coverage that documents expected behavior. Clear naming conventions. Modular architecture that allows changes in one area without cascading effects elsewhere.

Our development process assumes AI participation. Every commit runs through automated linting, type checking, testing, and security scanning. The humans focus on judgment and taste. The AI handles mechanical correctness.

Our product roadmap anticipates AI capabilities. We are building toward voice-based documentation that lets caregivers dictate notes naturally. We are building toward intelligent scheduling that considers every variable. We are building toward clinical monitoring that flags concerns before they become crises.

The incumbents cannot do this. They have twenty years of code written by humans for humans. They have architectures designed around human limitations. Those architectures are optimized for constraints that no longer apply.

We are optimized for the world that is emerging.

---

## The Sustainability Question Answered

Return to the question that opened this essay. How can Folk Care be built sustainably while giving away the software, charging only for hosting costs, and depending on community support?

The traditional answer would be: it cannot. The economics do not work.

The vibe coding answer: the economics have changed.

Development cost? When AI can produce ten to twenty times the output of a human developer at a fraction of the cost, a small team with minimal funding can maintain software that previously required millions in annual engineering budget.

Maintenance burden? When AI can fix bugs, update dependencies, and ensure compatibility essentially on demand, maintenance becomes trivial. Our automated systems catch problems before they reach users.

Community contribution? When skilled developers have time to contribute—whether because they believe in the mission or simply have more time than they did when employed—the pool of potential contributors expands.

Sustainability does not require massive revenue. It requires covering costs. Our costs are modest: hosting infrastructure, AI API access, human time for direction and judgment. These costs can be covered by agencies paying modest hosting fees, supplemented by community supporters.

We are not building a company to sell. We are building infrastructure to maintain. The economics of maintenance in the AI age are fundamentally different.

---

## The Next Fifteen Months

The forecasters predict superhuman coding by March 2027. Fifteen months from now.

In those fifteen months, Folk Care will continue building. We will add the intelligent features described in the previous essay—predictive care coordination, automated documentation, clinical monitoring. We will expand interoperability with healthcare standards. We will build the shared infrastructure that lets independent agencies benefit from collective resources.

As AI improves, our capabilities improve. We are not fighting the current. We are riding it.

The incumbents will spend those fifteen months trying to figure out what is happening. They will hire consultants to write reports about AI strategy. They will pilot projects that go nowhere because the organization cannot absorb fundamental change. They will watch their competitive position erode.

By March 2027, the gap will be unbridgeable. Not because we are smarter or better funded—we are neither—but because we started with the right architecture, the right ownership structure, and the right alignment between our mission and the tools becoming available.

The revolution is quiet. It does not announce itself with press releases and keynote speeches. It happens in commit histories and community Discord servers. It happens when a caregiver discovers that the software actually helps her do her job. It happens when an agency owner realizes that sustainable margins are possible without extractive pricing.

Fifteen months. The future is arriving. What we build now determines what we will have when it gets here.

---

*Brian Edwards is the founder of Neighborhood Lab and the creator of Folk Care. He can be reached at brian.mabry.edwards@gmail.com or 512-584-6841.*

*Folk Care is built by vibe coding, for vibe coding. Join us:*
- *See it in action: showcase.folk.care*
- *Read the code: github.com/neighborhood-lab/folkcare*
- *Join the community: Discord*
- *Support the work: Patreon, GitHub Sponsors*

*This essay is a continuation of "The Quiet Revolution in Home Care," which describes the industry Folk Care is transforming. If you have not read it, start there.*
