# Marketing Website Planning: about.folk.care

**Labels**: `HUMAN`, `marketing`, `content`, `design`

## Overview

We need to create a marketing website at **about.folk.care** to complement the demo/SaaS instance at **folk.care**.

This website should introduce folk.care to potential users (home healthcare agencies), explain the philosophy behind community-owned software, and drive signups/trials.

## Brand Identity

- **Product**: folk.care (always lowercase with dot)
- **Organization**: Neighborhood Lab (unchanged)
- **Voice**: Technical honesty, human-scale design, anti-corporate
- **Audience**: Small home healthcare agencies (5-50 staff), frustrated with enterprise vendors

## Content Strategy (Based on Substack)

The Neighborhood Lab Substack provides excellent foundation content. Key themes to adapt:

### 1. **Hero/Landing Section**
**Core Message**: "Care software that respects the people who use it"

**Key Points**:
- Open source (AGPL-3.0)
- Offline-first (works in basements & dead zones)
- State-specific compliance built in
- Human-scale design vs. enterprise bloat
- Community-owned, not VC-backed

### 2. **Problem/Solution**
**The Problem** (from Substack "What is Folk Care?"):
- Enterprise vendors charge $30k+ annually
- Bloated platforms nobody asked for
- Poor field performance
- Vendor lock-in
- Compliance as checkbox exercise

**The Solution**:
- Fair pricing: $200-500/month based on staff size
- Modular architecture
- Works offline where caregivers actually work
- Open source = no lock-in
- Real regulatory research

### 3. **Key Features** (Story-Driven)

From "Family Portal" post - use narrative approach:
- **Family Portal**: "Sarah checks her phone at lunch..." story
- **Offline EVV**: Works in basements, syncs when connection returns
- **State Compliance**: Texas vs Florida vs Ohio - automatic enforcement
- **Caregiver Mobile App**: Respects workers, doesn't surveil them

### 4. **Philosophy Section**
From "About" page:
- Community infrastructure deserves community-owned software
- Built to last, not for VC exit
- Transparency & documentation
- Human-scale vs. enterprise bloat

### 5. **Pricing/Economics**
From "What is Folk Care?":
- **Self-Hosted**: Free (if technical)
- **Managed Hosting**: $200-500/month
- **Support**: $150/hour
- **Community Support**: Patreon/donations

Clear comparison to $30k+ enterprise contracts.

### 6. **Try It Now**
Multiple entry points:
- **Interactive Demo**: https://folk.care (showcase)
- **Live Demo**: Login credentials for testing
- **Discord Community**: https://discord.gg/EkeXQZFq
- **Documentation**: GitHub

## Image Prompts for AI Generation

### Hero Section Image
**Prompt**: "Professional healthcare setting illustration in warm, approachable style. A caregiver using a smartphone in a home care environment, natural lighting through window, elderly client in background reading, plants, warm colors (soft blues and greens), modern flat illustration style, NOT corporate stock photo aesthetic, human-centered composition, 16:9 ratio"

### Offline-First Feature
**Prompt**: "Split screen illustration showing connectivity states. Left side: caregiver in basement with 'no signal' indicator, confidently using phone app. Right side: same caregiver outdoors, data syncing with checkmarks. Modern technical illustration, warm colors, reassuring visual language, show local storage icon on left and cloud sync on right, 16:9 ratio"

### Family Portal Feature
**Prompt**: "Warm illustration of adult daughter in office looking at phone with relief/peace. Phone screen shows care notification 'Visit completed - Mom doing well'. Soft lighting, professional but approachable, emphasis on emotional relief not surveillance, warm color palette, human-centered, 16:9 ratio"

### State Compliance Feature
**Prompt**: "Map of USA with Texas, Florida, and Ohio highlighted in different colors. Each state has floating icons representing their specific rules (GPS pin, clock, document checkmark). Clean, professional infographic style, not overwhelming, shows complexity being handled automatically, modern flat design, 16:9 ratio"

### Community-Owned Concept
**Prompt**: "Illustration contrasting two buildings: Left side shows massive corporate office building with lock icon, dollar signs. Right side shows neighborhood community center with open door, diverse people collaborating, warm welcoming lighting. Split composition, clear visual metaphor for corporate vs community ownership, modern illustration style, 16:9 ratio"

