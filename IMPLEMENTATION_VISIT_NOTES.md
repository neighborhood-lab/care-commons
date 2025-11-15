# Rich Text Visit Notes Implementation Summary

## ✅ Completed - Backend Implementation

### 1. Database Migrations

Created three new migrations in `/packages/core/migrations/`:

#### `20251115000001_create_visit_note_templates_table.ts`
- Creates `visit_note_templates` table for reusable note templates
- Features:
  - Organization and branch scoping
  - Category-based templates (incident, medication, behavioral, etc.)
  - Rich text with placeholders ({{client_name}}, {{date}}, etc.)
  - Structured prompts for guided input
  - Pre-filled default activities
  - Usage tracking and analytics
  - Version history support
  - Soft delete capability

#### `20251115000002_add_signature_to_visit_notes.ts`
- Enhances existing `visit_notes` table with signature capture
- Features:
  - **Caregiver signature** (required) - base64 data + permanent URL
  - **Client/family signature** (optional) - with signer name and relationship
  - **Supervisor signature** (for incidents) - with comments
  - Device and IP tracking for audit trail
  - Signature timestamps for compliance

#### Existing Table: `visit_notes` (from `20251111000004`)
- Already includes:
  - Rich text HTML storage (`note_html`)
  - Template reference (`template_id`)
  - Voice-to-text support (`is_voice_note`, `audio_file_uri`, `transcription_confidence`)
  - Auto-locking after 24 hours (immutability trigger)
  - Activity tracking, client mood, incident flags
  - Offline sync support for mobile

### 2. Backend Vertical Structure

Created `/verticals/visit-notes/` with complete implementation:

```
verticals/visit-notes/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── README.md (comprehensive documentation)
└── src/
    ├── types/index.ts              # TypeScript interfaces
    ├── validation/index.ts         # Zod validation schemas
    ├── repository/
    │   ├── note-template-repository.ts    # Template CRUD operations
    │   └── visit-note-repository.ts        # Note CRUD + signatures
    └── index.ts                    # Public exports
```

### 3. TypeScript Types (`/verticals/visit-notes/src/types/index.ts`)

Complete type system including:
- `VisitNote` - Main note entity with all signature fields
- `VisitNoteTemplate` - Template entity with prompts and defaults
- `SignatureData` - Digital signature capture
- `CreateVisitNoteInput` / `UpdateVisitNoteInput`
- `AddSignatureInput` - For adding signatures
- `CreateNoteTemplateInput` / `UpdateNoteTemplateInput`
- Search filter types

### 4. Validation Schemas (`/verticals/visit-notes/src/validation/index.ts`)

Zod schemas for all inputs:
- `createVisitNoteSchema` - Validates note creation with incident/voice rules
- `updateVisitNoteSchema` - Validates updates (only for unlocked notes)
- `addSignatureSchema` - Validates signature data with type-specific rules
- `createNoteTemplateSchema` - Validates template creation
- `templateSearchFiltersSchema` - Validates template searches

### 5. Repository Layer

#### Note Template Repository (`note-template-repository.ts`)
- ✅ `create()` - Create new template
- ✅ `findById()` - Get template by ID
- ✅ `update()` - Update template
- ✅ `delete()` - Soft delete
- ✅ `search()` - Paginated search with filters
- ✅ `findActiveByOrganization()` - Get active templates
- ✅ `findByCategory()` - Filter by category
- ✅ `incrementUsage()` - Track template usage

#### Visit Note Repository (`visit-note-repository.ts`)
- ✅ `create()` - Create new note
- ✅ `findById()` - Get note by ID
- ✅ `findByIdWithTemplate()` - Get note with joined template data
- ✅ `update()` - Update note (with immutability check)
- ✅ `addSignature()` - Add caregiver/client/supervisor signature
- ✅ `markSynced()` - Mark note as synced (for offline support)
- ✅ `findByVisitId()` - Get all notes for a visit
- ✅ `findByCaregiverId()` - Get caregiver's notes
- ✅ `findPendingSync()` - Get notes pending offline sync
- ✅ `search()` - Paginated search with filters
- ✅ `delete()` - Soft delete (with lock check)

### 6. Seed Data (`/packages/core/seeds/visit-note-templates.ts`)

Created 6 common templates:
1. **Daily Progress Note** - General visit documentation
2. **Fall Incident Report** - Comprehensive fall documentation
3. **Medication Refusal** - Medication compliance tracking
4. **Behavioral Observation** - Mental status and behavior changes
5. **Service Refusal** - Client autonomy documentation
6. **ADL Assessment** - Activities of Daily Living evaluation

Each template includes:
- Plain text and rich HTML versions
- Structured prompts for guided input
- Default activities/checkboxes
- Signature requirements
- Category classification

