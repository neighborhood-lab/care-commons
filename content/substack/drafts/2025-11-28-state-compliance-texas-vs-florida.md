---
title: "Same Credential, Different Rules"
subtitle: "Why Texas and Florida home healthcare compliance can't be solved by the same software"
scheduled_date: 2025-11-28
image_prompt: "Flat illustration showing two US state shapes (Texas and Florida) connected by a bridge made of documents and checklists, different colored checkmarks on each side (orange for Texas, teal for Florida), a confused coordinator in the middle with a question mark, warm earth tones (orange, brown, cream), simple geometric shapes, clean professional aesthetic"
tags: [compliance, regulations, texas, florida, technical]
category: Technical + Industry Deep Dive
---

# Same Credential, Different Rules

Maria runs a home health agency in San Antonio. Her cousin runs one in Miami. They're both trying to figure out if a caregiver can work today.

Same question. Same credential type. Completely different answers.

Maria's caregiver needs to pass the Texas Employee Misconduct Registry check. Her cousin's caregiver needs Level 2 background screening through Florida's Agency for Health Care Administration. Maria has a 10-minute grace period for clock-in. Her cousin has 15 minutes. Maria's caregiver can work within 100 meters of the service address. Her cousin's threshold is 150 meters.

This is the reality that enterprise compliance software ignores. They sell "home healthcare compliance modules" as if compliance is a checkbox. It's not. It's a constraint satisfaction problem where the constraints change at state lines.

---

## The Myth of "One Size Fits All"

I've watched demos from three major enterprise healthcare vendors this year. Each one showed a "compliance dashboard" that looked impressive—charts, alerts, credential tracking. Each one fell apart when I asked a simple question:

"How do you handle the difference between Texas Employee Misconduct Registry checks and Florida Level 2 background screening?"

