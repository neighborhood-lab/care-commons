# Visit Notes Vertical

Rich text visit documentation with templates, voice-to-text, and digital signatures.

## Features

### ✅ Implemented (Backend)

1. **Rich Text Notes**
   - Plain text and HTML storage
   - Support for WYSIWYG editor integration (TipTap)
   - Character limits for compliance

2. **Note Templates**
   - Pre-defined templates for common scenarios
   - Category-based organization (incident, medication, behavioral, etc.)
   - Structured prompts for guided input
   - Placeholder support ({{client_name}}, {{date}}, etc.)
   - Usage tracking and analytics

3. **Digital Signatures**
   - Caregiver signature (required)
   - Client/family signature (optional acknowledgment)
   - Supervisor signature (for incidents/reviews)
   - Base64 signature data storage
   - Permanent URL storage (S3/blob storage)
   - Signer relationship tracking
   - Device and IP address audit trail

4. **Voice-to-Text**
   - Audio file storage (S3 URL)
   - Transcription confidence tracking
   - Flagging for voice-generated notes

5. **Immutability & Compliance**
   - Auto-lock after 24 hours
   - Database trigger enforcement
   - Audit trail (who, when, why)
   - Soft delete with lock check

6. **Mobile Offline Support**
   - Sync pending flag
   - Offline queue management
   - Sync timestamp tracking

7. **Incident Tracking**
   - Incident severity levels
   - Required descriptions
   - Supervisor review flags
   - Incident reporting timestamps

8. **Client Assessment**
   - Mood tracking (6 levels)
   - Condition notes
   - Activity logging

## Database Schema

### `visit_notes` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `visit_id` | UUID | Foreign key to visits |
| `organization_id` | UUID | Organization scope |
| `caregiver_id` | UUID | Author |
| `note_text` | TEXT | Plain text content |
| `note_html` | TEXT | Rich text HTML |
| `template_id` | UUID | Template used (optional) |
| `is_locked` | BOOLEAN | Immutability flag |
| `locked_at` | TIMESTAMP | Lock timestamp |
| `caregiver_signature_data` | TEXT | Base64 signature |
| `client_signature_data` | TEXT | Base64 signature |
| `is_voice_note` | BOOLEAN | Voice-generated flag |
| `audio_file_uri` | VARCHAR(500) | S3 URL |

### `visit_note_templates` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `organization_id` | UUID | Organization scope |
| `name` | VARCHAR(200) | Template name |
| `category` | ENUM | Category (incident, medication, etc.) |
| `template_text` | TEXT | Template with placeholders |
| `template_html` | TEXT | Rich text version |
| `prompts` | JSONB | Structured input prompts |
| `default_activities` | JSONB | Pre-filled activities |
| `requires_signature` | BOOLEAN | Signature requirement |
| `usage_count` | INTEGER | Usage analytics |

## API Endpoints

### Visit Notes

```typescript
POST   /api/visit-notes              // Create note
GET    /api/visit-notes/:id           // Get note by ID
PATCH  /api/visit-notes/:id           // Update note (if not locked)
DELETE /api/visit-notes/:id           // Soft delete (if not locked)
POST   /api/visit-notes/:id/signature // Add signature
GET    /api/visits/:visitId/notes     // Get all notes for visit
GET    /api/caregivers/:id/notes      // Get caregiver's recent notes
```

### Templates

```typescript
POST   /api/visit-note-templates       // Create template
GET    /api/visit-note-templates/:id   // Get template by ID
PATCH  /api/visit-note-templates/:id   // Update template
DELETE /api/visit-note-templates/:id   // Soft delete template
GET    /api/visit-note-templates       // Search templates
GET    /api/visit-note-templates/active // Get active templates
```

## Usage Examples

### Create a Visit Note

```typescript
import { VisitNoteRepository } from '@care-commons/visit-notes';

const repo = new VisitNoteRepository(pool);

const note = await repo.create({
  visitId: 'visit-uuid',
  organizationId: 'org-uuid',
  caregiverId: 'caregiver-uuid',
  noteText: 'Client was in good spirits today...',
  noteHtml: '<p>Client was in <strong>good spirits</strong> today...</p>',
  templateId: 'template-uuid',
  activitiesPerformed: ['Bathing', 'Meal Preparation', 'Medication Reminder'],
  clientMood: 'GOOD',
  requiresSignature: true,
}, userContext);
```

### Add Caregiver Signature

```typescript
await repo.addSignature({
  noteId: note.id,
  signatureType: 'caregiver',
  signatureData: 'data:image/png;base64,iVBORw0KG...',
  device: 'iPhone 14',
  ipAddress: '192.168.1.100',
}, userContext);
```

### Use a Template

