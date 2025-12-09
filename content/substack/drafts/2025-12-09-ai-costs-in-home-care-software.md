# AI Costs in Home Care Software

## What We Learned Auditing Fifteen AI Features

---

Home care software has a cost everyone ignores: the AI features that actually make the software intelligent require ongoing API costs to run. This week, we audited every AI-powered feature in Folk Care—fifteen services and counting—and discovered something important.

The cost is real. At scale, a medium-sized agency's AI inference costs could reach four hundred dollars per month. But here is what nobody in this industry is talking about: that four hundred dollars buys capabilities that would have been impossible at any price five years ago. And compared to the five hundred to two thousand dollars per month that agencies pay for "dumb" EMR software that does nothing intelligent, it is a bargain.

This essay explains what we found, what it means for the economics of AI-powered healthcare software, and how we are building infrastructure that makes these capabilities accessible to everyone—including agencies that self-host.

---

## The AI Feature Explosion

In the past sixty days, Folk Care has gained fifteen AI-powered features. Each one solves a real problem that home care agencies face daily.

**Clinical Decision Support:**
- Medication interaction checking—scanning prescriptions against known drug interactions before a caregiver dispenses medications
- Hospitalization risk prediction—analyzing visit notes and vital signs to flag patients who may need clinical intervention
- Vitals anomaly detection—identifying unusual patterns in blood pressure, heart rate, and other measurements

**Care Coordination:**
- Task prioritization—using patient condition and care plan goals to recommend which tasks caregivers should focus on
- Visit duration prediction—estimating how long visits should take based on patient needs and historical patterns
- Staffing demand forecasting—predicting future staffing requirements from census data and authorization trends

**Documentation Assistance:**
- Note autofill—suggesting documentation based on scheduled tasks and historical patterns
- Voice transcription—converting spoken visit notes into structured documentation
- Documentation quality scoring—evaluating whether notes meet clinical and compliance standards
- Sentiment analysis—detecting concerning language in caregiver notes that might indicate patient decline

**Analytics:**
- Churn prediction—identifying which clients and caregivers are at risk of leaving
- Revenue forecasting—projecting future revenue based on authorization utilization and census trends
- Compliance checking—automatically reviewing documentation against state-specific regulations

Every one of these features adds genuine value. Every one of them required substantial engineering effort. And almost every one of them depends on a single external service: Anthropic's Claude API.

---

## The Claude Dependency

Claude, developed by Anthropic, is arguably the most capable AI system available for structured reasoning tasks. Its ability to follow complex instructions, maintain context across long documents, and generate reliable JSON output makes it ideal for healthcare applications where accuracy matters.

We use Claude 3.5 Haiku, the fastest and most cost-effective model in Anthropic's lineup. For a single API call—analyzing a patient's visit notes to predict hospitalization risk, for example—Haiku costs approximately three-tenths of a cent. At individual scale, this is trivial.

At organizational scale, it is not.

Consider a medium-sized home care agency: five hundred patients, two hundred fifty caregivers, ten thousand visits per month. If every AI feature were used for every visit, the monthly Claude API bill would approach four hundred dollars.

Now consider what that four hundred dollars buys: medication interaction checking that could prevent adverse drug events, hospitalization risk prediction that flags patients before they decline, staffing optimization that reduces overtime costs by thousands. Compare this to WellSky, which charges eight hundred dollars per user per month for software that does none of these things intelligently.

Four hundred dollars for genuine AI capabilities versus eight hundred dollars per user for glorified spreadsheets. The math is not close.

For our SaaS customers, we absorb and manage these costs. For self-hosted deployments, agencies would need their own Anthropic API key. But here is what matters: even paying the full four hundred dollars, a self-hosted Folk Care installation with AI capabilities would cost less than one month of per-user fees from the incumbents.

---

## The Free Alternative We Already Have

Here is what makes this situation frustrating: we already have a free alternative built into Folk Care. We just have not been using it enough.

Cloudflare Workers AI is a service that provides machine learning inference at no cost. Not a trial. Not a limited-time offer. Genuinely free, with ten thousand "neurons" of compute per day—enough for roughly eight hundred AI calls—included in every Cloudflare account.

We use Cloudflare Workers AI for three capabilities today:

**Text embeddings** with the BGE model—converting text into numerical vectors that enable semantic similarity matching. When we match caregivers to patients based on preferences and compatibility, this is the technology underlying it.

