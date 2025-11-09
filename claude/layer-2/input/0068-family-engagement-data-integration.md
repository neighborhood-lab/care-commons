# Task 0068: Family Engagement Data Integration Fixes

**Priority:** 🔴 CRITICAL
**Estimated Effort:** 1 week
**Vertical:** family-engagement
**Type:** Bug Fix / Integration

---

## Context

The family engagement service has **6 FIXME comments** for data integration issues. Currently, the service uses:
- Hardcoded placeholder data
- User IDs instead of actual names
- Missing validation for thread access
- Non-integrated visit/client/care plan data

These prevent the family portal from displaying real, accurate information.

### Affected Code Locations

```typescript
// verticals/family-engagement/src/services/family-engagement-service.ts

Line 335: FIXME: Get actual user name (currently returns userId)
Line 357: FIXME: Get thread to validate access and get clientId
Line 364: FIXME: Get actual user name (currently returns userId)
Line 445: FIXME: Get upcoming visits from visit summary table
Line 455: FIXME: Fetch from client service
Line 462: FIXME: Fetch from care plan service
```

---

## Objectives

Fix all 6 data integration issues to ensure:
1. Real user names displayed (not user IDs)
2. Proper access validation for threads
3. Real visit data from visit summary table
4. Real client data from client service
5. Real care plan data from care plan service

---

## Technical Requirements

### 1. Fix User Name Resolution (Lines 335, 364)

**Current Code:**
```typescript
async getThread(threadId: number): Promise<MessageThread | null> {
  const thread = await this.repository.getThread(threadId);
  if (!thread) return null;

  return {
    ...thread,
    participants: thread.participants.map(p => ({
      userId: p.user_id,
      userName: p.user_id.toString(), // FIXME: Get actual user name
      role: p.role,
      joinedAt: p.joined_at,
    })),
  };
}
```

**Fix:**
```typescript
async getThread(threadId: number): Promise<MessageThread | null> {
  const thread = await this.repository.getThread(threadId);
  if (!thread) return null;

  // Fetch user names for all participants
  const userIds = thread.participants.map(p => p.user_id);
  const users = await this.userProvider.getUsersByIds(userIds);
  const userNameMap = new Map(users.map(u => [u.id, u.name]));

  return {
    ...thread,
    participants: thread.participants.map(p => ({
      userId: p.user_id,
      userName: userNameMap.get(p.user_id) || 'Unknown User',
      role: p.role,
      joinedAt: p.joined_at,
    })),
  };
}
```

**Implementation Steps:**
1. Create `IUserProvider` interface in `packages/core/src/providers/user-provider.ts`:
   ```typescript
   export interface IUserProvider {
     getUserById(id: number): Promise<User | null>;
     getUsersByIds(ids: number[]): Promise<User[]>;
     getUserName(id: number): Promise<string>;
   }
   ```

2. Implement provider in `packages/core/src/providers/user-provider-impl.ts`:
   ```typescript
   export class UserProvider implements IUserProvider {
     async getUsersByIds(ids: number[]): Promise<User[]> {
       if (ids.length === 0) return [];

       const query = `
         SELECT id, name, email, role
         FROM users
         WHERE id = ANY($1)
       `;

       const result = await database.query(query, [ids]);
       return result.rows;
     }

     async getUserName(id: number): Promise<string> {
       const user = await this.getUserById(id);
       return user?.name || 'Unknown User';
     }
   }
   ```

3. Inject `IUserProvider` into `FamilyEngagementService` constructor
4. Use `userProvider.getUsersByIds()` in `getThread()` method
5. Use `userProvider.getUserName()` in `sendMessage()` method (line 364)

---

### 2. Fix Thread Access Validation (Line 357)

**Current Code:**
```typescript
async sendMessage(
  threadId: number,
  senderId: number,
  content: string
): Promise<Message> {
  // FIXME: Get thread to validate access and get clientId
  const clientId = 1; // Placeholder

  const message = await this.repository.createMessage({
    thread_id: threadId,
    sender_id: senderId,
    content,
  });

  return this.mapMessage(message);
}
```