## 🔄 Next Steps - Frontend Implementation

### Frontend Components Needed

#### 1. Rich Text Editor (TipTap)

**Installation:**
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder
```

**Component:** `/packages/web/src/components/RichTextEditor.tsx`
```typescript
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

export function RichTextEditor({ content, onChange, placeholder }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML(), editor.getText());
    },
  });

  return (
    <div className="rich-text-editor">
      <EditorContent editor={editor} />
    </div>
  );
}
```

#### 2. Template Selector

**Component:** `/packages/web/src/components/TemplateSelector.tsx`
```typescript
export function TemplateSelector({ category, onSelect }) {
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    // Fetch templates by category
    fetch(`/api/visit-note-templates?category=${category}`)
      .then(res => res.json())
      .then(data => setTemplates(data.items));
  }, [category]);

  return (
    <select onChange={(e) => onSelect(templates[e.target.value])}>
      <option value="">Select a template...</option>
      {templates.map((t, i) => (
        <option key={t.id} value={i}>{t.name}</option>
      ))}
    </select>
  );
}
```

#### 3. Signature Capture

**Installation:**
```bash
npm install react-signature-canvas
```

**Component:** `/packages/web/src/components/SignaturePad.tsx`
```typescript
import SignatureCanvas from 'react-signature-canvas';

export function SignaturePad({ onSave, signerType }) {
  const sigPad = useRef(null);

  const handleSave = () => {
    const dataURL = sigPad.current.toDataURL();
    onSave({
      signatureData: dataURL,
      signatureType: signerType,
      device: navigator.userAgent,
      ipAddress: null, // Set on backend
    });
  };

  return (
    <div>
      <SignatureCanvas ref={sigPad} />
      <button onClick={() => sigPad.current.clear()}>Clear</button>
      <button onClick={handleSave}>Save Signature</button>
    </div>
  );
}
```

#### 4. Voice-to-Text (Web Speech API)

**Component:** `/packages/mobile/src/components/VoiceRecorder.tsx`
```typescript
export function VoiceRecorder({ onTranscribe }) {
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = () => {
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      const confidence = event.results[0][0].confidence;

      onTranscribe(transcript, audioUrl, confidence);
    };

    recognition.start();
    setIsRecording(true);
  };

  return (
    <button onClick={startRecording}>
      {isRecording ? '🔴 Recording...' : '🎤 Start Voice Note'}
    </button>
  );
}
```

#### 5. Visit Notes Form

**Component:** `/packages/web/src/verticals/visit-notes/VisitNoteForm.tsx`
```typescript
export function VisitNoteForm({ visitId, onSubmit }) {
  const [note, setNote] = useState({
    noteText: '',
    noteHtml: '',
    templateId: null,
    activitiesPerformed: [],
    clientMood: null,
    isIncident: false,
  });

  const applyTemplate = (template) => {
    // Replace placeholders
    const populated = template.templateText
      .replace('{{client_name}}', clientName)
      .replace('{{date}}', new Date().toLocaleDateString());

    setNote({
      ...note,
      noteText: populated,
      noteHtml: template.templateHtml,
      templateId: template.id,
      activitiesPerformed: template.defaultActivities || [],
    });
  };

  const handleSubmit = async () => {
    const response = await fetch('/api/visit-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitId,
        organizationId,
        caregiverId,
        ...note,
      }),
    });

    const created = await response.json();
    onSubmit(created);
  };

  return (
    <form onSubmit={handleSubmit}>
      <TemplateSelector onSelect={applyTemplate} />

      <RichTextEditor
        content={note.noteHtml}
        onChange={(html, text) => setNote({
          ...note,
          noteHtml: html,
          noteText: text,
        })}
      />

      <ActivityCheckboxes
        activities={note.activitiesPerformed}
        onChange={(activities) => setNote({
          ...note,
          activitiesPerformed: activities,
        })}
      />

      <ClientMoodSelector
        value={note.clientMood}
        onChange={(mood) => setNote({ ...note, clientMood: mood })}
      />

      <SignaturePad
        signerType="caregiver"
        onSave={(sig) => addSignature(sig)}
      />

      <button type="submit">Submit Note</button>
    </form>
  );
}
```

### API Routes to Create

Add to `/packages/app/src/routes.ts`:

```typescript
import { Router } from 'express';
import { VisitNoteRepository, NoteTemplateRepository } from '@care-commons/visit-notes';
import { requireAuth } from './middleware/auth';

const router = Router();

// Visit Notes
router.post('/api/visit-notes', requireAuth, createVisitNote);
router.get('/api/visit-notes/:id', requireAuth, getVisitNote);
router.patch('/api/visit-notes/:id', requireAuth, updateVisitNote);
router.post('/api/visit-notes/:id/signature', requireAuth, addSignature);
router.get('/api/visits/:visitId/notes', requireAuth, getVisitNotes);