**Voice transcription** with Whisper—converting spoken audio into text. When caregivers record voice notes that become structured documentation, Whisper handles the transcription.

**Text generation** with Llama 2—although currently implemented only as a placeholder, with the actual processing done through heuristics instead.

The gap is obvious. Thirteen of our fifteen AI features use Claude. Three use Cloudflare. The free option is underutilized.

---

## Quality Versus Cost

Why did we build so many features on Claude instead of Cloudflare's free models? The answer is quality.

Claude 3.5 Haiku scores above seventy-five percent on standard reasoning benchmarks. It produces reliable JSON output with minimal prompt engineering. When you ask it to analyze a patient's vital signs and return a structured risk assessment, it does so correctly nearly every time.

Llama 3.2, the best model available through Cloudflare Workers AI, is less consistent. The 8B parameter version scores around seventy percent on the same benchmarks—respectable, but noticeably less reliable. The 1B parameter version, which uses the fewest neurons and enables the most free calls, scores closer to fifty or sixty percent.

For some applications, this quality difference is acceptable. For others—medication interaction checking, hospitalization risk prediction—it is not. Getting these analyses wrong could have clinical consequences.

But the key insight is that not every AI feature requires the highest quality model. A note autofill suggestion that is occasionally suboptimal is fine—the caregiver reviews and edits it anyway. A sentiment analysis that misses subtle patterns is acceptable—it is a screening tool, not a diagnostic one. A task prioritization that is directionally correct but imperfect is still useful.

We have been treating all AI features as equally critical, when in fact they exist on a spectrum from safety-critical to nice-to-have.

---

## The New Architecture

Based on this analysis, we are restructuring how Folk Care handles AI inference. The new approach has three tiers.

**Tier 1: Safety-Critical (Claude Required)**

Some features involve genuine clinical risk. Medication interaction checking must be accurate because errors could harm patients. Hospitalization risk prediction must be reliable because missed alerts could delay necessary intervention. For these features, we will continue using Claude Haiku, and self-hosters will need an Anthropic API key if they want them enabled.

The cost is justified by the stakes.

**Tier 2: Quality-Sensitive (Cloudflare Primary, Claude Optional)**

Many features benefit from higher quality but do not require it. Documentation quality scoring, compliance checking, revenue forecasting—these provide value even when occasionally imperfect, and users can catch errors in downstream review.

For these features, we will default to Cloudflare Workers AI, using Llama 3.2 for inference. Agencies that want higher quality can configure Claude as an alternative. Self-hosters get the feature for free, with the option to upgrade.

**Tier 3: Enhancement (Cloudflare Only)**

Some features are pure convenience. Note autofill suggestions, sentiment analysis, task prioritization—these make workflows faster but are not essential to care delivery. If the AI suggestions are sometimes suboptimal, users simply ignore them and proceed manually.

For these features, we will use Cloudflare Workers AI exclusively. They work out of the box, at no cost, for everyone.

---

## What This Means for Self-Hosters

The entire point of open source software is that anyone can run it. Folk Care exists because we believe home care infrastructure should be community-owned, not controlled by private equity firms extracting value from essential services.

If our AI features only work for people who can afford expensive API subscriptions, we have failed that mission.

Under the new architecture, a self-hosted Folk Care installation with no external API keys will have access to:

- Text embeddings for caregiver-patient matching
- Voice transcription for spoken visit notes
- Note autofill suggestions
- Sentiment analysis
- Task prioritization
- Documentation quality scoring
- Basic compliance checking
- Staffing demand forecasting
- Churn prediction
- Revenue forecasting

All of these will work using Cloudflare's free tier. The agency's only cost is the Cloudflare account, which is free.

For agencies that want the premium features—medication interaction checking, hospitalization risk prediction, higher-quality compliance analysis—they can add an Anthropic API key. Based on typical usage patterns, this would cost twenty to sixty dollars per month for a small agency, scaling with visit volume.

This is not perfect. In an ideal world, every feature would be free. But it represents a meaningful improvement over the current state, where self-hosting without an Anthropic key means no AI features at all.

---

## Implementation Timeline

We are implementing this restructuring in phases over the next several weeks.

**Phase 1 (Immediate):** Pause development of new Claude-only features. Every new AI capability will be designed with Cloudflare Workers AI as the default provider.

