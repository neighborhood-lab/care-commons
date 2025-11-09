# Task 0087: Emergency Contact and Alert System

**Priority:** 🟠 HIGH
**Estimated Effort:** 1 week
**Type:** Safety / Feature / Critical
**Vertical:** emergency-alerts (NEW)

---

## Context

Home healthcare involves elderly and vulnerable patients. **Medical emergencies, falls, and urgent situations will happen.** Currently, Care Commons has no dedicated emergency alert system, putting caregivers in a position where they must handle emergencies through manual phone calls and external communication.

**Safety Risk Without This Feature:**
- Delayed emergency response
- No clear escalation path
- Caregivers don't know who to contact
- Family not notified during emergencies
- No documentation of emergency incidents

**Goal State:**
- One-tap emergency alert from mobile app
- Automatic notification to all relevant parties
- Clear emergency contact hierarchy
- GPS location shared with responders
- Emergency incidents tracked for compliance

---

## Objectives

1. **Build Emergency Alert Button (Mobile)**
2. **Create Emergency Contact Management (Web)**
3. **Implement Multi-Channel Emergency Notifications**
4. **Add Emergency Incident Tracking**
5. **Create Emergency Response Playbook**

---

## Database Schema

```sql
-- Emergency contacts per client
CREATE TABLE emergency_contacts (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id),

  -- Contact info
  name VARCHAR(255) NOT NULL,
  relationship VARCHAR(100), -- daughter, son, spouse, doctor, etc.
  phone VARCHAR(20) NOT NULL,
  alternate_phone VARCHAR(20),
  email VARCHAR(255),

  -- Priority
  priority INTEGER DEFAULT 1, -- 1 = primary, 2 = secondary, etc.
  contact_for VARCHAR(50)[], -- {medical, behavioral, general, falls, etc.}

  -- Availability
  available_24_7 BOOLEAN DEFAULT false,
  available_hours VARCHAR(255), -- e.g., "9AM-5PM Mon-Fri"

  -- Special instructions
  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Emergency alerts log
CREATE TABLE emergency_alerts (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id),
  caregiver_id INTEGER REFERENCES caregivers(id),
  visit_id INTEGER REFERENCES visits(id),

  -- Alert details
  alert_type VARCHAR(50), -- fall, medical, behavioral, injury, other
  severity VARCHAR(20), -- critical, high, medium, low
  description TEXT,

  -- Location
  gps_latitude DECIMAL(10, 8),
  gps_longitude DECIMAL(11, 8),
  address TEXT,

  -- Response
  status VARCHAR(20), -- active, responding, resolved, canceled
  ems_called BOOLEAN DEFAULT false,
  ems_arrival_time TIMESTAMP,
  hospital_transport BOOLEAN DEFAULT false,
  hospital_name VARCHAR(255),

  -- Notifications sent
  notifications_sent JSONB, -- [{contact_id, method, sent_at, delivered}]

  -- Resolution
  resolved_at TIMESTAMP,
  resolved_by INTEGER REFERENCES users(id),
  resolution_notes TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Mobile UI: Emergency Alert Button

**Location:** `packages/mobile/src/components/EmergencyAlertButton.tsx`

### Placement

**Always Visible:**
- Bottom right corner of every screen (floating action button)
- Red color, clear icon (!)
- Always accessible during visits

### Alert Flow

**Step 1: Confirm Emergency**
```
🚨 EMERGENCY ALERT

Are you sure you want to send an emergency alert?

This will notify:
- Agency coordinators
- Emergency contacts for [Client Name]
- On-call supervisor

[Cancel] [Send Emergency Alert]
```

**Step 2: Emergency Type**
```
What type of emergency?

○ Fall
○ Medical Emergency (chest pain, difficulty breathing, etc.)
○ Behavioral Crisis
○ Injury
○ Other

[Next]
```

**Step 3: Quick Details**
```
Brief description (optional):
[Text input: "Client fell in bathroom, cannot get up"]

☑ I've called 911 (check if applicable)

[Send Alert]
```

**Step 4: Alert Sent**
```
✅ Emergency Alert Sent

The following have been notified:
- Coordinator Emily Rodriguez
- Emergency Contact: Sarah Johnson (daughter)
- On-call Supervisor

Your location has been shared.

Stay with the client and await further instructions.

[Call 911] [Close]
```

---

## Web UI: Emergency Contact Management

**Location:** `packages/web/src/verticals/emergency-alerts/`

### Components

**1. Emergency Contacts Tab (Client Profile)**

```tsx
<EmergencyContactsList clientId={clientId}>
  <EmergencyContactCard>
    <div className="priority-badge">PRIMARY</div>
    <h3>Sarah Johnson</h3>
    <p>Daughter</p>
    <p>Phone: (512) 555-1234</p>
    <p>Email: sarah@email.com</p>
    <p>Available: 24/7</p>
    <p>Contact for: Medical, Falls, General</p>

    <Button onClick={testContact}>Test Contact</Button>
    <Button onClick={editContact}>Edit</Button>
  </EmergencyContactCard>

  <AddEmergencyContactButton />