**Fix:**
```typescript
async sendMessage(
  threadId: number,
  senderId: number,
  content: string
): Promise<Message> {
  // Validate thread exists and user has access
  const thread = await this.repository.getThread(threadId);

  if (!thread) {
    throw new Error(`Thread ${threadId} not found`);
  }

  // Verify sender is a participant
  const isParticipant = thread.participants.some(p => p.user_id === senderId);
  if (!isParticipant) {
    throw new Error(`User ${senderId} is not a participant in thread ${threadId}`);
  }

  const clientId = thread.client_id;

  // Create message
  const message = await this.repository.createMessage({
    thread_id: threadId,
    sender_id: senderId,
    content,
  });

  // Notify other participants
  await this.notifyThreadParticipants(thread, message, senderId);

  return this.mapMessage(message);
}
```

**Implementation Steps:**
1. Add thread validation to `sendMessage()`
2. Check sender is participant
3. Extract `clientId` from thread record
4. Add comprehensive error handling
5. Add audit logging for message sends

---

### 3. Fix Visit Data Integration (Line 445)

**Current Code:**
```typescript
async getDashboardData(familyMemberId: number): Promise<FamilyDashboard> {
  const summary = await this.repository.getFamilySummary(familyMemberId);

  // FIXME: Get upcoming visits from visit summary table
  const upcomingVisits: UpcomingVisit[] = [];

  return {
    summary,
    upcomingVisits,
    recentUpdates: [],
    careTeam: [],
  };
}
```

**Fix:**
```typescript
async getDashboardData(familyMemberId: number): Promise<FamilyDashboard> {
  const summary = await this.repository.getFamilySummary(familyMemberId);

  // Get client IDs for this family member
  const clients = await this.repository.getClientsForFamilyMember(familyMemberId);
  const clientIds = clients.map(c => c.id);

  if (clientIds.length === 0) {
    return {
      summary,
      upcomingVisits: [],
      recentUpdates: [],
      careTeam: [],
    };
  }

  // Fetch upcoming visits from visit summary table
  const upcomingVisits = await this.visitProvider.getUpcomingVisitsForClients(
    clientIds,
    { limit: 10, startDate: new Date() }
  );

  // Fetch recent updates (last 7 days)
  const recentUpdates = await this.getRecentUpdates(clientIds, 7);

  // Fetch care team
  const careTeam = await this.getCareTeam(clientIds);

  return {
    summary,
    upcomingVisits,
    recentUpdates,
    careTeam,
  };
}
```

**Implementation Steps:**
1. Create `IVisitProvider` interface method `getUpcomingVisitsForClients()`:
   ```typescript
   interface IVisitProvider {
     getUpcomingVisitsForClients(
       clientIds: number[],
       options: { limit: number; startDate: Date }
     ): Promise<UpcomingVisit[]>;
   }
   ```

2. Implement in `packages/core/src/providers/visit-provider-impl.ts`:
   ```typescript
   async getUpcomingVisitsForClients(
     clientIds: number[],
     options: { limit: number; startDate: Date }
   ): Promise<UpcomingVisit[]> {
     const query = `
       SELECT
         v.id,
         v.client_id,
         v.scheduled_start_time,
         v.scheduled_end_time,
         v.status,
         c.first_name || ' ' || c.last_name as caregiver_name,
         s.service_name
       FROM visits v
       LEFT JOIN caregivers c ON v.caregiver_id = c.id
       LEFT JOIN services s ON v.service_id = s.id
       WHERE v.client_id = ANY($1)
         AND v.scheduled_start_time >= $2
         AND v.status IN ('scheduled', 'confirmed')
       ORDER BY v.scheduled_start_time ASC
       LIMIT $3
     `;

     const result = await database.query(query, [
       clientIds,
       options.startDate.toISOString(),
       options.limit,
     ]);

     return result.rows.map(row => ({
       visitId: row.id,
       clientId: row.client_id,
       startTime: new Date(row.scheduled_start_time),
       endTime: new Date(row.scheduled_end_time),
       caregiverName: row.caregiver_name,
       serviceName: row.service_name,
       status: row.status,
     }));
   }
   ```

3. Add repository method `getClientsForFamilyMember()`:
   ```typescript
   async getClientsForFamilyMember(familyMemberId: number): Promise<Client[]> {
     const query = `
       SELECT DISTINCT c.*
       FROM clients c
       JOIN family_members fm ON c.id = fm.client_id
       WHERE fm.user_id = $1
         AND fm.status = 'active'
     `;

     const result = await database.query(query, [familyMemberId]);
     return result.rows;
   }
   ```

