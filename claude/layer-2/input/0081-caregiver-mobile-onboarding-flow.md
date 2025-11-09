# Task 0081: Caregiver Mobile App Onboarding Flow

**Priority:** 🟠 HIGH
**Estimated Effort:** 2-3 days
**Type:** Mobile / UX / Onboarding
**Persona:** Caregiver

---

## Context

Caregivers are the front-line users of the mobile app, but there's no guided onboarding flow to help them get started. First-time caregivers may be confused, miss critical permissions (GPS, biometrics), or not understand core workflows.

**Current State:**
- Login works, but no first-time setup wizard
- No biometric enrollment flow
- No explanation of how to use the app
- No practice/demo mode for new caregivers

**Goal State:**
- Seamless first-time setup in <5 minutes
- Biometric and location permissions properly requested with context
- Interactive tutorial showing how to complete a visit
- Caregiver feels confident using the app

---

## Objectives

1. **Create First-Time Setup Wizard**
   - Welcome screen
   - Biometric enrollment
   - Location permission request
   - Notification permission request

2. **Build Interactive Tutorial**
   - Demo visit walkthrough
   - Practice clock-in/out
   - Practice task completion

3. **Add Quick Reference Guide**
   - Accessible from app menu
   - Common tasks and troubleshooting

---

## Implementation

### Onboarding Screens

**Screen 1: Welcome**
- Agency logo
- "Welcome to [Agency Name]!"
- Brief intro to what the app does
- "Get Started" button

**Screen 2: Biometric Setup**
- "Secure Your Account"
- Explanation: "We use Face ID/Touch ID to verify it's really you during visits"
- "Enable [Face ID/Touch ID]" button
- "Skip" option (with warning)

**Screen 3: Location Permission**
- "Enable Location Services"
- Explanation: "GPS verification is required for compliance. We only track location during visits."
- "Enable Location" button
- iOS/Android permission prompts

**Screen 4: Notifications**
- "Stay Updated"
- Explanation: "Get notified of new visits, schedule changes, and messages"
- "Enable Notifications" button

**Screen 5: Tutorial Prompt**
- "Want a Quick Tour?"
- "We'll walk you through completing your first visit (takes 2 minutes)"
- "Start Tutorial" or "Skip for Now"

### Tutorial Demo Visit

Use a fake demo visit to practice:
- Finding today's visits
- Tapping a visit to open details
- Clocking in (simulated GPS check)
- Viewing and completing care tasks
- Adding visit notes
- Clocking out
- "You're ready to go!" completion screen

---

## Success Criteria

- [ ] 90%+ of caregivers complete onboarding
- [ ] Biometric enrollment >80% (critical for EVV)
- [ ] Location permission granted >95% (required for compliance)
- [ ] Caregivers can complete first real visit without help
- [ ] Support calls for "how to clock in" reduced by 90%

---

## Related Tasks

- Task 0055: Mobile ClockInScreen Implementation
- Task 0056: Mobile TasksScreen Implementation
- Task 0074: End-to-End User Journey Validation