</EmergencyContactsList>
```

**2. Emergency Alert Dashboard**

Real-time view of active emergencies:

```tsx
<ActiveEmergenciesPanel>
  {activeAlerts.map(alert => (
    <EmergencyAlertCard
      alert={alert}
      status={alert.status} // active, responding, resolved
      severity={alert.severity}
    >
      <h3>🚨 {alert.alert_type} - {alert.client.name}</h3>
      <p>Reported by: {alert.caregiver.name}</p>
      <p>Time: {formatTime(alert.created_at)}</p>
      <p>Location: {alert.address}</p>
      <p>Description: {alert.description}</p>

      <div className="response-actions">
        <Button onClick={callCaregiver}>Call Caregiver</Button>
        <Button onClick={callEmergencyContact}>Call Emergency Contact</Button>
        <Button onClick={viewLocation}>View GPS Location</Button>
        <Button onClick={markResolved}>Mark Resolved</Button>
      </div>

      <NotificationStatus>
        Notified:
        - Sarah Johnson (SMS sent 10:32 AM, delivered ✓)
        - Dr. Smith (SMS sent 10:32 AM, delivered ✓)
        - Coordinator Emily (SMS sent 10:32 AM, read 10:33 AM ✓)
      </NotificationStatus>
    </EmergencyAlertCard>
  ))}
</ActiveEmergenciesPanel>
```

---

## Multi-Channel Emergency Notifications

**When emergency alert is triggered:**

### SMS Notifications (Primary)

**To Caregiver's Supervisor:**
```
🚨 EMERGENCY ALERT
Client: Mary Johnson
Type: Fall
Caregiver: Emma Davis
Location: 456 Oak St, Austin TX
Time: 10:32 AM

View details: https://app.care-commons.com/alerts/12345
Call caregiver: (555) 123-4567
```

**To Emergency Contact:**
```
URGENT: Emergency alert for Mary Johnson
Type: Fall
Caregiver Emma Davis is with her at home (456 Oak St)
Time: 10:32 AM

We are responding. We will call you shortly.

- Sunshine Home Healthcare
(512) 555-0100
```

### Phone Call (Escalation)

If SMS not read within 2 minutes:
- Automatic phone call to coordinator's mobile
- Text-to-speech: "This is Care Commons. Emergency alert for Mary Johnson. Fall reported by caregiver Emma Davis. Please respond immediately."

### In-App Notifications

- Push notification to all coordinators
- Alert appears in web dashboard
- Audio alert on coordinator's computer

---

## Emergency Response Playbook

**For Caregivers (Mobile App):**

**If Client Falls:**
1. Do not move client
2. Check for injuries, pain, bleeding
3. Tap Emergency Alert button in app
4. Call 911 if client is injured, in pain, or unconscious
5. Stay with client
6. Document incident when emergency is resolved

**If Medical Emergency:**
1. Call 911 immediately
2. Tap Emergency Alert button in app
3. Stay with client, monitor vital signs if possible
4. Be ready to provide information to EMS
5. Document incident

**If Behavioral Crisis:**
1. Ensure your safety first
2. Tap Emergency Alert button
3. Remove any dangerous objects
4. Stay calm, speak softly
5. Wait for supervisor instructions
6. Document incident

---

## Emergency Incident Reports

**After Emergency Resolved:**

Caregiver or coordinator fills out incident report:

```
EMERGENCY INCIDENT REPORT

Client: Mary Johnson
Date/Time: 11/08/2025 10:32 AM
Type: Fall
Severity: Medium

Description:
Client was walking from bedroom to bathroom when she tripped over
bath mat. She fell to the floor and was unable to get up on her own.

Response:
- Caregiver assessed client, no visible injuries
- Client complained of hip soreness
- 911 not called (client refused transport)
- Assisted client to bed with walker
- Applied ice to hip
- Notified daughter Sarah Johnson
- Sarah arrived at home within 30 minutes

EMS Called: No
Hospital Transport: No
Doctor Notified: Yes - Dr. Smith's office at 11:00 AM

Follow-up Required:
- Schedule doctor appointment for hip evaluation
- Remove bath mat (fall hazard)
- Client to use walker at all times
- Daughter to visit daily for next 3 days

Reported by: Emma Davis, Caregiver
Reviewed by: Emily Rodriguez, Coordinator
```

**Compliance:**
- All emergency incidents must be documented
- Family must be notified within 2 hours
- Patterns analyzed monthly (e.g., repeated falls → needs intervention)

---

## Success Criteria

- [ ] Emergency alert button accessible from any mobile screen
- [ ] Alert notifications deliver to all parties within 30 seconds
- [ ] GPS location accurate and shared with responders
- [ ] 100% of emergency incidents documented
- [ ] Emergency contact phone numbers tested quarterly
- [ ] Caregiver emergency response training includes app usage
- [ ] Family satisfaction with emergency response >90%

---

## Related Tasks

- Task 0067: Notification Delivery System (powers alerts)
- Task 0092: Audit Log Viewer (emergency incident review)
- Task 0061: Quality Assurance Module (incident analysis)