---

### 4. Fix Client Data Integration (Line 455)

**Current Code:**
```typescript
async getClientInfo(clientId: number): Promise<ClientInfo> {
  // FIXME: Fetch from client service
  return {
    id: clientId,
    name: 'John Doe',
    age: 75,
    condition: 'Diabetes, Hypertension',
  };
}
```

**Fix:**
```typescript
async getClientInfo(clientId: number): Promise<ClientInfo> {
  const client = await this.clientProvider.getClientById(clientId);

  if (!client) {
    throw new Error(`Client ${clientId} not found`);
  }

  // Calculate age from date of birth
  const age = this.calculateAge(client.date_of_birth);

  // Get active diagnoses
  const diagnoses = await this.clientProvider.getActiveDiagnoses(clientId);
  const condition = diagnoses.map(d => d.name).join(', ') || 'No active diagnoses';

  return {
    id: client.id,
    name: `${client.first_name} ${client.last_name}`,
    age,
    condition,
    address: client.address,
    phoneNumber: client.phone_number,
  };
}

private calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}
```

**Implementation Steps:**
1. Use existing `IClientProvider` (should already exist from client-demographics vertical)
2. Add `getActiveDiagnoses()` method if not present:
   ```typescript
   interface IClientProvider {
     getActiveDiagnoses(clientId: number): Promise<Diagnosis[]>;
   }
   ```

3. Inject `IClientProvider` into `FamilyEngagementService`
4. Replace placeholder data with real client data

---

### 5. Fix Care Plan Data Integration (Line 462)

**Current Code:**
```typescript
async getCarePlanInfo(clientId: number): Promise<CarePlanInfo> {
  // FIXME: Fetch from care plan service
  return {
    goals: [],
    tasks: [],
    lastUpdated: new Date(),
  };
}
```

**Fix:**
```typescript
async getCarePlanInfo(clientId: number): Promise<CarePlanInfo> {
  const carePlan = await this.carePlanProvider.getActiveCarePlan(clientId);

  if (!carePlan) {
    return {
      goals: [],
      tasks: [],
      lastUpdated: null,
    };
  }

  // Fetch goals and tasks
  const [goals, tasks] = await Promise.all([
    this.carePlanProvider.getGoals(carePlan.id),
    this.carePlanProvider.getTasks(carePlan.id),
  ]);

  return {
    carePlanId: carePlan.id,
    goals: goals.map(g => ({
      id: g.id,
      description: g.description,
      targetDate: g.target_date,
      status: g.status,
    })),
    tasks: tasks.map(t => ({
      id: t.id,
      description: t.description,
      frequency: t.frequency,
      lastCompleted: t.last_completed_at,
      status: t.status,
    })),
    lastUpdated: carePlan.updated_at,
  };
}
```

**Implementation Steps:**
1. Create `ICarePlanProvider` interface (if not exists):
   ```typescript
   export interface ICarePlanProvider {
     getActiveCarePlan(clientId: number): Promise<CarePlan | null>;
     getGoals(carePlanId: number): Promise<Goal[]>;
     getTasks(carePlanId: number): Promise<Task[]>;
   }
   ```

2. Implement provider using care-plans-tasks vertical:
   ```typescript
   export class CarePlanProvider implements ICarePlanProvider {
     async getActiveCarePlan(clientId: number): Promise<CarePlan | null> {
       const query = `
         SELECT *
         FROM care_plans
         WHERE client_id = $1
           AND status = 'active'
         ORDER BY created_at DESC
         LIMIT 1
       `;

       const result = await database.query(query, [clientId]);
       return result.rows[0] || null;
     }

     async getGoals(carePlanId: number): Promise<Goal[]> {
       const query = `
         SELECT *
         FROM care_plan_goals
         WHERE care_plan_id = $1
           AND status != 'deleted'
         ORDER BY target_date ASC
       `;

       const result = await database.query(query, [carePlanId]);
       return result.rows;
     }

     async getTasks(carePlanId: number): Promise<Task[]> {
       const query = `
         SELECT *
         FROM care_plan_tasks
         WHERE care_plan_id = $1
           AND status = 'active'
         ORDER BY task_order ASC
       `;

       const result = await database.query(query, [carePlanId]);
       return result.rows;
     }
   }
   ```

