# Rich Interactive Demo Implementation Plan

## Overview

Transform the Care Commons demo from a static showcase into a **living, breathing simulation** of a home healthcare agency with realistic multi-persona workflows.

**Priority**: CRITICAL  
**Estimated Effort**: 3-4 weeks  
**Real-World Impact**: HIGH

## Vision

A fully interactive demo where:
- **Sales prospects** can experience realistic workflows
- **Investors** see the platform's operational complexity
- **Potential customers** can "test drive" before committing
- **Development team** validates complete user journeys

## Implementation Phases

### Phase 1: Foundation (Week 1) ✅ IN PROGRESS

**Goal**: Create rich seed data and demo infrastructure

#### 1.1 Enhanced Seed Data (`packages/core/scripts/seed-demo-v2.ts`)
- [x] Define 20+ caregiver personas with varied:
  - Roles: CNA, HHA, RN, Companion, Senior Caregiver
  - Specialties: Dementia, wound care, Parkinsons, hospice
  - Languages: English, Spanish, Mandarin, Korean
  - Certifications: Active, expiring, pending verification
  - Employment types: Full-time, part-time, per diem
  - Availability patterns: Weekdays, weekends, nights
  - Compliance status: Compliant, expiring soon, pending
  - Reliability scores: 0.85-0.99

- [x] Define 30+ client personas with varied:
  - Conditions: Alzheimers, Parkinsons, CHF, COPD, diabetes, stroke, cancer
  - Risk levels: Low, medium, high, critical
  - Mobility: Independent, walker, wheelchair, bedridden
  - Authorized hours: 10-60 hours per week
  - Geographic distribution: Dallas/Fort Worth area
  - Special needs: Oxygen, feeding tubes, dementia care, hospice
  
- [x] Define coordinator personas:
  - Field Coordinator (Sarah Kim)
  - Scheduling Coordinator (Michael Brown)
  - Care Coordinator (Jennifer Lopez)

- [ ] Implement full seeding logic:
  - Insert caregivers with complete profiles
  - Insert clients with complete demographics
  - Create coordinator users
  - Generate 100+ historical visits (last 30 days)
  - Create 15+ active/scheduled visits for today
  - Seed visit exceptions (geofence violations, late starts, no-shows)
  - Create active care plans with tasks
  - Add pending authorizations
  - Insert credential expirations

#### 1.2 Demo Data Structures
- [ ] Create TypeScript types for demo sessions
- [ ] Define demo state management interfaces
- [ ] Create demo snapshot model

**Deliverables**:
- Fully populated demo database (run once)
- Realistic operational data spanning 30 days
- Multiple personas ready for role-based demos

---

### Phase 2: Demo Session Management (Week 2)

**Goal**: Enable stateful demo sessions with isolation

#### 2.1 Demo Session Service (`packages/core/src/demo/`)
```typescript
packages/core/src/demo/
  ├── demo-session-manager.ts    // Session lifecycle management
  ├── demo-state-store.ts         // In-memory state storage
  ├── demo-snapshot.ts            // Base snapshot + modifications
  ├── demo-persona-factory.ts     // Generate persona contexts
  └── types.ts                    // Demo type definitions
```