**Phase 2 (This Month):** Build an AI provider abstraction layer. This infrastructure will allow any AI feature to switch between Claude, Cloudflare, and potentially other providers (OpenAI, local Ollama instances) based on configuration.

**Phase 3 (January):** Migrate existing features to the tiered model. Each feature will be evaluated for its quality requirements and assigned to the appropriate tier.

**Phase 4 (February):** Add usage tracking and cost controls. Organizations will be able to see their AI usage, set quotas, and receive alerts when approaching limits.

**Phase 5 (March):** Release updated self-hosting documentation. This will include detailed guidance on configuring AI providers, estimated costs at various scales, and recommendations for different agency sizes.

---

## The Broader Pattern

This situation illustrates a tension that exists throughout software development in the AI era.

AI capabilities are transformative. They enable features that would have been impossible or impractical five years ago. Medication interaction checking that once required expensive pharmaceutical databases can now be implemented with a few hundred lines of code and an API call. Voice-to-text transcription that once required specialized hardware now runs in a browser.

But these capabilities come with ongoing costs. Unlike traditional software features, which work the same whether used once or a million times, AI features incur costs proportional to usage. The marginal cost of an AI inference is small—fractions of a cent—but it is not zero.

For SaaS products with per-user or per-patient pricing, these costs are easily absorbed. If an agency pays three hundred dollars per month for software, spending ten or twenty dollars on AI inference is manageable.

For open source products with community-focused pricing, the economics are harder. Our thirty-dollar flat fee was designed to be affordable for small agencies. It was not designed to subsidize hundreds of dollars in monthly API costs for large organizations.

We could solve this by raising prices. We could implement per-user or per-patient pricing like the incumbents. We could make AI features a premium add-on that costs extra.

We are choosing a different path: build on free infrastructure first, make paid infrastructure optional, and ensure that the core product remains accessible to everyone.

This is harder to implement. It requires maintaining multiple AI provider integrations instead of just one. It requires careful thought about which features genuinely need high-quality inference and which can work with more limited models. It requires documentation and configuration options that would be unnecessary if we simply mandated a single provider.

But it is the right choice for our mission. Folk Care exists to serve home care agencies, not to extract value from them. That commitment extends to AI costs, just as it extends to every other aspect of how we build and price our software.

---

## For Technical Readers

If you are a developer interested in the implementation details, here is what the AI provider abstraction looks like:

Each AI feature will accept a provider configuration that specifies which service to use. The default will be Cloudflare Workers AI for Tier 2 and Tier 3 features, with the option to override to Claude for higher quality.

```typescript
interface AIProviderConfig {
  provider: 'cloudflare' | 'anthropic' | 'openai' | 'ollama';
  model?: string;
  apiKey?: string;
  accountId?: string; // For Cloudflare
}
```

For self-hosted deployments, this configuration will be set through environment variables. For our managed SaaS, we will default to Claude for Tier 1 features and Cloudflare for others, with the ability to upgrade.

The Cloudflare Workers AI integration uses their REST API directly, avoiding the need for specialized SDKs:

```typescript
// Cloudflare Workers AI - FREE
await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.2-1b-instruct`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${apiToken}` },
  body: JSON.stringify({ prompt, max_tokens: 512 })
});
```

This approach keeps dependencies minimal and makes it easy to add new providers as the AI landscape evolves.

---

## What Comes Next

The AI features in Folk Care are just beginning. Over the coming months, we plan to add:

- Optimal visit frequency recommendations based on patient acuity and outcomes
- Care plan generation from clinical assessments
- Family communication summarization
- Schedule optimization using geographic clustering
- Billing anomaly detection
- And more

Every new feature will be designed with our tiered model in mind. Safety-critical capabilities will use Claude. Quality-sensitive capabilities will default to Cloudflare with Claude as an option. Enhancement features will use Cloudflare exclusively.

We believe this approach threads the needle between AI capability and accessibility. It gives everyone access to AI-powered features that make home care better. It reserves paid inference for situations where quality truly matters. And it ensures that Folk Care remains genuinely free to self-host, not just nominally free with hidden API costs.

---

*Folk Care is open source home care software. See it in action at [folk.care](https://folk.care/), read the code at [GitHub](https://github.com/neighborhood-lab/folkcare), or learn more at [about.folk.care](https://about.folk.care/).*
