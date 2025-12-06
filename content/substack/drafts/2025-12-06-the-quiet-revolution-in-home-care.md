# The Quiet Revolution in Home Care

## How Private Equity Captured an Industry—and Why a Movement of Independent Operators Is Taking It Back

---

There is a woman in Austin, Texas, who wakes up every morning at 4:30 to begin her rounds. She is fifty-three years old. She has been a home caregiver for nineteen years. She earns fourteen dollars an hour, which is two dollars more than she earned when she started, if you don't adjust for inflation. If you do adjust for inflation, she has taken a pay cut every single year for nearly two decades.

She doesn't think about this. She thinks about Mrs. Patterson, who needs help getting out of bed and into the bathroom before her daughter arrives at seven. She thinks about Mr. Chen, who will be confused when she arrives because he always forgets that his wife passed away, and she will have to remind him gently, again, as she does every Tuesday and Thursday. She thinks about the twelve-minute drive between their homes, which she will not be paid for, and the documentation she must complete on her phone, in her car, before she can clock out—documentation that takes nine minutes if everything works correctly and twenty-three minutes if the app crashes, which it does about once a week.

The app is made by a company called WellSky. WellSky has revenues exceeding one billion dollars annually. WellSky is owned by two private equity firms, Thoma Bravo and Leonard Green & Partners. WellSky charges the agency that employs this caregiver approximately eight hundred dollars per user per month for the privilege of using their software. The agency passes this cost along in various ways, one of which is paying their caregivers fourteen dollars an hour instead of something approaching a living wage.

The caregiver does not know any of this. She knows the app crashes. She knows the interface is confusing. She knows that when she finally gets home at seven in the evening, she is too tired to do anything but eat dinner and go to sleep, only to wake up again at 4:30 the next morning.

This essay is about her. It is also about the family who hired the agency to care for Mrs. Patterson. It is about the small business owner who runs that agency, who lies awake at night wondering how much longer she can compete against companies with unlimited resources. It is about the nurse who supervises the caregiver's work and documents it all in triplicate because that's what the regulations require. It is about the scheduler who manages three hundred visits a week and has developed an ulcer from the stress of it.

Most importantly, this essay is about what happens when an entire industry is captured by financial interests that have no particular expertise in, or affection for, the work itself—and what a small group of people are doing to take it back.

---

To understand how we arrived at this moment, you have to understand what home care actually is, which is different from what most people imagine.

When people think of home care, they typically picture a nurse. This is wrong. The vast majority of home care is provided not by nurses but by aides—workers with little formal medical training who help elderly and disabled people with what the industry calls "activities of daily living." Getting out of bed. Getting dressed. Getting to the bathroom. Eating meals. Taking medications. Basic hygiene. The unglamorous, intimate work of keeping a human being alive and dignified when their body or mind can no longer manage these things alone.

There are also skilled nursing visits, which is the term for when an actual nurse comes to the home to provide medical care—wound treatment, injections, assessments, that sort of thing. And there is hospice care, which is end-of-life care provided in the home. And there is pediatric home care, which is care for children with complex medical needs. The home care industry encompasses all of these, plus physical therapy visits, occupational therapy visits, speech therapy visits, and various other services that can be provided in a person's home rather than in a hospital or clinic.

The common thread is this: care provided where someone lives, rather than where medicine traditionally happens.

This distinction matters more than you might think. Hospitals and clinics are designed around the needs of institutions. The building is the center of gravity. Patients come to the building. Staff work in the building. Equipment lives in the building. Schedules revolve around the building's operating hours.

Home care inverts all of this. The patient's home is the center of gravity. Staff travel to the patient. Equipment must be portable or already present in the home. Schedules revolve around the patient's life, and the lives of their family members, and the availability of the workers who will provide the care.

This inversion creates problems that don't exist in institutional settings. How do you verify that a caregiver actually showed up to a patient's home at the scheduled time? In a hospital, you badge in. In home care, you could be anywhere. How do you ensure documentation is completed? In a clinic, there are computers on every desk. In home care, the caregiver might be in a basement with no cell signal.

These problems created a market for software—software to track visits, to verify locations, to manage schedules, to process billing, to ensure compliance with regulations. And because the problems are real and the regulations are stringent, home care agencies have no choice but to use this software. They are captive customers.

When you have captive customers, you have an opportunity for extraction.

---

The home care software market is dominated by a small number of very large players, and understanding who they are and how they operate explains much of what has gone wrong in the industry.

