# The Quiet Revolution in Home Care

## How Private Equity Captured a $50 Billion Industry—and What Comes Next

---

The home care industry in the United States generates approximately fifty billion dollars in annual revenue. It employs over four million workers. It serves roughly twelve million patients. And it is, by almost every measure that matters, fundamentally broken.

Not broken in the way a hospital might be broken—short-staffed or underfunded or overwhelmed. Broken in a structural sense. The incentives that govern the industry point in the wrong direction. The financial flows that sustain it extract value from the wrong places. The technology that powers it serves the wrong masters. The result is an industry where everyone involved—patients, families, caregivers, nurses, small business owners—struggles against a system designed to work against their interests.

This essay is an attempt to explain how we arrived at this moment, what the industry actually looks like today, and what a different future might be possible. It is also, inevitably, about [Folk Care](https://folk.care/), which is the software my organization builds. I will be honest about what we are and what we are not, because I believe honesty is ultimately more persuasive than salesmanship, and because anyone still reading at this point deserves to understand exactly what we are doing and why.

But before I can explain Folk Care, I need to explain the industry it exists within. And to explain the industry, I need to explain what home care actually is—which is different from what most people imagine when they hear the term.

---

## What Home Care Actually Is

When most people think of home care, they picture a nurse. This is understandable but incorrect. The vast majority of home care is provided not by nurses but by aides—workers with limited formal medical training who assist elderly and disabled people with what the industry calls "activities of daily living." Getting out of bed. Getting dressed. Getting to the bathroom. Bathing. Eating meals. Taking medications on schedule. The intimate, unglamorous, essential work of keeping a human being alive and dignified when their body or mind can no longer manage these tasks independently.

The terminology matters here because it is confusing. "Home health" typically refers to Medicare-certified skilled nursing visits—when an actual registered nurse or licensed practical nurse comes to someone's home to provide medical care. Wound treatment, injections, clinical assessments, that sort of thing. "Home care" or "home care services" typically refers to non-medical personal care assistance. "Private duty care" refers to care paid for privately rather than through insurance. "Hospice care" refers to end-of-life care provided in the home. "Pediatric home care" refers to care for children with complex medical needs.

The common thread across all of these is location: care provided where someone lives, rather than where medicine traditionally happens.

This distinction matters more than you might think. Hospitals and clinics are designed around the needs of institutions. The building is the center of gravity. Patients come to the building. Staff work in the building. Equipment lives in the building. Schedules revolve around the building's operating hours and the institution's workflows.

Home care inverts all of this. The patient's home is the center of gravity. Staff travel to the patient. Equipment must be portable or already present in the home. Schedules revolve around the patient's life, the lives of their family members, and the availability of the workers who will provide care.

This inversion creates problems that simply do not exist in institutional settings. How do you verify that a caregiver actually showed up to a patient's home at the scheduled time? In a hospital, employees badge in through a security system. In home care, the caregiver could be anywhere. How do you ensure clinical documentation is completed properly? In a clinic, there are computers on every desk and nurses can access records instantly. In home care, the caregiver might be in a basement apartment with no cellular signal, or in a rural farmhouse twenty miles from the nearest cell tower.

These problems created a market for software—software to track visits, verify locations, manage schedules, process billing, ensure regulatory compliance. And because the problems are real and the regulations increasingly stringent, home care agencies have essentially no choice but to use this software. They cannot operate legally without it.

When you have customers who cannot say no, you have an opportunity for extraction.

---

## The Shape of the Market

The home care software market is dominated by a small number of very large players. Understanding who they are and how they operate explains much of what has gone wrong in the industry.

WellSky is the largest. The company processes over thirty-four million billable visits per year through its home health platform alone. It serves more than twenty thousand clients across various care settings. It reports client retention rates of ninety-nine percent—a figure that sounds impressive until you understand that it reflects not customer satisfaction but the prohibitive cost of switching away from a system that controls years of patient records, billing history, and operational workflows.

WellSky was formed through a series of acquisitions—twenty-three of them at last count—that consolidated what was once a fragmented market of small software vendors into a single dominant platform. This consolidation was funded by private equity: first Thoma Bravo, then Leonard Green & Partners. The total capital raised exceeds six billion dollars.

The purpose of this consolidation was not to improve the software or reduce costs for customers. The purpose was to eliminate competition and raise prices. This is not speculation or inference. It is the explicit business model of private equity investment in software. You acquire competing products, merge them into a single platform, and then raise prices because customers have nowhere else to go. The technical term for this strategy is "platform consolidation." A more descriptive term would be "monopoly construction."

WellSky now commands starting prices of approximately eight hundred dollars per user per month for its home health software. For a small agency with ten staff members, this represents nearly one hundred thousand dollars per year in software costs alone—before you account for implementation fees, training costs, integration charges, and the inevitable upsells for "premium" features that should have been included in the base product. For a medium-sized agency with twenty-five users, three-year total cost of ownership can exceed eight hundred thousand dollars. For a larger operation with one hundred users, the figure approaches three million dollars over three years.

These are enormous sums for businesses that typically operate on margins of three to five percent. Many agencies spend more on software than they do on any other expense category except labor. And unlike labor, which directly produces value for patients, software spending primarily produces value for private equity investors.

The second major player is a company called Axxess. Axxess differs from WellSky in important ways: it is founder-led rather than purely private equity-owned, it emerged from the industry rather than being assembled through acquisitions, and it genuinely innovated on certain dimensions when it launched. The company now serves over nine thousand organizations, processes more than thirty-seven billion dollars in annual claims, and manages care for over seven million patients through its platform.

But Axxess is also venture capital-backed, which means it faces similar pressures to maximize revenue extraction. It uses census-based pricing—meaning agencies pay more as they serve more patients—which creates a structure where the software's cost grows precisely in proportion to an agency's success. This is a clever mechanism for capturing value that the agency creates rather than the software company. An agency that grows from fifty to five hundred patients might see their software costs increase tenfold, even though the software itself doesn't become ten times more expensive to provide.

Below these dominant players sit a handful of mid-market competitors. AxisCare, based in Waco, Texas, serves approximately thirty-three thousand users with an enterprise-focused platform. The company uses opaque "contact sales" pricing that makes cost comparison difficult by design—estimated at two hundred to ten thousand dollars per month depending on agency size and negotiating leverage. ShiftCare, an Australian company that has expanded globally, serves about sixty-five hundred agencies with more transparent pricing: eight to twenty-five dollars per user per month, depending on feature tier. Skedulo positions itself as a horizontal "deskless productivity cloud" rather than a home care-specific solution, charging thirty-nine to one hundred fifty dollars per user per month plus substantial implementation fees that can reach fifty thousand dollars.

What none of these companies have done—what the entire industry has failed to do—is ask a simple question: what if the software existed to serve the people using it, rather than to extract value from them?

---

## The Extraction Economy

To understand how extraction works in home care, you need to understand the industry's financial flows.

Medicare and Medicaid together fund the majority of home care services. When an agency provides care to a Medicare patient, they bill the federal government through a byzantine process involving diagnosis codes, OASIS assessments (that's Outcome and Assessment Information Set, a standardized data collection system), and detailed visit documentation. When they provide care to a Medicaid patient, they bill state governments through processes that vary dramatically by state.

For non-medical home care, payment typically comes from private individuals, long-term care insurance, or various state waiver programs designed to help people age in place rather than entering nursing homes.

In all of these payment streams, documentation is king. An undocumented visit essentially did not happen as far as payment is concerned. A visit documented incorrectly—wrong codes, wrong timing, missing signatures—may result in reduced payment or complete denial. A pattern of documentation problems can trigger audits, clawbacks of previously paid claims, or even exclusion from federal programs.

This documentation burden falls primarily on two groups: caregivers and clinical staff. Caregivers must clock in when they arrive at a patient's home and clock out when they leave, using Electronic Visit Verification (EVV) systems mandated by federal law since the 21st Century Cures Act of 2016. They must document the tasks they performed, the patient's condition, any observations that might be clinically relevant. Nurses must complete OASIS assessments—lengthy structured questionnaires that take hours to finish properly—and review caregiver documentation for clinical accuracy.

The software that handles all of this documentation is designed primarily for billing optimization, not for caregiver efficiency or patient care. Features are prioritized based on their revenue impact. User interfaces are designed for coders and billers who sit in offices, not for caregivers working on their phones in patients' living rooms. Documentation fields are structured around what payers want to see, not around what actually helps coordinate care.

This creates a perverse dynamic. The caregiver who spends twenty-three minutes fighting with a crashed app—her time does not show up in anyone's revenue calculations. The scheduler who develops stress-related health problems from managing three hundred visits per week—his wellbeing is not a line item in any software company's business model. The nurse who documents the same information in three different places because the systems were not designed for clinical workflows—her frustration is invisible to the people making product decisions.

Meanwhile, the software companies capture substantial portions of the industry's revenue without providing proportionate value. A large agency paying WellSky three million dollars over three years is not receiving three million dollars worth of scheduling assistance or documentation help. They are paying an extraction tax—a toll levied by a company that has positioned itself between the agency and its ability to operate legally.

The agencies, in turn, pass these costs along. To patients, in the form of higher prices for care. To caregivers, in the form of lower wages and worse working conditions. To small business owners, in the form of squeezed margins that make sustainable operation increasingly difficult.

And all of this flows upward, ultimately, to the private equity firms and venture capitalists who own these software companies and expect returns of twenty to thirty percent annually on their investments.

---

## The Caregiver Crisis

It is impossible to understand home care without understanding the workforce crisis at its center.

Home care aides earn a median wage of approximately fourteen dollars per hour. Adjusted for inflation, this is lower than what the same workers earned a decade ago. The job involves physical labor—lifting, transferring, assisting with mobility—that results in one of the highest injury rates of any occupation. It involves emotional labor—witnessing decline, managing confusion, providing comfort in difficult moments—that takes a psychological toll rarely acknowledged or compensated.

Turnover in the industry exceeds sixty percent annually. This means that in any given year, more than half of all caregivers leave their positions. They leave for better-paying work in retail or food service. They leave because the unpaid drive time between patients makes the effective wage lower than the nominal wage. They leave because they burn out from physical exhaustion and emotional depletion. They leave because they are treated as interchangeable units of labor rather than as professionals with skills and relationships.

This turnover is catastrophic for patients. Continuity of care matters enormously, particularly for elderly patients with cognitive decline. Seeing the same familiar face at the same familiar time provides stability and comfort that a rotating cast of strangers cannot replicate. Caregivers who know a patient's preferences, routines, and warning signs provide better care than caregivers meeting a patient for the first time.

It is also catastrophic for agencies. Recruiting and training a new caregiver costs between three thousand and five thousand dollars per hire. An agency with one hundred caregivers experiencing sixty percent turnover is spending two hundred thousand to three hundred thousand dollars annually just to maintain their workforce—before any investment in quality improvement or growth.

The software systems that dominate the industry do nothing to address this crisis. They track turnover as a metric but provide no tools to reduce it. They document hours worked but offer no features to ensure those hours are sustainable. They verify that visits occurred but provide no support for the relationships that make visits valuable.

Some vendors have added what they call "workforce engagement" features. WellSky offers a product called TeamEngage that provides gift card rewards for "exceptional performance" and "pulse surveys" to gauge satisfaction. This is the corporate equivalent of putting a suggestion box in the break room—a gesture toward caring that requires no structural change and produces no meaningful improvement.

---

## The Regulatory Labyrinth

Home care is one of the most heavily regulated industries in the American economy. This regulation is well-intentioned—intended to protect vulnerable patients from abuse, ensure quality of care, and prevent fraud against government programs. But the implementation has created a compliance burden that falls most heavily on the smallest operators while barely inconveniencing the largest.

The federal EVV mandate, which requires electronic verification of when caregivers arrive and depart from patient homes, took effect in 2020 for personal care services and 2023 for home health services. Every state has implemented this mandate differently, with different aggregator systems, different data requirements, and different enforcement mechanisms. An agency operating in a single state must master that state's specific requirements. An agency operating across state lines—which many agencies do, particularly in metropolitan areas that span state boundaries—must navigate multiple overlapping systems.

Texas uses a system called HHAeXchange as its EVV aggregator. Florida uses Sandata. Other states have made different choices. Each system has its own interface, its own data formats, its own quirks and failure modes. Software vendors must integrate with all of these systems, and they typically charge extra for multi-state compliance—turning regulatory requirements into additional revenue opportunities.

Beyond EVV, agencies face HIPAA privacy requirements, OASIS documentation requirements (for Medicare-certified home health), state licensing requirements that vary dramatically by jurisdiction, and ongoing compliance audits that can result in substantial penalties for relatively minor documentation failures.

Large agencies have compliance departments staffed with specialists who do nothing but navigate these requirements. Small agencies—the local, family-owned operations that often provide the most personalized care—must handle compliance as an additional burden on already-stretched staff. The owner who started the agency because she wanted to care for elderly people in her community now spends twenty hours per week on paperwork and regulatory documentation.

This regulatory complexity creates an inadvertent barrier to entry that protects incumbent players—including incumbent software vendors. A new competitor entering the market must invest heavily in compliance features before they can offer a viable product. A small agency considering a switch from their current software must evaluate not just features and price but whether the new system will maintain compliance across all the regulatory domains that govern their operations.

---

## The Technological Stagnation

Given the size of the market and the margins extracted by incumbent vendors, you might expect home care software to be sophisticated and rapidly evolving. You would be wrong.

The dominant platforms in the industry are, by modern software standards, archaic. They are built on architectures designed in the 2000s or earlier, with user interfaces that would have been dated a decade ago. They assume constant internet connectivity in an industry where caregivers routinely work in locations with no cellular signal. They require desktop computers for administrative functions in an industry where administrators increasingly work from mobile devices. They integrate poorly with other systems in an industry where interoperability—the ability to share data across organizational boundaries—is increasingly essential for coordinated care.

This technological stagnation is not accidental. It is the predictable result of the industry's ownership structure. Private equity investors have short time horizons—typically five to seven years between acquisition and exit. They are not incentivized to make long-term investments in technology infrastructure. They are incentivized to cut costs, raise prices, and maximize the appearance of value for the next buyer.

The result is a pattern that repeats across PE-owned software companies in various industries: aggressive sales and marketing, minimal investment in engineering, gradual degradation of product quality, and increasing customer frustration that has no outlet because switching costs are prohibitive.

This creates an opportunity for disruption. Not disruption in the Silicon Valley sense—a venture-backed startup that grows explosively, captures the market, and ultimately becomes the new extractive incumbent. Disruption in a different sense: the introduction of an alternative model that fundamentally changes the economics of the industry.

---

## What a Different Model Looks Like

[Folk Care](https://about.folk.care/) is open source home care software. "Open source" means the underlying code is publicly available. Anyone can see how it works. Anyone can modify it. Anyone can run it on their own servers without paying us anything. You can examine every line of code at [our GitHub repository](https://github.com/neighborhood-lab/folkcare).

This is unusual in healthcare software, where secrecy is the norm and vendor lock-in is the business model. We chose this approach for reasons both philosophical and practical.

The philosophical reasons: Software is infrastructure, like roads or water systems, and critical infrastructure should be owned by the communities that depend on it. Home care is critical infrastructure for an aging society. Home care software is critical infrastructure for home care. Therefore, home care software should be transparent, auditable, and community-controlled.

The practical reasons: We cannot outspend WellSky. We cannot outmarket them. We cannot out-salesforce them. But we can create something they cannot copy, because copying it would destroy their business model. We can build software that anyone can leave at any time, with all their data, no questions asked. We can build software where features are determined by the people using it rather than by investors demanding higher returns. We can build software that will still exist in twenty years because it does not depend on any single company's survival.

Folk Care is free to self-host. For agencies with technical capability, this means zero software cost forever. For agencies that prefer not to manage their own infrastructure, we offer cloud hosting for a flat fee of twenty to thirty dollars per month—not per user, not per patient, not per visit. A flat monthly fee for the entire agency, regardless of size.

We can offer this pricing because we have no investors demanding returns. We have no sales team taking customers to steak dinners. We have no trade show booths. We build software. We charge a fair price for hosting it. That is the entire business model.

If you want to see what Folk Care looks like before reading further, there is an [interactive showcase](https://showcase.folk.care/) where you can explore the software with realistic demo data, no login required. You can see scheduling, care plans, visit documentation, and the family portal.

---

## How Folk Care Works

The core function is scheduling. A home care agency might have fifty caregivers serving two hundred patients, with each patient receiving anywhere from a few hours per week to round-the-clock coverage. Someone has to determine which caregiver goes where, when, and for how long. This person—usually called the scheduler or care coordinator—holds one of the most stressful positions in any home care agency.

Good scheduling is not merely filling time slots. It requires considering geography, because caregivers need time to travel between patients and that time is typically unpaid, making travel minimization both an ethical imperative and an economic one. It requires considering relationships, because patients do better when they see the same caregivers consistently, and caregivers do better when they work with patients whose needs align with their skills and temperament. It requires considering availability, because caregivers have lives outside work and their schedules change. It requires handling emergencies, because caregivers get sick, patients have crises, and the whole puzzle must be reassembled without warning.

Folk Care handles all of this. More importantly, it handles it in a way that reduces cognitive burden rather than adding to it. The software suggests optimal matches. It alerts when something is about to go wrong. It learns patterns over time and improves at predicting problems before they occur.

The second core function is Electronic Visit Verification. This is a federal requirement: any agency receiving Medicaid funding must electronically verify that visits actually occurred. The caregiver clocks in when arriving at a patient's home and clocks out when leaving, with the system capturing location data to prove presence.

EVV is a compliance requirement, not a clinical one. It exists because Medicaid fraud is a real problem, and electronic verification makes fraud harder. But the implementation has created enormous headaches for caregivers and agencies. The apps often malfunction. Location verification fails in buildings with poor cellular service—which includes many of the homes where elderly patients live. Documentation requirements consume time that could go to actual care.

Folk Care's approach to EVV is to make it invisible. The caregiver opens the app, taps a button, and the system handles the rest. If connectivity is poor, data is captured locally and synced later. If something goes wrong, the system identifies exactly what information it needs and asks for only that, rather than forcing the caregiver to start over from the beginning. We support all fifty states, including the specific requirements of state aggregators like Texas HHAeXchange and Florida Sandata.

The third core function is care plan management. A care plan specifies what care a patient should receive: which medications, which activities, which observations, which precautions. Care plans are created by nurses and followed by caregivers. They must be updated when conditions change. They must be accessible to everyone involved in the patient's care.

Folk Care treats care plans as living documents rather than compliance paperwork. Caregivers can access care plans on their phones, even when offline. They can document observations in plain language, using voice-to-text when typing is inconvenient. The system ensures documentation meets regulatory requirements without requiring caregivers to think about regulations.

The fourth core function is the family portal. Family members—typically adult children caring for elderly parents—want to know what is happening with their loved one's care. They want to see the schedule. They want to know when visits occurred. They want to communicate with caregivers and the agency. They want visibility into a situation that otherwise feels completely out of their control.

Folk Care provides this visibility. Family members can log in to see upcoming visits, past visit notes with appropriate privacy controls, and the current care plan. They can send messages to caregivers and coordinators. They receive notifications when visits complete. The goal is peace of mind—or at least as much peace of mind as technology can provide.

---

## The Differences That Matter

I have described what Folk Care does. Now let me describe how it differs from alternatives, because the difference in approach matters more than any particular feature.

The dominant paradigm in home care software is what I call "billing-first design." The software is architected around maximizing reimbursement. Features are prioritized based on revenue impact. User interfaces are designed for coders and billers rather than for caregivers and patients. Documentation requirements are shaped by what payers want to see, not by what actually helps coordinate care.

This makes sense from a narrow business perspective. Home care agencies make money from billing. Software that increases billing is worth more to agencies. Software companies are rewarded for building features that increase billing.

But it creates terrible software for the people who actually use it daily. And it creates perverse incentives that ultimately harm patient care.

Folk Care takes a different approach. Every feature we build starts with a question: how does this help the person doing the work? Not "how does this help the agency bill more." Not "how does this check a compliance box." How does this make a caregiver's day better? How does this make a scheduler's job easier? How does this make a nurse's documentation clearer?

If a feature does not answer one of these questions affirmatively, we do not build it.

This sounds obvious. It is not obvious in practice. It requires actively resisting the gravitational pull of billing optimization. It requires making decisions that might not maximize short-term revenue. It requires listening to the people actually doing the work rather than just the people signing contracts. Our [community Discord](https://discord.gg/EkeXQZFq) is where much of this listening happens—caregivers and schedulers and nurses telling us what they actually need.

---

The second major difference is what I call "offline-first architecture."

Most home care software assumes constant internet connectivity. This assumption is empirically false. Caregivers work in basements. They work in rural areas. They work in old buildings with thick walls and no cellular signal. They work wherever their patients live, and their patients live in all kinds of places.

When you design software that assumes constant connectivity, you create software that fails in exactly the situations where failure is most costly. The caregiver who cannot clock in because there is no signal. The nurse who cannot access the care plan because the building lacks wifi. The visit notes that vanish because the app crashed before synchronization.

Folk Care is designed to work completely offline. The mobile app downloads everything needed before the caregiver leaves for their shift. Visit documentation is stored locally and synchronized when connectivity returns. Nothing depends on having a signal at the moment it is needed.

This is not a minor technical detail. It required architectural decisions made at the very beginning of the project. It is extremely difficult—in many cases essentially impossible—to retrofit offline capability into software designed around constant connectivity. This is why none of our competitors offer true offline functionality: they would have to rebuild their entire architecture, which is prohibitively expensive.

---

The third major difference is our approach to artificial intelligence.

There is enormous excitement in the healthcare industry about artificial intelligence. Much of this excitement is warranted. Machine learning can identify patterns that humans miss. Natural language processing can automate tedious documentation. Predictive models can flag patients at risk before crises occur.

But most healthcare AI is being built to serve institutions, not workers. The applications that attract funding are surveillance applications: monitoring whether caregivers wash their hands, tracking whether nurses are "productive," analyzing worker behavior for signs of fraud or negligence.

This is a choice. It is not inevitable. The same technologies could be used to help workers rather than surveil them.

Folk Care's AI helps workers. Voice-to-text transcription lets caregivers dictate notes in natural language instead of typing on small screens with cold fingers. Smart prompting notices when a caregiver mentions something clinically significant and asks whether they want to flag it for the nurse. Documentation assistance ensures notes meet regulatory requirements without forcing caregivers to think about regulations.

We are also building predictive capabilities, but oriented toward helping workers and patients rather than surveilling them. Systems to detect early signs of patient decline—subtle changes in visit patterns or care notes that might indicate a need for clinical attention. Systems to identify caregivers at risk of burnout—patterns in hours and cancellations that might indicate someone about to quit. Systems to optimize schedules in ways that respect caregiver preferences and patient relationships, not just minimize costs.

The principle is simple: AI should reduce the burden on workers, not add to it. It should help people do their jobs, then get out of the way.

---

The fourth major difference is our approach to data and ownership.

In the traditional software industry, your data functionally belongs to the software vendor, not to you. Even when the legal ownership is nominally yours, if you cannot export it in a usable format, you do not really own it in any practical sense.

This creates vendor lock-in. Once you have accumulated years of patient records, visit histories, billing data, and care documentation in a particular system, switching becomes prohibitively difficult. The old vendor knows this. They price accordingly.

Folk Care takes the opposite approach. Your data is yours. You can export everything, anytime, in standard formats: JSON for structured data, CSV for spreadsheets, FHIR (Fast Healthcare Interoperability Resources) for healthcare systems that speak that language. We will help you migrate to a competitor if you want to leave. We have published documentation on exactly how to do it.

This seems self-defeating from a business perspective. Why would we help customers leave?

The answer is that customers who know they can leave are customers who stay by choice. They stay because the software is good, not because leaving is hard. This creates better incentives for us. If customers can leave easily, we must keep making the software better. We cannot become complacent. We cannot raise prices arbitrarily. We must earn their business every month.

---

## The Industry in Numbers

Let me now synthesize what we have learned from analyzing the major players in this market, because the numbers reveal patterns that individual stories obscure.

WellSky: Over one billion dollars in annual revenue. Twenty thousand clients. Ninety-nine percent retention rate. Twenty-three acquisitions. Estimated starting prices around eight hundred dollars per user per month. Private equity ownership through Thoma Bravo and Leonard Green & Partners. Total capital raised exceeding six billion dollars.

Axxess: Nine thousand organizations. Seven million patients. Eight hundred thousand users. Thirty-seven billion dollars in claims processed. Census-based pricing that scales with agency growth, with estimated costs ranging from five hundred to fifteen thousand dollars per month depending on patient volume. Founder-led but venture-backed.

AxisCare: Thirty-three thousand users. Enterprise-focused positioning. "Contact sales" pricing model that obscures actual costs, with estimates ranging from two hundred to over ten thousand dollars per month. Technology stack includes extensive third-party integrations but no true open architecture.

ShiftCare: Sixty-five hundred agencies globally. Australian origin with global expansion. Transparent pricing from eight to twenty-five dollars per user per month, with a five-staff minimum. Combined home care and intellectual and developmental disability support.

Skedulo: Horizontal "deskless productivity cloud" rather than home care-specific. Pricing from thirty-nine to one hundred fifty dollars per user per month, plus implementation fees from five thousand to fifty thousand dollars. Salesforce-native architecture limits flexibility.

Folk Care: Open source under AGPL-3.0 license. Free to self-host. Cloud hosting for twenty to thirty dollars per month flat rate, regardless of user count. Fifty-state EVV compliance. Full data export in standard formats. Community-owned development.

The pattern is unmistakable. The incumbent vendors charge between two hundred and eight hundred dollars per user per month. For a small agency with ten staff members, this means twenty-four thousand to ninety-six thousand dollars annually. For a medium agency with fifty staff, one hundred twenty thousand to four hundred eighty thousand dollars. For a larger agency with one hundred staff, two hundred forty thousand to nearly one million dollars per year.

Folk Care's flat thirty-dollar monthly fee represents a cost reduction of ninety-seven to ninety-nine percent for most agencies. A ten-person agency paying sixty thousand dollars annually to WellSky could instead pay three hundred sixty dollars. A fifty-person agency paying three hundred thousand could pay three hundred sixty dollars. A hundred-person agency approaching a million in annual software costs could pay three hundred sixty dollars.

These are not marginal savings. These are transformative savings—savings large enough to fund substantial caregiver wage increases, invest in quality improvement, or simply allow thin-margin operations to survive.

---

## The Coming Transformation

Everything I have written so far describes the present. But the future is arriving faster than most people in this industry understand.

The field of artificial intelligence is advancing at an extraordinary pace. Current large language models can already draft documentation, summarize clinical notes, and engage in sophisticated conversations about patient care. Within the next two years, AI systems will be capable of handling routine administrative tasks that currently consume hours of human labor each day.

This has profound implications for the home care industry—implications that the incumbent vendors are not prepared to address.

Consider documentation. Currently, caregivers spend substantial portions of their visits typing notes on small screens, trying to remember the exact phrasing that satisfies billing requirements while also conveying clinically relevant information. This is wasteful in multiple dimensions: it takes time away from actual care, it frustrates caregivers, and it produces documentation that is often more performative than useful.

Within the next year or two, AI systems will be able to listen to a caregiver's natural-language description of a visit and automatically generate compliant documentation. "We got Mrs. Johnson out of bed, she seemed a little unsteady today, we helped her to the bathroom and she ate about half her breakfast" becomes a properly formatted visit note with the appropriate codes and flags, reviewed by the caregiver for accuracy before submission.

This is not speculation. The underlying technology already exists. The question is whether the software vendors serving home care will deploy it in ways that help workers, or in ways that surveil and control them.

Consider scheduling. Currently, coordinators spend hours each week assembling the puzzle of caregiver availability, patient needs, travel times, and relationship preferences. Much of this work could be automated—not replacing the coordinator's judgment, but augmenting it, handling the tedious mechanics while the coordinator focuses on the human elements that require human understanding.

Consider clinical monitoring. Currently, early signs of patient decline often go unnoticed until a crisis occurs. AI systems analyzing patterns across visit notes, vital signs, and behavioral observations could flag concerning trends days or weeks earlier, enabling preventive intervention rather than emergency response.

The question is not whether these capabilities will arrive. They will. The question is who will control them.

If the incumbent vendors control AI deployment in home care, they will use it to deepen lock-in, increase prices, and enhance surveillance of workers. They will treat AI as another premium feature to upsell rather than as infrastructure to democratize.

If the open source community controls AI deployment, the benefits can flow to workers and patients rather than to private equity investors. AI can reduce rather than increase the power imbalance between software vendors and their captive customers.

This is why open source matters. Not as an abstract ideological commitment, but as a practical mechanism for ensuring that transformative technology serves the people who depend on it.

---

## The Long View

I have been writing about software features and market dynamics, but the real story is larger than any of this.

Home care is infrastructure. It is the system that allows elderly people to remain in their homes rather than entering institutions. It is the system that allows families to work and maintain their own lives while their loved ones receive care. It is the system that provides employment to four million workers, disproportionately women, disproportionately immigrants, disproportionately people of color.

This infrastructure is under stress. The population is aging rapidly. The number of people over 65 will nearly double by 2060, while the working-age population grows much more slowly. This means more people needing care and relatively fewer people available to provide it.

The response to this demographic reality will shape American society for the rest of this century. We can invest in home care—raising wages, improving working conditions, deploying technology that helps workers do more—and enable millions of people to age with dignity in their homes. Or we can continue on the current path—extracting value, suppressing wages, treating technology as a tool for control—and watch the system gradually collapse under demographic pressure.

Private equity has no long-term stake in this outcome. Their investment horizons are five to seven years. What happens to the home care industry in 2040 or 2050 is not their concern.

Communities have a long-term stake. The agencies that will still be operating in thirty years care about building sustainable systems. The workers who will still be doing this work care about whether it becomes a viable career. The families who will need this care care about whether it will be available and affordable.

This is why community ownership matters. Open source is the legal mechanism that enables it. When software is released under the AGPL-3.0 license, it belongs to everyone. No one can take it away. No one can lock it up. No one can use it to extract value without contributing back.

This changes the incentive structure fundamentally. A privately-owned software company has an incentive to lock in customers and raise prices. A community-owned codebase has the opposite incentive: to be useful to as many people as possible, because the more people who use it and contribute to it, the better it becomes for everyone.

---

## What Comes Next

The near-term roadmap for Folk Care focuses on three priorities.

First, intelligence. Not artificial intelligence in the science-fiction sense, but practical intelligence: software that learns patterns, predicts problems, and helps humans make better decisions. Caregiver burnout detection—identifying patterns in hours and cancellations that might indicate someone at risk of quitting. Patient decline indicators—flagging subtle changes in visit notes that might warrant clinical attention. Schedule optimization that considers not just logistics but relationships.

Second, interoperability. Home care does not exist in isolation. Patients have primary care physicians who need to know what is happening at home. They take medications that need to be reconciled and refilled. They may be discharged from hospitals with care needs that must be addressed. They may be enrolled in insurance programs requiring specific documentation. Currently, most of these connections are handled manually—someone printing a care plan and faxing it to a doctor's office, someone calling a pharmacy to clarify a prescription, someone entering the same information into multiple systems that do not communicate. Folk Care will speak the standard languages of healthcare data exchange: HL7 version 2 for legacy systems, FHIR for modern ones.

Third, shared infrastructure. This is the long-term vision. Imagine if every locally-owned home care agency could benefit from collective bargaining with payers—not each agency negotiating alone, but a network of agencies sharing data that demonstrates when rates are unsustainable. Imagine if training resources were pooled rather than each agency developing materials from scratch. Imagine if benchmarking data let small operators understand how they compare to similar agencies without surrendering competitive intelligence to a private vendor. Imagine if a patient moving across the country could be referred to another agency in the network with care records transferring seamlessly.

This is the endgame: not a software company, but cooperative infrastructure for independent home care. A structure that lets small operators compete against giants because they have access to the same tools and data and bargaining power that only large organizations can currently afford.

---

## The Stakes

There are four million people in the United States who work as home care aides. They earn a median wage of fourteen dollars per hour. They have one of the highest injury rates of any occupation. They have one of the highest turnover rates. They are disproportionately women, disproportionately immigrants, disproportionately people of color. They are, in a very real sense, invisible to most of American society.

But here is what they do: they keep people alive. They allow elderly people to remain in their homes, with dignity, surrounded by familiar things and memories. They allow families to work and live knowing that someone is caring for their loved one. They provide human connection that no institution can replicate—the same familiar face at the same familiar time, knowledge of preferences and routines, relationships that develop when one person cares for another over months and years.

This work is essential. It will become more essential as the population ages. And it is being crushed by an industry structure that treats workers as costs to be minimized and patients as billing codes to be maximized.

There are twelve million people in the United States receiving home care. They are someone's mother or father, grandmother or grandfather, husband or wife. They are people who lived full lives, raised families, built careers, contributed to communities. They deserve to be treated as people, not as revenue opportunities.

This is what is at stake. Not software features or market share or competitive positioning. Human beings. Millions of them. Workers and patients and families, all caught in a system optimized for extraction rather than care.

---

## The Invitation

We can build something better. That is what [Folk Care](https://folk.care/) is. That is what this movement is. An alternative to extraction. A structure that serves the people who depend on it. Infrastructure for an industry that desperately needs it.

The giants have money and salespeople and market share. They have private equity backing and venture capital funding and twenty-three acquisitions worth of consolidated power.

We have something different. We have alignment. Everyone who uses Folk Care benefits when Folk Care improves. Everyone who contributes to Folk Care benefits when others contribute. Everyone who depends on home care—workers, patients, families, small business owners—benefits when the infrastructure is owned by the community rather than by investors demanding returns.

This alignment is more powerful than money in the long run. It is more durable than market share. It is the foundation on which something lasting can be built.

The caregiver earning fourteen dollars an hour will still wake up early tomorrow morning. She will still think about her patients, because that is who she is: someone who thinks about the people she cares for.

But maybe, eventually, the software will stop crashing. Maybe documentation will take five minutes instead of twenty-three. Maybe the agency will save enough on software costs to give her a raise. Maybe the system will notice when she is burning out and intervene before she breaks.

Maybe, eventually, the industry will be rebuilt around the people who do the work and receive the care, rather than around the investors who extract value from both.

That is the revolution. It is quiet. It is slow. It is built one feature at a time, one agency at a time, one caregiver and one patient at a time.

But it is happening. And you can be part of it.

---

*Brian Edwards is the founder of [Neighborhood Lab](https://neighborhoodlab.org) and the creator of Folk Care. He can be reached at brian.mabry.edwards@gmail.com or 512-584-6841.*

*Folk Care is open source home care software:*
- *Try it: [folk.care](https://folk.care/)*
- *Interactive demo: [showcase.folk.care](https://showcase.folk.care/)*
- *Learn more: [about.folk.care](https://about.folk.care/)*
- *Source code: [github.com/neighborhood-lab/folkcare](https://github.com/neighborhood-lab/folkcare)*
- *Community: [Discord](https://discord.gg/EkeXQZFq)*

*Support this work:*
- *[Patreon](https://www.patreon.com/cw/neighborhood_lab)*
- *[GitHub Sponsors](https://github.com/sponsors/neighborhood-lab)*
- *Subscribe to [this newsletter](https://neighborhoodlab.substack.com/) for updates*

*If you operate a home care agency and want to learn more about Folk Care, or if you are a caregiver, nurse, or family member with thoughts on what care software should do, reach out. We build this with you, not for you.*