3. Inject `ICarePlanProvider` into `FamilyEngagementService`
4. Update `getCarePlanInfo()` to use real data

---

## Provider Injection Setup

Update `FamilyEngagementService` constructor:

```typescript
export class FamilyEngagementService {
  constructor(
    private repository: IFamilyEngagementRepository,
    private userProvider: IUserProvider,        // NEW
    private visitProvider: IVisitProvider,      // NEW
    private clientProvider: IClientProvider,    // NEW
    private carePlanProvider: ICarePlanProvider // NEW
  ) {}

  // ... methods
}
```

Update service initialization in `verticals/family-engagement/src/index.ts`:

```typescript
import { UserProvider } from '@care-commons/core/providers/user-provider';
import { VisitProvider } from '@care-commons/core/providers/visit-provider';
import { ClientProvider } from '@care-commons/core/providers/client-provider';
import { CarePlanProvider } from '@care-commons/core/providers/care-plan-provider';

const familyEngagementService = new FamilyEngagementService(
  familyEngagementRepository,
  new UserProvider(),
  new VisitProvider(),
  new ClientProvider(),
  new CarePlanProvider()
);
```

---

## Testing Requirements

### Unit Tests

Create `family-engagement-service.integration.test.ts`:

```typescript
describe('FamilyEngagementService - Data Integration', () => {
  it('should resolve user names in thread participants', async () => {
    // Arrange
    const thread = await service.getThread(1);

    // Assert
    expect(thread.participants[0].userName).not.toBe('1');
    expect(thread.participants[0].userName).toMatch(/^[A-Z]/); // Starts with capital
  });

  it('should validate thread access before sending message', async () => {
    // Arrange
    const nonParticipantId = 999;

    // Act & Assert
    await expect(
      service.sendMessage(1, nonParticipantId, 'Test')
    ).rejects.toThrow('not a participant');
  });

  it('should fetch real upcoming visits', async () => {
    // Arrange
    const dashboard = await service.getDashboardData(familyMemberId);

    // Assert
    expect(dashboard.upcomingVisits).toBeInstanceOf(Array);
    expect(dashboard.upcomingVisits[0]).toHaveProperty('visitId');
    expect(dashboard.upcomingVisits[0].visitId).toBeGreaterThan(0);
  });

  it('should fetch real client data', async () => {
    // Arrange
    const clientInfo = await service.getClientInfo(clientId);

    // Assert
    expect(clientInfo.name).not.toBe('John Doe');
    expect(clientInfo.age).toBeGreaterThan(0);
  });

  it('should fetch real care plan data', async () => {
    // Arrange
    const carePlan = await service.getCarePlanInfo(clientId);

    // Assert
    expect(carePlan.goals).toBeInstanceOf(Array);
    expect(carePlan.tasks).toBeInstanceOf(Array);
  });
});
```

### Integration Tests

Test full dashboard data flow:

```typescript
describe('Family Dashboard - E2E', () => {
  it('should display complete dashboard with real data', async () => {
    // Create test data
    const familyMember = await createTestFamilyMember();
    const client = await createTestClient({ familyMemberId: familyMember.id });
    const visit = await createTestVisit({ clientId: client.id });
    const carePlan = await createTestCarePlan({ clientId: client.id });

    // Fetch dashboard
    const dashboard = await service.getDashboardData(familyMember.id);

    // Verify all data present
    expect(dashboard.upcomingVisits).toHaveLength(1);
    expect(dashboard.upcomingVisits[0].visitId).toBe(visit.id);
    expect(dashboard.summary.activeClients).toBe(1);
  });
});
```

---

## Success Criteria

- [ ] All 6 FIXME comments removed
- [ ] User names displayed correctly (not user IDs)
- [ ] Thread access validated before message send
- [ ] Real visit data shown in dashboard
- [ ] Real client data shown in portal
- [ ] Real care plan data shown in portal
- [ ] All providers properly injected
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] No hardcoded placeholder data
- [ ] Error handling for missing data

---

## Related Tasks

- Task 0036: Family Engagement Portal UI (completed)
- Task 0067: Notification Delivery System
- Task 0023: Care Plans Frontend UI (completed)