**Features**:
- Session creation with TTL (4 hours)
- Isolated state per session (user A changes don't affect user B)
- Session snapshot restoration
- Persona switching within session
- Time acceleration (simulate passing days)

#### 2.2 Storage Strategy
**Option A**: In-memory (simpler, good for single-instance)
```typescript
class DemoStateStore {
  private sessions: Map<string, DemoSession> = new Map();
  // Stores modifications as event log
}
```

**Option B**: Redis (scalable, multi-instance)
```typescript
// Session data in Redis with TTL
// Key: `demo:session:{sessionId}`
// Value: JSON serialized DemoSession
```

**Decision**: Start with in-memory, add Redis adapter later

**Deliverables**:
- Demo session CRUD operations
- State isolation verified
- Persona context switching

---

### Phase 3: Write-Enabled Demo APIs (Week 2-3)

**Goal**: Allow realistic interactions that modify demo state

#### 3.1 Caregiver Actions (`packages/app/src/routes/demo/caregiver.ts`)
```typescript
POST   /api/demo/visits/:id/clock-in
POST   /api/demo/visits/:id/clock-out
PATCH  /api/demo/tasks/:id/complete
POST   /api/demo/visits/:id/notes
POST   /api/demo/visits/:id/photos
GET    /api/demo/caregiver/:id/schedule
```

**Business Rules**:
- Clock-in validates geolocation (simulated GPS)
- Tasks marked complete update visit progress
- Notes append to visit documentation
- All changes stored in session modifications log

#### 3.2 Coordinator Actions (`packages/app/src/routes/demo/coordinator.ts`)
```typescript
POST   /api/demo/schedule/assign           // Assign caregiver to visit
POST   /api/demo/exceptions/:id/resolve    // Resolve EVV exception
PATCH  /api/demo/visits/:id/reassign       // Reassign to different caregiver
GET    /api/demo/coordinator/dashboard     // Real-time stats
GET    /api/demo/coordinator/exceptions    // Exception queue
```

#### 3.3 Admin Actions (`packages/app/src/routes/demo/admin.ts`)
```typescript
GET    /api/demo/admin/kpis               // Agency KPIs
GET    /api/demo/admin/compliance         // Compliance dashboard
GET    /api/demo/admin/revenue            // Revenue cycle metrics
POST   /api/demo/authorizations/create    // Create service authorization
```

#### 3.4 Demo Utilities
```typescript
POST   /api/demo/reset                    // Reset session to base snapshot
POST   /api/demo/time/advance/:days       // Fast-forward simulation
GET    /api/demo/session                  // Current session state
```

**Deliverables**:
- Fully functional write APIs for all personas
- Session modifications tracked
- Reset capability verified

---

### Phase 4: Role-Based Demo UI (Week 3-4)

**Goal**: Polished persona-specific interfaces

#### 4.1 Caregiver View (`packages/web/src/demo/caregiver/`)
**Route**: `/demo/caregiver/:name`

**Features**:
- Today's visit schedule with addresses
- One-tap clock-in/out with GPS simulation
- Task checklist with photo upload
- Client notes and care plan summary
- Offline indicator (simulated sync lag)
- Turn-by-turn navigation (maps integration)

**Mock Data**:
- `/demo/caregiver/maria` → Maria Rodriguez persona
- Pre-filled GPS coordinates for visit locations
- Task completion updates visit state

#### 4.2 Coordinator View (`packages/web/src/demo/coordinator/`)
**Route**: `/demo/coordinator/:name`

**Features**:
- Real-time dashboard:
  - X visits in progress
  - Y alerts requiring attention
  - Z unassigned visits
- Exception queue with severity filters
- Drag-and-drop schedule board
- Caregiver availability heatmap
- Client risk flags
- Upcoming assessments

**Mock Data**:
- `/demo/coordinator/sarah` → Sarah Kim (Field Coordinator)
- `/demo/coordinator/michael` → Michael Brown (Scheduling)

#### 4.3 Administrator View (`packages/web/src/demo/admin/`)
**Route**: `/demo/admin/:name`

**Features**:
- Agency KPIs:
  - Visit completion rate: 94%
  - EVV compliance: 89%
  - Caregiver utilization: 87%
- Revenue cycle:
  - $47K billable
  - $23K submitted
  - $19K paid
- Compliance dashboard:
  - 2 credentials expiring this week
  - 3 background checks due
- State submission status:
  - TX: Daily file sent ✅
  - FL: Pending submission ⏳
- Staff performance metrics

**Mock Data**:
- `/demo/admin/linda` → Linda Anderson persona

#### 4.4 Demo Mode Toggle (Global)
**Component**: `<DemoModeBar />`

**Features**:
- Persistent banner: "DEMO MODE"
- Current persona indicator
- Persona switcher dropdown
- Reset demo data button
- Time accelerator slider
- Session expiry countdown

**Deliverables**:
- Three complete persona UIs
- Demo mode controls
- Seamless persona switching

---

### Phase 5: Family Portal & AI Chatbot (Week 4)

**Goal**: Differentiate with family engagement features

#### 5.1 SMS Notifications (`packages/core/src/services/family-notifications.ts`)
**Dependencies**: `npm install twilio`

**Notifications**:
```typescript
// Clock-in notification
"Maria has arrived for Mom's 2pm visit" 

// Clock-out summary
"Visit completed. Mom had lunch and took medications. Next visit: tomorrow 9am"

// Interactive confirmation
"Reply Y to confirm Friday's visit, N to cancel"

// Proactive alerts
"Mom's wound assessment is due this week"
```

**Implementation**:
```typescript
class FamilyNotificationService {
  async sendClockIn(visit: Visit, family: Contact): Promise<void>
  async sendClockOut(visit: Visit, summary: string, family: Contact): Promise<void>
  async sendConfirmationRequest(visit: Visit, family: Contact): Promise<void>
  async sendAlert(client: Client, alert: Alert, family: Contact): Promise<void>
}
```

#### 5.2 AI Chatbot (`packages/core/src/services/family-chatbot.ts`)
**Dependencies**: `npm install @anthropic-ai/sdk`

**Conversation Examples**:
```
Family: "How was Mom's visit today?"
Bot: "Maria arrived at 2:03pm and completed all care tasks. Your mother 
      ate 75% of lunch and seemed cheerful. Blood pressure was 128/82. 
      Next visit is tomorrow at 9am with James."

Family: "Can we add shower to Friday's visit?"
Bot: "I can request that. Friday 2pm visit currently includes: 
      [meal prep, medication, light housekeeping]. Adding shower 
      adds 30 minutes. Reply YES to submit request."

Family: "What medications does Mom take?"
Bot: "Your mother's current medications are:
      • Metformin 500mg - 2x daily with meals
      • Lisinopril 10mg - 1x daily morning
      • Aspirin 81mg - 1x daily morning
      Last medication review: 2 weeks ago"
```

**Implementation**:
```typescript
class FamilyChatbot {
  private claude: Anthropic;
  
  async handleIncomingText(from: string, message: string): Promise<string> {
    // 1. Identify client/family from phone number
    const client = await this.lookupClient(from);
    
    // 2. Fetch context (visits, care plan, medications)
    const context = await this.getClientContext(client.id);
    
    // 3. Call Claude with structured prompt
    const response = await this.claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: this.buildSystemPrompt(client, context),
      messages: [{ role: 'user', content: message }]
    });
    
    // 4. Send SMS response
    return response.content[0].text;
  }
  
  private buildSystemPrompt(client: Client, context: ClientContext): string {
    return `You are a helpful care coordinator assistant.
    
Current client: ${client.name}
Recent visits: ${JSON.stringify(context.visits)}
Active care plan: ${JSON.stringify(context.carePlan)}
Medications: ${JSON.stringify(context.medications)}

Answer family questions clearly and compassionately.
If asked to make changes, confirm details before submitting.
Never share PHI beyond what family is authorized to see.`;
  }
}
```

#### 5.3 Family Portal UI (`packages/web/src/family/`)
**Route**: `/family/:clientSlug`

**Features**:
- Live visit status with ETA
- Visit history (last 30 days)
- Caregiver profiles with photos
- Upcoming schedule (next 7 days)
- Request visit changes
- Message care team
- View care plan (PHI-filtered for family)

**Security**:
- Family access via secure token (sent via SMS)
- Read-only access to authorized information
- PHI filtering based on HIPAA authorizations

**Mock Data**:
- `/family/dorothy-chen` → Dorothy Chen's family portal

**Deliverables**:
- SMS notification service (Twilio integration)
- AI chatbot service (Anthropic Claude integration)
- Family portal UI with live status
- Secure access tokens

---

## Acceptance Criteria

### Data Quality
- [ ] 20+ caregivers with realistic credentials, specialties, availability
- [ ] 30+ clients with diverse conditions, risk levels, geolocation
- [ ] 100+ completed visits in last 30 days with full EVV data
- [ ] 15+ active visits today with some in-progress, some completed

### Functionality
- [ ] Write operations work: Clock-in, task completion, note-taking persist in demo session
- [ ] Role-based views: Caregiver, Coordinator, Admin UIs demonstrate distinct workflows
- [ ] Family portal: SMS notifications + AI chatbot responds to basic queries

### User Experience
- [ ] Demo mode toggle: Switch personas, reset data, fast-forward time
- [ ] Zero real PHI: All data is fictional but clinically realistic
- [ ] Performance: Demo loads in <2s, operations complete in <500ms

### Technical Quality
- [ ] All TypeScript type-safe
- [ ] Zero lint warnings
- [ ] Unit tests for demo session management
- [ ] Integration tests for demo APIs
- [ ] Documentation for adding new personas

---

## Technical Architecture

### Demo Session State Machine
```
[User arrives] 
  → Create session (TTL: 4h)
  → Load base snapshot
  → Select persona
  ↓
[User interacts]
  → API calls modify session state
  → Modifications logged as events
  → State calculated from base + events
  ↓
[User switches persona]
  → Same session, different view
  → State persists across persona switches
  ↓
[User resets]
  → Clear modifications
  → Reload base snapshot
  ↓
[Session expires / User leaves]
  → TTL cleanup
  → Session state discarded
```

### Data Flow
```
Base Snapshot (DB)
  ↓
Demo Session (In-Memory/Redis)
  ├─ Base data (read-only)
  ├─ Modifications (event log)
  └─ Computed state (base + modifications)
       ↓
API Layer (Express routes)
  ├─ /api/demo/caregiver/*
  ├─ /api/demo/coordinator/*
  ├─ /api/demo/admin/*
  └─ /api/demo/family/*
       ↓
UI Layer (React components)
  ├─ /demo/caregiver/:name
  ├─ /demo/coordinator/:name
  ├─ /demo/admin/:name
  └─ /family/:clientSlug
```

---

## Dependencies to Install

### Backend
```bash
npm install --workspace=packages/core twilio @anthropic-ai/sdk ioredis
npm install --workspace=packages/core -D @types/ioredis
```

### Frontend
```bash
npm install --workspace=packages/web date-fns-tz react-dnd react-dnd-html5-backend
npm install --workspace=packages/web recharts @radix-ui/react-slider
```

---

## Testing Strategy

### Unit Tests
- Demo session manager (create, modify, reset, expire)
- Demo state store (isolation, TTL)
- Persona factory (context generation)

### Integration Tests
- Demo APIs (CRUD operations)
- Session isolation (concurrent users)
- Time acceleration (date calculations)

### E2E Tests (Playwright)
- Caregiver workflow: Clock in → Complete tasks → Clock out
- Coordinator workflow: View exceptions → Reassign visit
- Admin workflow: View KPIs → Generate report
- Family workflow: Check visit status → Send message

---

## Security Considerations

### Demo Data Isolation
- Each session is completely isolated
- User A cannot access User B's demo session
- Sessions auto-expire after 4 hours

### PHI Protection
- All demo data is **fictional**
- No real patient information
- Family portal enforces HIPAA authorization filters
- SMS chatbot never reveals unauthorized PHI

### Rate Limiting
- Demo API calls limited to 100/minute per session
- Prevents abuse of AI chatbot (Anthropic costs)
- Twilio SMS limited to 10/session

---

## Performance Targets

- **Demo load time**: <2 seconds
- **API response time**: <500ms (p95)
- **Session creation**: <100ms
- **Persona switch**: <200ms
- **Time acceleration**: <300ms
- **Concurrent sessions**: Support 50+ simultaneous users

---

## Monitoring & Analytics

### Metrics to Track
- Demo session starts per day
- Persona usage distribution
- Feature engagement (clock-in clicks, exception resolutions)
- Session duration (time spent in demo)
- Conversion rate (demo → signup)

### Implementation
```typescript
// Track demo events
analytics.track('demo_session_started', { persona: 'caregiver' });
analytics.track('demo_action', { action: 'clock_in', persona: 'maria' });
analytics.track('demo_session_ended', { duration: 1200, persona: 'coordinator' });
```

---

## Future Enhancements (Post-Launch)

### Phase 6: Mobile Demo
- Native mobile app demo mode
- Offline sync simulation
- GPS tracking visualization

### Phase 7: Multi-State Demo
- Switch between TX and FL regulatory environments
- Show state-specific EVV requirements
- Demonstrate multi-state agency operations

### Phase 8: AI-Powered Insights
- Chatbot for caregivers: "What tasks do I have today?"
- Predictive scheduling: "Who should I assign to this visit?"
- Anomaly detection: "Flag unusual visit patterns"

### Phase 9: Client Family Engagement
- Video chat integration
- Photo sharing (visit documentation)
- Family satisfaction surveys

---

## Success Metrics

### Engagement
- **Target**: 70% of demo users interact with >3 personas
- **Target**: Average session duration >15 minutes
- **Target**: 50% of demo users trigger write operations

### Conversion
- **Target**: 25% of demo users request sales follow-up
- **Target**: 40% of prospects who demo convert to paid customers
- **Target**: 90% satisfaction score on demo experience

### Technical
- **Target**: Zero critical bugs in demo mode
- **Target**: 99.9% uptime for demo infrastructure
- **Target**: <500ms API response time maintained under load

---

## Timeline Summary

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Phase 1 | Week 1 | Rich seed data + demo infrastructure |
| Phase 2 | Week 2 | Demo session management |
| Phase 3 | Week 2-3 | Write-enabled demo APIs |
| Phase 4 | Week 3-4 | Role-based demo UI |
| Phase 5 | Week 4 | Family portal + AI chatbot |

**Total**: 3-4 weeks for complete implementation

---

## Next Steps

1. **Immediate** (Today):
   - [x] Complete caregiver/client persona definitions
   - [ ] Finish seed script implementation
   - [ ] Test seed script on local database

2. **This Week**:
   - [ ] Implement demo session manager
   - [ ] Create demo API routes
   - [ ] Build caregiver demo UI

3. **Next Week**:
   - [ ] Implement coordinator and admin UIs
   - [ ] Add demo mode toggle
   - [ ] Write integration tests

4. **Week 3-4**:
   - [ ] Integrate Twilio for SMS
   - [ ] Integrate Anthropic Claude for chatbot
   - [ ] Build family portal UI
   - [ ] End-to-end testing

---

## Resources

- **Design mockups**: [Figma link TBD]
- **API documentation**: [Swagger/OpenAPI spec TBD]
- **Demo script**: [Sales demo walkthrough TBD]
- **Video demo**: [YouTube unlisted link TBD]

---

## Questions & Decisions Needed

1. **Storage**: In-memory vs Redis for demo sessions?
   - **Recommendation**: Start in-memory, add Redis adapter if scaling needed

2. **AI Provider**: Claude vs GPT-4 for family chatbot?
   - **Recommendation**: Claude Sonnet (better instruction following, lower cost)

3. **SMS Provider**: Twilio vs alternatives?
   - **Recommendation**: Twilio (industry standard, reliable)

4. **Mobile**: Native app or responsive web?
   - **Recommendation**: Responsive web first, native app later

5. **Multi-tenancy**: Support multiple demo agencies?
   - **Recommendation**: Single demo agency for now, multi-tenant later

---

**Last Updated**: 2025-01-05  
**Status**: Phase 1 in progress  
**Owner**: Development Team  
**Stakeholders**: Sales, Product, Engineering