The answers ranged from "you can configure that" (meaning: you pay consultants to do our job) to "our system is flexible" (meaning: we have no idea what you're talking about).

Here's why this matters: A coordinator at 6 AM doesn't have time to remember that Texas requires annual registry checks while Florida requires checks every five years. They need software that knows this. Software that doesn't just track credentials but understands the regulatory context those credentials exist in.

---

## Texas: The HHSC Framework

Texas home healthcare operates under 26 TAC §558, enforced by the Health and Human Services Commission. The regulatory philosophy emphasizes continuous monitoring and mandatory aggregator submission.

### Background Screening (Texas Style)

Texas doesn't do "background checks." Texas does *registry checks*:

```typescript
const TEXAS_BACKGROUND_SCREENING = {
  level: 1,
  validFor: 24, // months (2 years)
  registryChecks: [
    'Texas Employee Misconduct Registry',   // MANDATORY
    'Texas Nurse Aide Registry',
    'OIG List of Excluded Individuals/Entities (LEIE)',
    'SAM.gov Exclusions',
  ],
  verificationFrequency: 'BEFORE_HIRE_AND_ANNUALLY',
};
```

That Employee Misconduct Registry is key. It's not optional. It's not "nice to have." It's a mandatory check before hire and every year afterward. Miss it, and you're not just non-compliant—you're exposed to liability if that caregiver has a history you should have known about.

### EVV: HHAeXchange or Nothing

Texas doesn't give you choices for EVV aggregation:

```typescript
const TEXAS_EVV = {
  aggregatorRequired: true,
  aggregatorName: 'HHAeXchange',  // Mandatory - no alternatives
  gpsRequired: true,
  geofenceRadius: 100,            // meters (tight)
  clockInGracePeriod: 10,         // minutes (strict)
  clockOutGracePeriod: 10,
};
```

If you're running a Texas agency and your software doesn't integrate with HHAeXchange, you have a problem. If your geofencing logic uses a 150-meter radius, you have a problem. If your clock-in grace period is 15 minutes, you're generating compliance exceptions.

Enterprise vendors love to say "we integrate with HHAeXchange." But integration isn't configuration. Does your software know that Texas requires a 10-minute grace period? That the geofence should be 100 meters plus GPS accuracy allowance? That a Visit Maintenance Unlock Request (VMUR) is required for corrections after submission?

These aren't edge cases. They're the daily reality of Texas compliance.

---

## Florida: The AHCA Framework

Florida operates under Chapter 59A-8 FAC, enforced by the Agency for Health Care Administration. The regulatory philosophy emphasizes thorough initial screening with longer validity periods.

### Background Screening (Florida Style)

Florida goes deeper with Level 2 screening:

```typescript
const FLORIDA_BACKGROUND_SCREENING = {
  level: 2,                       // FBI fingerprinting required
  validFor: 60,                   // months (5 years!)
  includes: [
    'FBI National Criminal History Check',
    'Florida Department of Law Enforcement (FDLE) Criminal History',
    'Local Criminal History Check',
    'Florida Abuse Registry Check',
    'Florida Sexual Predator/Offender Registry',
  ],
  registryChecks: [
    'Florida Nurse Aide Registry',
    'Florida Abuse Hotline Information System',
    'OIG List of Excluded Individuals/Entities (LEIE)',
    'SAM.gov Exclusions',
    'Florida Sexual Predator and Sexual Offender Registry',
  ],
};
```

Notice the difference: Texas checks are valid for 2 years and include the Employee Misconduct Registry. Florida checks are valid for 5 years but require FBI fingerprinting and include the Sexual Predator Registry.

Which is "better"? Neither. They're different regulatory approaches to the same goal: protecting vulnerable adults. Software that doesn't understand both approaches can't serve agencies in both states.

### EVV: Provider Choice

Unlike Texas, Florida lets you choose your EVV aggregator:

```typescript
const FLORIDA_EVV = {
  aggregatorRequired: false,       // Provider choice
  supportedAggregators: [
    'HHAeXchange', 
    'Netsmart', 
    'Sandata', 
    'CareConnect', 
    'WellSky'
  ],
  gpsRequired: true,
  geofenceRadius: 150,             // meters (more lenient)
  clockInGracePeriod: 15,          // minutes (more forgiving)
  clockOutGracePeriod: 15,
};
```

Same federal EVV mandate. Different state implementation. A caregiver in Texas clocking in 12 minutes early triggers an exception. The same behavior in Florida is within grace period.

### RN Supervision: Florida's Extra Requirement

Here's something Texas doesn't require but Florida does:

```typescript
const FLORIDA_RN_SUPERVISION = {
  required: true,
  frequency: 60,                   // days
  documentationRequired: true,
  applicableServiceTypes: [
    'SKILLED_NURSING', 
    'PERSONAL_CARE_SKILLED'
  ],
};
```

Every 60 days, skilled nursing clients in Florida need an RN supervision visit. Your scheduling software needs to track this. Your compliance dashboard needs to alert when one is coming due. Your audit reports need to show compliance history.

Enterprise software doesn't know this exists until an AHCA surveyor asks for supervision visit documentation.

---

## The Real Differences (Side by Side)

| Requirement | Texas | Florida |
|-------------|-------|---------|
| Background Check Type | Level 1 + EMR | Level 2 (FBI) |
| Background Valid For | 2 years | 5 years |
| Key Registry | Employee Misconduct | Sexual Predator |
| EVV Aggregator | HHAeXchange (mandatory) | Provider choice |
| Geofence Radius | 100 meters | 150 meters |
| Clock-in Grace | 10 minutes | 15 minutes |
| RN Supervision | Not required | Every 60 days |
| Abuse Training | 2 hours/year | 4 hours/year |

These aren't obscure regulatory details. They're operational parameters that affect every visit, every day. A coordinator needs software that embodies this knowledge, not software that requires them to memorize it.

---

## How Folk Handles This

When we built the [Compliance Autopilot](https://folk.care/compliance), we didn't build "configurable compliance." We built state-aware compliance.

```typescript
interface StateComplianceRules {
  stateCode: string;
  backgroundScreening: {
    level: number;
    validFor: number;           // months
    registryChecks: string[];
  };
  evvRequirements: {
    aggregatorRequired: boolean;
    aggregatorName?: string;
    geofenceRadius: number;
    clockInGracePeriod: number;
  };
  rnSupervisionVisits?: {
    required: boolean;
    frequency: number;          // days
  };
  trainingRequirements: {
    code: string;
    hours: number;
    expiresAfterMonths: number;
  }[];
}
```

When you configure your agency for Texas, you get Texas rules. Not generic rules. Not "configurable" rules. Texas rules, maintained by people who read 26 TAC §558.

The system knows that your Texas caregiver's background check expires after 24 months. It knows that your Florida caregiver's check is valid for 60 months. It knows to alert you about RN supervision visits in Florida and Employee Misconduct Registry renewals in Texas.

This is what "domain knowledge encoded as software" actually means.

---

## The Regulatory Research Model

Here's something enterprise vendors will never do: share their regulatory research.

We publish our state compliance configurations in the open. You can see exactly what rules we're enforcing. You can file issues if we get something wrong. You can contribute updates when regulations change.

```
packages/core/src/demo/state-credentials.ts
```

Every compliance rule has a citation. Every training requirement has a description. Every deviation from federal baseline has an explanation.

When the Texas HHSC updates 26 TAC §558, we don't wait for a vendor support ticket. We update the rules, publish the change, and every Folk agency gets the update automatically.

This is what community-owned software enables: shared regulatory intelligence that no single agency could afford to maintain alone.

---

## What This Means for You

If you're running a multi-state home health operation, here's what you need:

**Not this:** "Our software is configurable for state requirements."

**This:** Software that knows the difference between Texas Employee Misconduct Registry checks and Florida Level 2 background screening without you configuring anything.

**Not this:** "We integrate with major EVV aggregators."

**This:** Software that knows Texas requires HHAeXchange and automatically routes submissions there, while giving Florida agencies aggregator choice.

**Not this:** "You can set up custom alerts for supervision visits."

**This:** Software that knows Florida requires RN supervision every 60 days and creates those deadlines automatically for skilled nursing clients.

---

## Try It Today

The [Compliance Autopilot](https://folk.care/compliance) is live with full Texas and Florida support. We're adding more states based on community demand—each one with proper regulatory research, not guesswork.

Explore the [interactive showcase](https://folk.care/) to see state-specific compliance in action. Or dive into the code on [GitHub](https://github.com/neighborhood-lab/folkcare) and see exactly how we model state regulations.

Maria and her cousin in Miami shouldn't need different software. They just need software that understands their states are different.

---

*Brian Edwards builds Folk with [Neighborhood Lab](https://neighborhoodlab.org). Join us on [Discord](https://discord.gg/EkeXQZFq) or support the project on [Patreon](https://www.patreon.com/cw/neighborhood_lab).*