WellSky is the largest. The company was formed through a series of acquisitions—twenty-three of them, by the company's own count—that consolidated what was once a fragmented market of small software vendors into a single dominant platform. This consolidation was funded by private equity: first Thoma Bravo, then Leonard Green & Partners. The purpose of this consolidation was not to improve the software or reduce costs for customers. The purpose was to eliminate competition and raise prices.

This is not speculation. It is the explicit business model of private equity investment in software. You buy competing products, merge them into a single platform, and then raise prices because customers have nowhere else to go. The technical term for this is "platform consolidation." A more accurate term would be "monopoly construction."

WellSky now commands starting prices of approximately eight hundred dollars per user per month. For a small agency with ten staff members, this represents nearly one hundred thousand dollars per year in software costs alone—before you account for implementation fees, training costs, integration charges, and the inevitable upsells. This is an enormous sum for businesses that typically operate on margins of three to five percent.

The second-largest player is a company called Axxess. Axxess is founder-led, which distinguishes it from WellSky, but it is also venture capital-backed, which means it faces similar pressures to maximize revenue extraction. Axxess uses a different pricing model—census-based pricing, which means you pay more as you serve more patients—but the effect is similar: as your business grows, so does your software bill, in a way that captures much of the value your growth creates.

Below these giants are a handful of mid-market players. A company called AxisCare serves about thirty-three thousand users. A company called ShiftCare serves about six thousand agencies. These companies are generally more transparent about pricing—ShiftCare charges between eight and twenty-five dollars per user per month, depending on features—but they are still proprietary, still cloud-only, and still designed primarily around the needs of the software company rather than the needs of the workers using the software.

What none of these companies have done is ask a simple question: what if the software existed to serve the people using it, rather than to extract value from them?

---

