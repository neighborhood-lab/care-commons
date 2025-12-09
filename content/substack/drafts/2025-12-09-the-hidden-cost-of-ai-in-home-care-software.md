# AI Features in Folk Care: Status Report

## What We Built, What It Costs, How We're Keeping It Accessible

---

Folk Care now has fifteen AI-powered features. They do things that home care software has never done before:

- **Medication interaction checking** catches dangerous drug combinations before caregivers administer them
- **Hospitalization risk prediction** flags patients showing signs of decline before they need emergency care
- **Smart scheduling** matches caregivers to patients based on skills, preferences, and compatibility
- **Documentation assistance** helps caregivers write better notes faster
- **Compliance checking** catches issues before auditors do

These features save lives. They save time. They save money. A single prevented hospitalization saves tens of thousands of dollars. A single caught medication error prevents tragedy.

This is a status report on where we are, what it costs to run, and how we're keeping it accessible.

---

## Current State: 15 AI Features Live

| Feature | What It Does |
|---------|--------------|
| Medication interaction checking | Flags dangerous drug combinations |
| Hospitalization risk prediction | Early warning for patient decline |
| Visit duration prediction | Better scheduling estimates |
| Staffing demand prediction | Forecast hiring needs |
| Sentiment analysis | Flags concerning visit notes |
| Documentation quality scoring | Improves note completeness |
| Note autofill suggestions | Faster documentation |
| Task prioritization | Smart care plan ordering |
| Vitals anomaly detection | Catches abnormal readings |
| Revenue forecasting | Financial planning |
| Churn prediction | Retention alerts |
| Compliance checking | Pre-audit screening |
| Voice transcription | Spoken visit notes |
| Caregiver-patient matching | Optimal assignments |
| Note summarization | Quick visit overviews |

All fifteen are live and working.

---

## Running Costs

AI features cost money to run. We use two providers:

**Anthropic Claude 3.5 Haiku** - 13 features
- ~$0.003 per call
- Excellent quality for healthcare

**Cloudflare Workers AI** - 3 features
- Free (10,000 neurons/day)
- Good for embeddings and transcription

**Monthly costs by agency size:**

| Size | Patients | Visits/Month | AI Cost |
|------|----------|--------------|---------|
| Small | 50 | 1,000 | ~$20 |
| Medium | 500 | 10,000 | ~$200 |
| Large | 2,000 | 40,000 | ~$800 |

For context: incumbent EMR software charges $500-2,000/month with zero AI.

---

## Three Deployment Options

**1. SaaS (folk.care)**
- We pay the AI costs
- Flat $30/month pricing
- All features included

**2. Self-Hosted with API Key**
- Customer provides Anthropic API key
- Pays Claude directly (~$20-200/month)
- All features at full quality

**3. Self-Hosted Free Tier**
- Cloudflare Workers AI only
- Zero API costs
- Most features work, some at lower quality

---

## Decisions

**Safety-critical features use Claude only.**

Medication interactions and hospitalization risk must be accurate. We use the best model available. Self-hosters need an Anthropic key for these.

**Everything else gets a free fallback.**

We're building Cloudflare alternatives for all other features. Self-hosters can run them at zero cost.

**We're not slowing down.**

AI features are why Folk Care is different. We're shipping more as fast as we can build them.

---

## Coming Next

- Optimal visit frequency recommendations
- Care plan generation from assessments
- Family communication summaries
- Geographic schedule optimization
- Billing anomaly detection

---

## Bottom Line

Incumbent software charges $500-2,000/month and does nothing intelligent.

Folk Care SaaS costs $30/month with fifteen AI features included.

Self-hosted Folk Care costs $0-200/month depending on which features you need.

AI is how we make home care software genuinely better. The costs are worth it.

---

*Folk Care is open source home care software. See it at [folk.care](https://folk.care/), code at [GitHub](https://github.com/neighborhood-lab/folkcare), info at [about.folk.care](https://about.folk.care/).*