// Templates
router.post('/api/visit-note-templates', requireAuth, createTemplate);
router.get('/api/visit-note-templates', requireAuth, searchTemplates);
router.get('/api/visit-note-templates/:id', requireAuth, getTemplate);
router.patch('/api/visit-note-templates/:id', requireAuth, updateTemplate);
```

### Testing Requirements

Create tests in `/verticals/visit-notes/src/__tests__/`:

1. **Repository Tests**
   - `repository/note-template-repository.test.ts`
   - `repository/visit-note-repository.test.ts`

2. **Validation Tests**
   - `validation/schemas.test.ts`

3. **Integration Tests**
   - Test immutability (cannot update after 24 hours)
   - Test signature capture flow
   - Test template application
   - Test offline sync workflow

## 📋 Deployment Checklist

### Before Deployment

1. ✅ Create database migrations
2. ✅ Implement backend types and repositories
3. ✅ Create seed data for templates
4. ⏳ Run migrations: `npm run db:migrate`
5. ⏳ Seed templates: `npx tsx packages/core/seeds/visit-note-templates.ts`
6. ⏳ Build backend: `npm run build`
7. ⏳ Run tests: `npm test`
8. ⏳ Install frontend dependencies (TipTap, signature-canvas)
9. ⏳ Implement frontend components
10. ⏳ Create API handlers
11. ⏳ Write comprehensive tests
12. ⏳ Test immutability after 24 hours
13. ⏳ Test signature capture on mobile
14. ⏳ Verify offline sync functionality

### Database Migration Commands

```bash
# Run all pending migrations
npm run db:migrate

# Check migration status
npm run db:migrate:status

# Rollback last migration (if needed)
npm run db:migrate:rollback

# Seed templates
cd packages/core
npx tsx seeds/visit-note-templates.ts
```

## 🎯 Key Features Summary

### Implemented ✅

1. **Rich Text Storage**
   - Plain text and HTML columns
   - TipTap editor integration ready
   - 50,000 character limit for plain text
   - 100,000 character limit for HTML

2. **Note Templates**
   - 6 pre-built templates (fall, medication, behavioral, etc.)
   - Placeholder replacement ({{client_name}}, {{date}}, etc.)
   - Structured prompts for guided input
   - Category-based organization
   - Usage analytics

3. **Digital Signatures**
   - Three signature types (caregiver, client, supervisor)
   - Base64 storage for immediate display
   - Permanent URL storage (S3 integration ready)
   - Signer relationship tracking
   - Device and IP audit trail

4. **Voice-to-Text**
   - Audio file URI storage
   - Transcription confidence tracking
   - Flagging for voice notes
   - S3 URL support

5. **Immutability & Compliance**
   - Auto-lock trigger after 24 hours
   - Update/delete validation
   - Comprehensive audit trail
   - Lock reason tracking

6. **Mobile Offline Support**
   - Sync pending flag
   - Queue management
   - Sync timestamp tracking

### Ready for Frontend Integration ⏳

1. TipTap WYSIWYG editor
2. Template selector dropdown
3. Voice-to-text recorder
4. Signature capture pad
5. Activity checkboxes
6. Client mood selector
7. Incident reporting form

## 📁 Files Created

### Database Migrations
- `/packages/core/migrations/20251115000001_create_visit_note_templates_table.ts`
- `/packages/core/migrations/20251115000002_add_signature_to_visit_notes.ts`

### Backend Vertical
- `/verticals/visit-notes/package.json`
- `/verticals/visit-notes/tsconfig.json`
- `/verticals/visit-notes/vitest.config.ts`
- `/verticals/visit-notes/README.md`
- `/verticals/visit-notes/src/types/index.ts`
- `/verticals/visit-notes/src/validation/index.ts`
- `/verticals/visit-notes/src/repository/note-template-repository.ts`
- `/verticals/visit-notes/src/repository/visit-note-repository.ts`
- `/verticals/visit-notes/src/index.ts`

### Seed Data
- `/packages/core/seeds/visit-note-templates.ts`

### Documentation
- `/home/user/care-commons/IMPLEMENTATION_VISIT_NOTES.md` (this file)

## 🚀 Next Actions

1. **Run migrations to create database tables**
2. **Seed common templates**
3. **Build and test backend**
4. **Install frontend dependencies (TipTap, react-signature-canvas)**
5. **Implement frontend components**
6. **Create API handler layer**
7. **Write comprehensive tests**
8. **Test on mobile devices**
9. **Deploy to staging**
10. **User acceptance testing**

---

**Implementation Date:** November 15, 2025
**Status:** Backend Complete ✅ | Frontend Pending ⏳
**Next Sprint:** Frontend Components & API Integration