This is where I need to introduce [Folk Care](https://folk.care/), which is the software my organization builds. I am going to be honest with you about what it is and what it isn't, because I believe honesty is more valuable than salesmanship, and because if you're still reading at this point, you deserve to know exactly what we're doing and why.

Folk Care is open source home care software. "Open source" means the underlying code is publicly available. Anyone can see how it works. Anyone can modify it. Anyone can run it on their own servers without paying us anything. You can examine every line of code on [our GitHub repository](https://github.com/neighborhood-lab/folkcare).

This is unusual in healthcare software, where secrecy is the norm and vendor lock-in is the business model. We chose this approach for philosophical reasons and practical ones.

The philosophical reasons: we believe software is infrastructure, like roads or water systems, and should be treated as such. Critical infrastructure should be transparent, auditable, and ultimately controlled by the communities that depend on it. Home care is critical infrastructure for an aging society, and home care software is critical infrastructure for home care. Therefore, home care software should be transparent, auditable, and community-controlled.

The practical reasons: we cannot outspend WellSky. We cannot outmarket them. We cannot out-salesforce them. But we can make something they cannot copy, because copying it would destroy their business model. We can make software that anyone can leave at any time, with all their data, no questions asked. We can make software where the features are determined by the people using it rather than by investors demanding higher returns. We can make software that will still be around in twenty years, because it doesn't depend on any single company's survival.

Folk Care is free to self-host, meaning if you have the technical ability to run it on your own servers, you pay nothing. For those who prefer not to manage their own infrastructure, we offer a cloud-hosted version for a flat fee of twenty to thirty dollars per month—not per user, not per patient, just a flat monthly fee for the entire agency.

We can offer this pricing because we have no investors demanding returns. We have no sales team taking customers to steak dinners. We have no trade show booths to staff. We build software. We charge a fair price for hosting it. That's the entire business model.

---

Now I need to explain what Folk Care actually does, because "home care software" is a vague category that could mean many things. If you want to see for yourself before reading further, there's an [interactive showcase](https://showcase.folk.care/) where you can explore the software with realistic demo data, no login required.

The core function is scheduling. A home care agency might have fifty caregivers serving two hundred patients, with each patient receiving anywhere from a few hours of care per week to round-the-clock coverage. Someone has to figure out which caregiver goes where, and when, and for how long. This person is called the scheduler, and the scheduler's job is one of the most stressful roles in any home care agency.

Good scheduling is not just filling time slots. It requires considering geography, because caregivers need time to travel between patients, and that time is usually unpaid, so minimizing travel is both an ethical imperative and an economic one. It requires considering relationships, because patients do better when they see the same caregivers consistently, and caregivers do better when they're matched with patients whose needs align with their skills and temperament. It requires considering availability, because caregivers have lives outside of work and their schedules change. It requires handling emergencies, because caregivers get sick, patients have crises, and the whole puzzle has to be reassembled at a moment's notice.

Folk Care handles all of this. But more importantly, Folk Care handles it in a way that reduces the cognitive burden on the scheduler rather than adding to it. The software suggests optimal matches. It alerts when something is about to go wrong. It learns patterns over time and gets better at predicting problems before they occur.

The second core function is Electronic Visit Verification, which everyone in the industry calls EVV. This is a federal requirement: any agency that receives Medicaid funding must electronically verify that visits actually occurred. The caregiver must clock in when they arrive at a patient's home and clock out when they leave, and the system must capture location data to prove they were actually there.

EVV is a compliance requirement, not a clinical one. It exists because Medicaid fraud is a real problem, and electronic verification makes fraud harder. But the implementation of EVV has created enormous headaches for caregivers and agencies. The apps often don't work. The location verification fails in buildings with poor cell service, which includes many of the homes where elderly patients live. The documentation requirements take time away from actual care.

Folk Care's approach to EVV is to make it invisible. The caregiver opens the app, taps a button, and the system handles the rest. If they're in a location with poor service, the data is captured locally and synced later. If something goes wrong, the system knows what information it needs and asks for only that, rather than forcing the caregiver to start over. The goal is compliance with minimal friction—do what the law requires without making the caregiver's day worse. We support all fifty states, including the specific requirements of Texas HHAeXchange and Florida Sandata.

The third core function is care plan management. A care plan is a document that specifies what care a patient should receive: which medications, which activities, which observations, which precautions. Care plans are created by nurses and followed by caregivers. They need to be updated when patient conditions change. They need to be accessible to everyone involved in the patient's care.

Folk Care treats care plans as living documents rather than compliance paperwork. Caregivers can access care plans on their phones, even offline. They can document what they observed and what they did in plain language, using voice-to-text if typing is inconvenient. The system helps ensure documentation meets regulatory requirements without requiring caregivers to think about regulations.

The fourth core function is the family portal. Family members of patients—typically adult children—want to know what's happening with their loved one's care. They want to see the schedule. They want to know when visits happened. They want to communicate with caregivers and the agency. They want visibility, because they are terrified and exhausted and trying to do right by someone they love.

Folk Care provides this visibility. Family members can log in and see upcoming visits, past visit notes (with appropriate privacy controls), and the current care plan. They can send messages to caregivers and coordinators. They receive notifications when visits complete. They have peace of mind—or at least as much peace of mind as technology can provide.

These are the core functions. There are others—billing, reporting, compliance tracking, medication management—but they build on this foundation of scheduling, verification, care plans, and family communication.

---

I have described what Folk Care does. Now I want to describe how it does things differently, because the difference in approach matters more than any particular feature.

The dominant paradigm in home care software is what I call "billing-first design." The software is architected around the goal of maximizing reimbursement. Features are prioritized based on their revenue impact. User interfaces are designed for coders and billers, not for caregivers and patients. Documentation requirements are shaped by what payers want to see, not by what actually helps with care.

This makes sense from a business perspective. Home care agencies make money from billing. Software that increases billing is worth more to agencies. Software companies are rewarded for building features that increase billing.

But it creates terrible software for the people who actually use it. The caregiver in Austin who spends twenty-three minutes fighting with an app that crashed—her time doesn't show up in revenue calculations. The scheduler who develops an ulcer from stress—his health isn't a line item in anyone's business model. The nurse who documents the same information in three different places because the system wasn't designed for clinical workflows—her frustration is invisible to the people making product decisions.

Folk Care takes a different approach, which I call "worker-first design." Every feature we build starts with a question: how does this help the person doing the work?

Not "how does this help the agency bill more." Not "how does this check a compliance box." How does this make a caregiver's day better? How does this make a scheduler's job easier? How does this make a nurse's documentation clearer? If a feature doesn't answer one of these questions affirmatively, we don't build it.

This sounds obvious. It is not obvious in practice. It requires actively resisting the gravitational pull of billing optimization. It requires making decisions that might not maximize short-term revenue. It requires listening to the people actually doing the work, rather than just the people signing the contracts. Our [community Discord](https://discord.gg/EkeXQZFq) is where much of this listening happens—caregivers and schedulers and nurses telling us what they actually need.

---

The second difference in approach is what I call "offline-first architecture."

Most home care software assumes constant internet connectivity. This assumption is wrong. Caregivers work in basements. They work in rural areas. They work in old buildings with thick walls and no cell signal. They work wherever their patients live, and their patients live in all kinds of places.

When you design software that assumes constant connectivity, you create software that fails in exactly the situations where failure is most costly. The caregiver who can't clock in because there's no signal. The nurse who can't access the care plan because the building has no wifi. The visit notes that get lost because the app crashed before they could sync.

Folk Care is designed to work completely offline. The mobile app downloads everything it needs before the caregiver leaves for their shift. Visit documentation is stored locally and synced when connectivity returns. Nothing depends on having a signal at the moment it's needed.

This is not a minor technical detail. It required architectural decisions made at the very beginning of the project. It is extremely difficult to retrofit offline capability into software that was designed around connectivity. This is why none of our competitors offer true offline functionality: they would have to rebuild their entire architecture, which is prohibitively expensive.

---

The third difference is our approach to artificial intelligence.

There is a lot of excitement in the healthcare industry about artificial intelligence. Much of this excitement is warranted. Machine learning can identify patterns that humans miss. Natural language processing can automate tedious documentation. Predictive models can flag patients at risk before crises occur.

But most healthcare artificial intelligence is being built to serve institutions, not workers. The applications that get funding are surveillance applications: monitoring whether caregivers wash their hands, tracking whether nurses are "productive," analyzing worker behavior for signs of fraud or negligence.

This is a choice. It is not inevitable. The same technologies could be used to help workers rather than surveil them.

Folk Care's artificial intelligence helps workers. Our voice-to-text transcription lets caregivers dictate notes in natural language instead of typing on tiny screens. Our smart prompting notices when a caregiver mentions something clinically significant and asks if they want to flag it for the nurse. Our documentation assistance ensures notes meet regulatory requirements without requiring caregivers to think about regulations.

We are also building predictive capabilities, but they are oriented toward helping workers and patients, not surveilling them. We are building systems to detect early signs of patient decline—subtle changes in visit patterns or care notes that might indicate a need for clinical attention. We are building systems to identify caregivers at risk of burnout—patterns in hours and cancellations that might indicate someone who is about to quit. We are building systems to optimize schedules in ways that respect caregiver preferences and patient relationships, not just minimize costs.

The principle is simple: artificial intelligence should reduce the burden on workers, not add to it. It should help people do their jobs, then get out of the way.

---

The fourth difference is our approach to data and ownership.

In the traditional software industry, your data belongs to the software company, not to you. This is literally true in many cases—read the terms of service sometime—but it is also functionally true in cases where the legal ownership is ambiguous. Even if you nominally own your data, if you cannot export it in a usable format, you do not really own it in any practical sense.

This creates vendor lock-in. Once you have accumulated years of patient records, visit histories, billing data, and care documentation in a particular system, switching to a different system becomes prohibitively difficult. The old vendor knows this. They price accordingly.

Folk Care takes the opposite approach. Your data is yours. You can export everything, anytime, in standard formats: JavaScript Object Notation for structured data, comma-separated values for spreadsheets, Fast Healthcare Interoperability Resources for healthcare systems. We will help you migrate to a competitor if you want to leave. We have published documentation on how to do it.

This seems self-defeating from a business perspective. Why would we help customers leave?

The answer is that customers who know they can leave are customers who stay by choice. They stay because the software is good, not because leaving is hard. This creates better incentives for us. If our customers can leave easily, we have to keep making the software better. We can't get complacent. We can't raise prices arbitrarily. We have to earn their business every month.

---

I have been writing about software features and architecture, but the real story is about something larger: the structure of an industry and who it serves.

Home care is a fifty-billion-dollar industry in the United States. It is growing rapidly as the population ages. It is also an industry characterized by thin margins, high turnover, and constant regulatory pressure. Most home care agencies are small businesses—the median agency has fewer than fifty employees. Many are family-owned. Many are barely profitable.

Into this fragile ecosystem have come private equity firms and venture capitalists with billions of dollars to deploy and return expectations to meet. They have bought up agencies and consolidated them into regional chains. They have bought up software companies and consolidated them into platforms. They have bought up billing services and staffing firms and training programs. They have bought up everything that can be bought, and they have optimized it all for extraction.

The result is an industry that extracts maximum value from everyone involved. From patients, who pay more for care that is increasingly standardized and impersonal. From families, who navigate opaque billing and endless paperwork. From caregivers, who earn poverty wages while the companies they work for generate enormous returns. From small business owners, who compete against entities with unlimited resources and no attachment to any particular community.

The only people who benefit from this arrangement are the investors. And even they benefit only in the short term. In the long term, extraction kills the host. Industries that treat workers as costs to be minimized eventually run out of workers willing to be minimized. Communities that treat care as a commodity eventually discover that care cannot be commodified without destroying what makes it valuable.

---

There is an alternative to this. Not a utopia—I am not promising a utopia—but a different structure, with different incentives, that produces different outcomes.

The alternative is community ownership. Not ownership by a single community, but ownership by the community of people who use and depend on the software. Open source licensing is the legal mechanism for this. When code is released under the Affero General Public License version 3 (that's the AGPL-3.0 we use), it belongs to everyone. No one can take it away. No one can lock it up. No one can use it to extract value without contributing back.

This changes the incentive structure fundamentally. A privately-owned software company has an incentive to lock in customers and raise prices. A community-owned codebase has the opposite incentive: to make itself useful to as many people as possible, because the more people who use it and contribute to it, the better it becomes for everyone.

Folk Care is built on this foundation. The code is public. The roadmap is public. The development process is public. Anyone can see what we're building and why. Anyone can suggest changes or contribute improvements. Anyone can fork the code and take it in a different direction if they disagree with our decisions. You can see all of this at [github.com/neighborhood-lab/folkcare](https://github.com/neighborhood-lab/folkcare).

This transparency creates accountability that private software lacks. When WellSky makes a decision that hurts their users, those users have no recourse except to complain. When we make a decision that hurts our users, they can see the code, understand the decision, and either convince us to change it or change it themselves. The balance of power is fundamentally different.

---

I want to be clear about what we are not claiming. We are not claiming that open source software is automatically better than proprietary software. It is not. Open source projects can be poorly maintained, badly designed, and hostile to users. The license is a necessary condition for community ownership, not a sufficient one.

We are not claiming that Folk Care is finished or perfect. It is not. We are building rapidly and improving constantly, but there are features we don't have yet and bugs we haven't fixed. A year from now, Folk Care will be substantially better than it is today. That is the nature of software development. You can follow our progress on [our Substack](https://neighborhoodlab.substack.com/) where we share updates, or join the conversation on [Discord](https://discord.gg/EkeXQZFq).

We are not claiming that every agency should switch to Folk Care immediately. Switching software is disruptive, even when the new software is better. Agencies should evaluate their options carefully, consider their specific needs, and make informed decisions. If Folk Care is right for them, we would be honored to have them. If it is not, we wish them well with whatever they choose.

What we are claiming is this: the home care industry deserves an alternative to extraction. The caregivers who do this work deserve tools that respect them. The patients who receive this care deserve systems designed around their dignity. The families who coordinate this care deserve transparency and communication. The small business owners who provide this care deserve software that doesn't eat their margins.

[Folk Care](https://folk.care/) is that alternative. It exists. It works. It is being used by agencies today. And it will keep getting better, because that is what community-owned infrastructure does.

---

Let me tell you about the future we are building toward, because the software that exists today is only the beginning.

In the near term—the next year or so—we are focused on intelligence. Not artificial intelligence in the science-fiction sense, but practical intelligence: software that learns patterns, predicts problems, and helps humans make better decisions.

Caregiver burnout is one of the biggest problems in home care. The turnover rate in the industry exceeds sixty percent annually. When a caregiver burns out and quits, it is bad for the caregiver, bad for the patients they were serving, bad for the agency that has to hire and train a replacement, bad for everyone. And usually, the signs are visible in retrospect: increasing callouts, late arrivals, shorter visits, declining documentation quality. The pattern was there. No one saw it in time.

We are building systems that see these patterns. Not to punish caregivers—that would be surveillance, which we reject—but to help coordinators intervene before it's too late. Maybe the caregiver needs a lighter schedule. Maybe they need to be reassigned to different patients. Maybe they just need someone to ask how they're doing. Whatever the intervention, it requires noticing the problem, and humans are bad at noticing patterns in data. Machines are good at it.

Similarly, patient decline often shows patterns before it becomes a crisis. Subtle changes in vital signs. Increasing confusion noted in visit records. Declining completion of activities of daily living. A hospitalization that could have been prevented if someone had noticed the trajectory earlier. We are building systems to notice these trajectories, to flag patients at risk, to give clinicians the information they need to intervene proactively rather than reactively.

In the medium term—two to three years—we are focused on ecosystem integration. Home care does not exist in isolation. Patients have primary care physicians who need to know what's happening at home. They take medications that need to be reconciled and refilled. They may be discharged from hospitals and need continuity of care. They may be enrolled in insurance programs that require specific documentation.

Currently, most of these connections are handled manually. Someone prints a care plan and faxes it to a doctor's office. Someone calls a pharmacy to clarify a prescription. Someone enters the same information into three different systems because none of them talk to each other.

We are building interoperability. Real interoperability, not the marketing version. Folk Care will speak the standard languages of healthcare data exchange—HL7 version 2 for legacy systems, Fast Healthcare Interoperability Resources for modern ones—and it will do so in a way that actually works, not just in a way that checks a compliance box.

In the long term—five years and beyond—we are building toward something more ambitious: shared infrastructure for independent operators.

Imagine if every locally-owned home care agency could benefit from collective bargaining with payers. Not each agency negotiating alone, but a network of agencies sharing data that proves unsustainable rates are unsustainable. Imagine if training resources were shared across agencies instead of each agency reinventing the wheel. Imagine if benchmarking data let small operators understand how they compare to similar agencies, without surrendering their competitive intelligence to a private vendor. Imagine if a patient moving across the country could be seamlessly referred to another agency in the network, with care records transferring automatically and care continuity maintained.

This is the endgame. Not a software company, but a cooperative infrastructure for independent home care. A structure that lets small operators compete against giants, because they have access to the same tools and data and bargaining power.

---

I have written at length about problems and solutions, structures and incentives, features and futures. I want to end with something simpler: why this matters.

There are four million people in the United States who work as home care aides. They earn a median wage of fourteen dollars per hour. They have one of the highest injury rates of any occupation. They have one of the highest turnover rates. They are disproportionately women, disproportionately immigrants, disproportionately people of color. They are, in a very real sense, invisible to most of American society.

But here is what they do: they keep people alive. They allow elderly people to remain in their homes, with dignity, surrounded by familiar things and memories. They allow families to work and live knowing that someone is caring for their loved one. They provide the human connection that no institution can replicate—the same familiar face at the same familiar time, the knowledge of preferences and routines, the relationship that develops when one person cares for another over months and years.

This work is essential. It will become more essential as the population ages. And it is being crushed by an industry structure that treats workers as costs to be minimized and patients as billing codes to be maximized.

There are about twelve million people in the United States receiving home care. They are someone's mother or father, grandmother or grandfather, husband or wife. They are people who lived full lives, raised families, built careers, contributed to their communities. They are people who deserve to be treated as people, not as revenue opportunities.

This is what is at stake. Not software features or market share or competitive positioning. Human beings. Millions of them. Workers and patients and families, all caught in a system that is optimized for extraction rather than care.

We can build something better. That is what [Folk Care](https://folk.care/) is. That is what this movement is. An alternative to extraction. A structure that serves the people who depend on it. Infrastructure for an industry that desperately needs it.

The giants have money and salespeople and market share. They have private equity backing and venture capital funding and twenty-three acquisitions worth of consolidated power.

We have something different. We have alignment. Everyone who uses Folk Care benefits when Folk Care gets better. Everyone who contributes to Folk Care benefits when others contribute. Everyone who depends on home care—workers, patients, families, small business owners—benefits when the infrastructure is owned by the community rather than by investors demanding returns.

This alignment is more powerful than money. It is more durable than market share. It is the foundation on which something lasting can be built.

The caregiver in Austin will still wake up at 4:30 tomorrow morning. She will still earn fourteen dollars an hour, at least for now. She will still think about Mrs. Patterson and Mr. Chen, because that is who she is: someone who thinks about the people she cares for.

But maybe, eventually, the software will stop crashing. Maybe the documentation will take nine minutes instead of twenty-three. Maybe the agency will save enough on software costs to give her a raise. Maybe the system will notice when she's burning out and give her a break before she breaks.

Maybe, eventually, the industry will be rebuilt around the people who do the work and receive the care, rather than around the investors who extract value from both.

That is the revolution. It is quiet. It is slow. It is built one feature at a time, one agency at a time, one caregiver and one patient at a time. But it is happening. And you can be part of it.

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

*If you operate a home care agency and want to learn more about Folk Care, or if you're a caregiver, nurse, or family member with thoughts on what care software should do, reach out. We build this with you, not for you.*