### Caregiver Mobile App
**Prompt**: "Over-shoulder view of caregiver hands holding phone showing simple, clean mobile interface with visit details. Background shows home care setting (living room, soft focus). Interface emphasizes simplicity and clarity, warm natural lighting, human hands visible to show real-world use, not polished product shot, 4:3 ratio"

### Open Source / Transparency
**Prompt**: "Abstract technical illustration showing code repository with multiple contributors (GitHub-style). Arrows showing code flowing outward to different agencies/users. Light, airy feeling, emphasizing openness not complexity. Use transparent/translucent visual language, cool blues and greens, modern flat style, 16:9 ratio"

### Pricing Comparison
**Prompt**: "Clean comparison infographic. Left: Enterprise vendor pricing pyramid showing $30,000+ at top, complex tiers. Right: folk.care simple flat pricing bars ($200-500), clear and transparent. Use contrasting visual weight - enterprise side heavy/oppressive, folk.care side light/accessible, modern infographic style, 16:9 ratio"

### Building in Public / Development
**Prompt**: "Illustration showing transparent development process. Developer at laptop with code visible, connected to Discord community icons, GitHub pull requests, documentation pages. Emphasis on openness and collaboration, warm workshop/craft aesthetic not corporate tech vibe, modern illustration, 16:9 ratio"

### Small Agency Focus
**Prompt**: "Illustration of small healthcare agency office. 5-10 diverse staff members collaborating around table with laptops/tablets showing the software. Warm, intimate setting vs corporate conference room. Emphasize human scale, real relationships, community feeling. Natural lighting, approachable illustration style, 16:9 ratio"

## Technical Implementation Notes

- **Domain**: about.folk.care (separate from folk.care demo instance)
- **Tech Stack**: Static site (probably) - could be Astro, Next.js static export, or similar
- **Deployment**: Likely Vercel or Cloudflare Pages
- **Analytics**: Privacy-respecting (Plausible or self-hosted)
- **Forms**: Contact/signup forms need backend integration

## Content Sources to Mine

Primary Substack posts to adapt:
1. ✅ **"What is Folk Care?"** - Core product explanation
2. ✅ **"Family Portal"** - Feature storytelling approach
3. **"About This Newsletter"** - Philosophy and mission
4. **"Against Monopoly"** - Anti-corporate positioning
5. **"The Steward's Software"** - Moral/ethical framework
6. **"Reading Texas HHSC Regulations at 2 AM"** - Domain expertise

## Tone & Voice Guidelines

From the Substack content:

- ✅ **Direct and honest**: "We're not writing from a position of success. We're writing from the middle of the work."
- ✅ **Anti-hype**: No growth hacking, no polished case studies (yet)
- ✅ **Technical depth**: Assume readers are smart and interested in how things work
- ✅ **Human-centered**: Stories about Sarah and her mom, not "user retention metrics"
- ✅ **No corpo-speak**: Avoid "solutions", "leverage", "ecosystem", "stakeholders"
- ✅ **Clear constraints**: "We don't have X yet" is fine to say

## Call to Action Hierarchy

1. **Primary**: Try the interactive demo (no friction)
2. **Secondary**: Join Discord community (low commitment)
3. **Tertiary**: Schedule a call / Request early access (high intent)
4. **Supporting**: Read Substack / Follow on GitHub (long-term nurture)

## Next Steps for Brian

- [ ] Review image prompts - which resonate? Which need changes?
- [ ] Decide on static site generator (Astro? Next.js static?)
- [ ] Set up about.folk.care subdomain (DNS, hosting)
- [ ] Generate images using AI tools (Midjourney, DALL-E, or similar)
- [ ] Adapt Substack content into web copy
- [ ] Create simple contact/signup form backend
- [ ] Design mobile-responsive layout
- [ ] Add analytics (privacy-respecting)
- [ ] Test CTAs and conversion paths

## Questions for Brian

1. **Visual style preference**: Illustrations (as prompted above) vs. real photography vs. screenshot-heavy?
2. **Content depth**: Single long-form page vs. multi-page site structure?
3. **Signup flow**: Capture emails for early access list? Or just point to demo?
4. **Budget for images**: Generate with AI (cheap/fast) vs. hire illustrator (expensive/custom)?
5. **Timeline**: Launch target date? (Coordinate with v1.0 product launch?)

---

**Related Files**:
- Substack content: `content/substack/`
- Marketing drafts: `docs/marketing/`
- Social media posts: `docs/marketing/social-media-launch-posts.md`
- Demo video script: `docs/marketing/demo-video-script.md`