```typescript
const template = await templateRepo.findById('template-uuid');

// Populate template with placeholders
const noteText = template.templateText
  .replace('{{client_name}}', 'John Doe')
  .replace('{{date}}', new Date().toLocaleDateString())
  .replace('{{caregiver_name}}', 'Jane Smith');

const note = await noteRepo.create({
  visitId: 'visit-uuid',
  organizationId: 'org-uuid',
  caregiverId: 'caregiver-uuid',
  noteText,
  templateId: template.id,
  // ... other fields
}, userContext);
```

### Search Notes

```typescript
const result = await noteRepo.search(
  {
    organizationId: 'org-uuid',
    dateFrom: new Date('2025-01-01'),
    dateTo: new Date('2025-01-31'),
    isIncident: true,
  },
  { page: 1, limit: 20 }
);

console.log(`Found ${result.total} incident notes`);
```

## Frontend Integration (To Be Implemented)

### Required Components

1. **Rich Text Editor** (TipTap)
   ```typescript
   <RichTextEditor
     initialContent={note.noteHtml}
     onChange={(html, text) => setNote({ noteHtml: html, noteText: text })}
     placeholder="Document your visit..."
   />
   ```

2. **Template Selector**
   ```typescript
   <TemplateSelector
     category="INCIDENT"
     onSelect={(template) => applyTemplate(template)}
   />
   ```

3. **Voice-to-Text** (Web Speech API / Mobile)
   ```typescript
   <VoiceRecorder
     onTranscribe={(text, audioUrl, confidence) => {
       setNote({ noteText: text, audioFileUri: audioUrl });
     }}
   />
   ```

4. **Signature Pad**
   ```typescript
   <SignaturePad
     onSave={(signatureData) => addSignature('caregiver', signatureData)}
   />
   ```

5. **Visit Notes Form**
   ```typescript
   <VisitNoteForm
     visitId={visitId}
     templates={templates}
     onSubmit={createNote}
   />
   ```

## Common Scenarios

### 1. Fall Incident Template

```json
{
  "name": "Fall Incident Report",
  "category": "INCIDENT",
  "templateText": "Client {{client_name}} experienced a fall at {{time}} on {{date}}.\n\nCircumstances: [Describe what happened]\n\nInjuries observed: [List any visible injuries]\n\nClient's condition after fall: [Assessment]\n\nActions taken: [Interventions]\n\nPhysician/family notified: [Yes/No and time]",
  "requiresSignature": true,
  "requiresIncidentFlag": true,
  "requiresSupervisorReview": true
}
```

### 2. Medication Refusal Template

```json
{
  "name": "Medication Refusal",
  "category": "MEDICATION",
  "templateText": "Client {{client_name}} refused medication(s) on {{date}} at {{time}}.\n\nMedication(s) refused: [List medications]\n\nReason given: [Client's stated reason]\n\nCaregiver response: [Actions taken]\n\nPhysician/family notified: [Yes/No]",
  "requiresSignature": true,
  "prompts": [
    {
      "id": "medications",
      "label": "Which medications were refused?",
      "type": "textarea",
      "required": true
    },
    {
      "id": "reason",
      "label": "Why did the client refuse?",
      "type": "select",
      "options": ["Didn't want to", "Nausea", "Pain", "Other"],
      "required": true
    }
  ]
}
```

### 3. General Progress Note Template

```json
{
  "name": "Daily Progress Note",
  "category": "GENERAL",
  "templateText": "Visit with {{client_name}} on {{date}} from {{start_time}} to {{end_time}}.\n\nClient's mood: {{client_mood}}\n\nActivities performed:\n{{activities}}\n\nClient's response to care: [Positive/cooperative/etc.]\n\nAny concerns or observations: [Notes]\n\nPlan for next visit: [Follow-up items]",
  "defaultActivities": [
    "Personal hygiene assistance",
    "Meal preparation",
    "Light housekeeping",
    "Medication reminder",
    "Companionship"
  ]
}
```

## Compliance Features

### Auto-Lock After 24 Hours

Notes automatically lock 24 hours after creation via database trigger:

```sql
CREATE FUNCTION auto_lock_visit_notes()
IF created_at < NOW() - INTERVAL '24 hours' AND is_locked = FALSE THEN
  is_locked = TRUE
  locked_at = NOW()
  lock_reason = 'Automatic lock after 24 hours (compliance requirement)'
END
```

### Audit Trail

All changes tracked:
- `created_by`, `created_at` - Initial author and timestamp
- `updated_by`, `updated_at` - Last modifier and timestamp
- `locked_by`, `locked_at`, `lock_reason` - Lock audit
- `deleted_by`, `deleted_at` - Soft delete audit

### Signature Verification

- Base64 image data for immediate display
- Permanent URL (S3) for long-term storage
- Device and IP tracking for forensics
- Timestamp and signer relationship

## Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Migration

```bash
# Run migrations
npm run db:migrate

# Rollback
npm run db:migrate:rollback
```

## License

MIT
