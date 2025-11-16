# Comprehensive Demo Mode Documentation

## Overview

Care Commons provides a robust demo mode designed for sales, training, and user onboarding. The demo environment features realistic, state-specific data for Texas and Florida, complete with EVV compliance scenarios, credentialing examples, and guided tours for each persona.

## Features

### 1. **State-Specific Demo Data**

#### Texas Demo Data
- **Location**: 60 clients across 5 major Texas cities (Austin, Houston, Dallas, San Antonio, Fort Worth)
- **Demographics**: Culturally diverse names reflecting Texas demographics (40% Hispanic, 40% Anglo, 12% African American, 8% Asian)
- **Age Range**: Clients aged 65-95 with age-appropriate medical conditions
- **EVV Requirements**:
  - Mandatory HHAeXchange aggregator
  - GPS verification required
  - 100-meter geofence radius (+ GPS accuracy)
  - 10-minute clock-in/clock-out grace period
- **Credentialing**:
  - Texas Nurse Aide Registry verification
  - Employee Misconduct Registry (EMR) checks
  - CNA, CPR, First Aid certifications
  - Annual abuse prevention, infection control, and HIPAA training

#### Florida Demo Data
- **Location**: Coverage across 5 major Florida cities (Miami, Tampa, Jacksonville, Orlando, Tallahassee)
- **EVV Requirements**:
  - Multi-aggregator support (HHAeXchange, Netsmart, Sandata)
  - GPS verification required
  - 150-meter geofence radius (+ GPS accuracy)
  - 15-minute clock-in/clock-out grace period
- **Credentialing**:
  - Florida Nurse Aide Registry verification
  - Level 2 Background Screening (FBI fingerprinting)
  - RN supervision visits every 60 days for skilled nursing clients
  - 4 hours of abuse prevention training (vs 2 hours in Texas)

### 2. **Realistic EVV Compliance Scenarios**

The demo includes 600+ visits with ~90% EVV compliance rate, demonstrating common real-world scenarios:

#### Compliant Visits (90%)
- Accurate GPS coordinates within geofence
- Biometric verification preferred
- Proper clock-in and clock-out times
- Complete documentation

#### Non-Compliant Scenarios (10%)

**Geofence Warnings**:
- GPS accuracy variance causing clock-in outside geofence
- Realistic GPS signal interference scenarios
- Coordinator review and approval required

**Missed Clock-Outs**:
- Caregiver forgets to clock out
- Requires coordinator follow-up
- Manual time entry with justification

**Phone Verification Fallbacks**:
- Biometric device unavailable
- Falls back to phone-based verification
- Lower confidence level flagged for review

### 3. **Demo Personas**

Access demo mode with predefined personas for different user types:

#### Available Personas

| Persona | Email | Password | Access Level |
|---------|-------|----------|--------------|
| **Administrator** | `admin@{state}.carecommons.example` | `Demo123!` | Full system access |
| **Care Coordinator** | `coordinator@{state}.carecommons.example` | `Demo123!` | Client/caregiver management, scheduling |
| **Caregiver** | (see caregiver emails in demo data) | `Caregiver123!` | Visit clock-in/out, task completion |
| **Family Member** | `family@carecommons.example` | `Family123!` | View loved one's care, communicate with team |
| **Clinical/RN** | `nurse@{state}.carecommons.example` | `Demo123!` | Clinical assessments, supervision visits |

*Note: Replace `{state}` with state code (e.g., `tx`, `fl`)*

**Examples**:
- Texas Admin: `admin@tx.carecommons.example / Demo123!`
- Florida Coordinator: `coordinator@fl.carecommons.example / Demo123!`
- Family Portal: `family@carecommons.example / Family123!`

### 4. **Visual Demo Indicators**

Clear visual cues ensure users never mistake demo data for production:

#### Demo Mode Banner
- Sticky banner at top of screen
- Shows current state (TX/FL), persona, and organization
- Quick actions: Switch Persona, Reset Demo
- Orange background (#FFA500) with high contrast

#### Demo Mode Watermark
- Subtle "DEMO" watermark across entire application
- Low opacity (5%) to not interfere with usability
- Fixed position, non-interactive overlay

#### Context Badges
- Small badges on specific components
- Indicates demo context (e.g., "TX DEMO - EVV Compliance")
- Position-aware (top-right, top-left, etc.)

### 5. **Guided Demo Tours**

Interactive tours guide users through key features for each persona:

#### Administrator Tour
1. Dashboard overview - KPIs, alerts, compliance status
2. User management - Create staff, assign permissions
3. Organization settings - Configure state-specific settings
4. Reports and analytics - Compliance reporting, financial summaries

#### Care Coordinator Tour
1. Client dashboard - Active clients, upcoming visits
2. Scheduling - Create and assign visits
3. EVV exceptions - Review and resolve compliance issues
4. Caregiver assignment - Match caregivers to client needs

#### Caregiver Tour (Mobile-Optimized)
1. Today's visits - View scheduled visits
2. Clock in/out - EVV verification process
3. Task completion - Complete care plan tasks
4. Visit documentation - Add notes and photos

#### Family Member Tour
1. Family dashboard - View loved one's recent care
2. Visit history - See completed visits and notes
3. Messaging - Communicate with care team
4. Care plan goals - Track progress toward goals

### 6. **State-Specific Credentialing Examples**

Demonstrate complete credentialing workflows:

#### Texas Credentialing
```javascript
import { getStateCredentials } from '@care-commons/core/demo';

const txCreds = getStateCredentials('TX');

// Nurse Aide Registry verification
txCreds.nurseAideRegistry.name // "Texas Nurse Aide Registry"
txCreds.nurseAideRegistry.backgroundCheckType // "Employee Misconduct Registry (EMR)"

// Required certifications
txCreds.requiredCertifications // [CNA, CPR, FIRST_AID]

// EVV requirements
txCreds.evvRequirements.aggregatorName // "HHAeXchange" (mandatory)
txCreds.evvRequirements.geofenceRadius // 100 meters
txCreds.evvRequirements.clockInGracePeriod // 10 minutes
```

#### Florida Credentialing
```javascript
import { getStateCredentials } from '@care-commons/core/demo';

const flCreds = getStateCredentials('FL');

// Background screening (Level 2 - FBI)
flCreds.backgroundScreening.level // 2
flCreds.backgroundScreening.includes // [FBI, FDLE, Local, Abuse Registry, Sexual Predator Registry]
flCreds.backgroundScreening.validFor // 60 months (5 years)

// RN supervision requirements
flCreds.rnSupervisionVisits.required // true
flCreds.rnSupervisionVisits.frequency // 60 days

// EVV requirements
flCreds.evvRequirements.aggregatorRequired // false (provider choice)
flCreds.evvRequirements.supportedAggregators // [HHAeXchange, Netsmart, Sandata, ...]
flCreds.evvRequirements.geofenceRadius // 150 meters
flCreds.evvRequirements.clockInGracePeriod // 15 minutes
```

#### Compare State Requirements
```javascript
import { compareStateCredentials } from '@care-commons/core/demo';

const comparison = compareStateCredentials('TX', 'FL');

console.log(comparison.differences);
// [
//   { category: 'Background Screening', difference: 'Texas requires Level 1, Florida requires Level 2' },
//   { category: 'EVV Aggregator', difference: 'Texas mandates HHAeXchange, Florida allows provider choice' },
//   { category: 'EVV Geofence', difference: 'Texas: 100m, Florida: 150m' },
//   { category: 'RN Supervision', difference: 'Florida requires RN supervision visits, Texas does not' }
// ]
```

## Setup Instructions

### 1. Seed Demo Data

```bash
# First-time setup (creates organization, branch, admin user)
npm run db:seed

# Add comprehensive demo data
npm run db:seed:demo

# Reset and reseed (WARNING: Destroys ALL data)
npm run db:reset:demo
```

### 2. Activate Demo Mode in Application

```tsx
import { DemoModeProvider, DemoModeBanner, useDemoMode } from '@care-commons/web/components/demo';

function App() {
  return (
    <DemoModeProvider
      initialState={{
        isActive: true,
        stateCode: 'TX',
        organizationName: 'Texas Home Health Demo',
      }}
      onReset={() => {
        // Call API to reset demo data
        console.log('Demo reset requested');
      }}
    >
      <DemoModeBanner
        isActive={true}
        persona={{ type: 'ADMINISTRATOR', name: 'Admin', role: 'Administrator' }}
        stateCode="TX"
        onReset={() => {/* reset handler */}}
        onSwitchPersona={() => {/* switch handler */}}
      />
      {/* Your app content */}
    </DemoModeProvider>
  );
}
```

### 3. Use Demo Mode Hooks

```tsx
import { useDemoMode, useIsDemoMode, useDemoPersona } from '@care-commons/web/components/demo';

function MyComponent() {
  const { state, activateDemo, resetDemo } = useDemoMode();
  const isDemo = useIsDemoMode();
  const persona = useDemoPersona();

  if (isDemo) {
    return <div>Demo Mode: {persona?.name} in {state.stateCode}</div>;
  }

  return <div>Production Mode</div>;
}
```

## Demo Data Statistics

- **Users**: 255 state-specific users (51 states × 5 roles)
- **Clients**: 60+ Texas clients + Gertrude Stein (family portal demo)
- **Caregivers**: 35 Texas-based caregivers
- **Visits**: 600+ visits with geographic clustering
- **EVV Records**: 540+ completed visits with EVV data
- **Care Plans**: 50+ active care plans with goals
- **Family Members**: 40+ with portal access
- **Invoices**: Generated monthly for completed visits
- **Messages**: 3 conversation threads for family engagement
- **Tasks**: 7 pending task instances for caregivers

## Geographic Distribution

Demo data uses realistic geographic clustering:

- **80% same-city assignments**: Caregivers matched to clients in same city
- **20% cross-city coverage**: Some caregivers cover multiple cities
- **Realistic addresses**: Accurate Texas zip codes, area codes, neighborhoods

## EVV Compliance Breakdown

- **Total Visits**: 600+
- **Completed with EVV**: 540+ visits
- **Fully Compliant**: ~90% (486 visits)
  - Biometric verification
  - Accurate GPS within geofence
  - Complete clock-in/out
- **Geofence Warnings**: ~4% (22 visits)
  - GPS accuracy variance
  - Requires coordinator review
- **Missed Clock-Outs**: ~3% (16 visits)
  - Caregiver forgot to clock out
  - Manual time entry required
- **Phone Verification**: ~3% (16 visits)
  - Biometric unavailable
  - Lower confidence level

## API Endpoints (Future)

Planned demo mode API endpoints:

```
POST   /api/demo/activate           # Activate demo mode
POST   /api/demo/deactivate         # Deactivate demo mode
POST   /api/demo/reset              # Reset demo data to initial state
POST   /api/demo/switch-persona     # Switch demo persona
GET    /api/demo/personas           # List available personas
GET    /api/demo/state-credentials  # Get state credentialing requirements
```

## Best Practices

1. **Always Show Visual Indicators**: Never let users mistake demo for production
2. **Isolate Demo Data**: Use `is_demo_data` flag in database
3. **Clear Session Boundaries**: Reset demo state on logout
4. **State Context**: Always specify which state's demo data is active
5. **Realistic Data**: Use authentic addresses, names, medical conditions
6. **Compliance Accuracy**: Reflect real regulatory requirements
7. **Performance**: Demo mode should not impact production performance

## Troubleshooting

### Demo Data Not Appearing

```bash
# Check if demo data exists
psql $DATABASE_URL -c "SELECT COUNT(*) FROM clients WHERE is_demo_data = true;"

# If zero, reseed demo data
npm run db:seed:demo
```

### EVV Compliance Issues

Check that state-specific EVV requirements are properly configured:

```javascript
import { getStateCredentials } from '@care-commons/core/demo';

const creds = getStateCredentials('TX');
console.log('Geofence radius:', creds.evvRequirements.geofenceRadius);
console.log('Grace period:', creds.evvRequirements.clockInGracePeriod);
```

### Demo Banner Not Showing

Ensure DemoModeProvider wraps your app:

```tsx
<DemoModeProvider initialState={{ isActive: true, stateCode: 'TX' }}>
  <App />
</DemoModeProvider>
```

## Future Enhancements

- [ ] Guided tours using react-joyride for each persona
- [ ] Time travel feature (simulate future/past dates)
- [ ] Multi-state scenarios (client moves from TX to FL)
- [ ] Incident reporting demo scenarios
- [ ] Medication management workflows
- [ ] Clinical documentation examples
- [ ] Billing and invoicing workflows
- [ ] Quality assurance audit scenarios

## Contributing

When adding new demo features:

1. Update seed-demo.ts with new data
2. Add state-specific requirements to state-credentials.ts
3. Document new personas or workflows in this file
4. Add visual indicators where appropriate
5. Ensure `is_demo_data = true` flag is set
6. Update demo statistics in this document

## License

AGPL-3.0 - See LICENSE file for details
