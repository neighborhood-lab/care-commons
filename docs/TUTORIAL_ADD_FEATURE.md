# Tutorial: Adding a New Feature to Folk

> **Audience:** Developers new to Folk who want to add a feature  
> **Time:** 30-60 minutes  
> **Difficulty:** Intermediate  
> **Last Updated:** November 27, 2025

## Overview

This tutorial walks you through adding a complete feature to Folk, from database schema to frontend UI. We'll implement a simple **"Notes"** feature that allows coordinators to add notes to client records.

**What you'll learn:**
- How verticals are structured
- Database migrations
- Repository pattern
- API routes
- Frontend components
- Testing strategy

## Prerequisites

Before starting, ensure you have:
- ✅ Completed [DEV_SETUP.md](../DEV_SETUP.md)
- ✅ Local development environment running (`npm run dev`)
- ✅ Database seeded with demo data (`npm run db:reset:demo`)
- ✅ Basic TypeScript and React knowledge

## Step 1: Plan the Feature

**Feature:** Client Notes  
**Requirements:**
- Coordinators can add notes to client records
- Notes have: title, content, created_by, created_at
- Notes are displayed on the client detail page
- Notes are scoped to the client's organization

**Design Decisions:**
- **Vertical:** `client-demographics` (notes are part of client data)
- **Database:** New `client_notes` table
- **API:** CRUD endpoints under `/api/clients/:id/notes`
- **UI:** Notes section on client detail page

## Step 2: Create Database Migration

Create a new migration file in `verticals/client-demographics/migrations/`:

```bash
# Create migration file
cat > verticals/client-demographics/migrations/003_add_client_notes.sql << 'EOF'
-- Migration: Add client notes feature
-- Created: 2025-11-27

CREATE TABLE IF NOT EXISTS client_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_client_notes_organization 
    FOREIGN KEY (organization_id) 
    REFERENCES organizations(id) 
    ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_client_notes_client ON client_notes(client_id);
CREATE INDEX idx_client_notes_org ON client_notes(organization_id);
CREATE INDEX idx_client_notes_created_at ON client_notes(created_at DESC);

-- Audit trail
CREATE TABLE IF NOT EXISTS client_notes_audit (
  audit_id SERIAL PRIMARY KEY,
  id UUID NOT NULL,
  version INTEGER NOT NULL,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL,
  operation TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB
);

-- Trigger for audit trail
CREATE OR REPLACE FUNCTION client_notes_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO client_notes_audit (id, version, changed_by, changed_at, operation, new_values)
    VALUES (NEW.id, 1, NEW.created_by, NOW(), 'INSERT', row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO client_notes_audit (id, version, changed_by, changed_at, operation, old_values, new_values)
    VALUES (NEW.id, (SELECT COALESCE(MAX(version), 0) + 1 FROM client_notes_audit WHERE id = NEW.id), 
            NEW.created_by, NOW(), 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO client_notes_audit (id, version, changed_by, changed_at, operation, old_values)
    VALUES (OLD.id, (SELECT COALESCE(MAX(version), 0) + 1 FROM client_notes_audit WHERE id = OLD.id), 
            OLD.created_by, NOW(), 'DELETE', row_to_json(OLD)::jsonb);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER client_notes_audit
  AFTER INSERT OR UPDATE OR DELETE ON client_notes
  FOR EACH ROW EXECUTE FUNCTION client_notes_audit_trigger();

COMMENT ON TABLE client_notes IS 'Coordinator notes attached to client records';
COMMENT ON COLUMN client_notes.content IS 'Free-form text content (not PHI - for operational notes)';
EOF
```

**Apply the migration:**

```bash
# Run migration
npm run db:migrate

# Verify
psql $DATABASE_URL -c "\d client_notes"
```

## Step 3: Define TypeScript Types

Add types to `verticals/client-demographics/src/types.ts`:

```typescript
// Add to existing file
export interface ClientNote {
  id: string;
  clientId: string;
  organizationId: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClientNoteInput {
  clientId: string;
  title: string;
  content: string;
}

export interface UpdateClientNoteInput {
  title?: string;
  content?: string;
}
```

## Step 4: Add Validation Schemas

Add Zod schemas for runtime validation:

```typescript
// verticals/client-demographics/src/validation.ts
import { z } from 'zod';

export const createClientNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  content: z.string().min(1, 'Content is required').max(10000, 'Content too long'),
});

export const updateClientNoteSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).max(10000).optional(),
}).refine(data => data.title || data.content, {
  message: 'At least one field must be provided',
});
```

## Step 5: Implement Repository

Add methods to `verticals/client-demographics/src/repository.ts`:

```typescript
export class ClientDemographicsRepository {
  // ... existing methods

  async createClientNote(
    clientId: string,
    organizationId: string,
    userId: string,
    data: CreateClientNoteInput
  ): Promise<ClientNote> {
    const result = await this.db.query<ClientNote>(
      `INSERT INTO client_notes (client_id, organization_id, title, content, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [clientId, organizationId, data.title, data.content, userId]
    );
    return this.mapClientNote(result.rows[0]);
  }

  async getClientNotes(
    clientId: string,
    organizationId: string
  ): Promise<ClientNote[]> {
    const result = await this.db.query<ClientNote>(
      `SELECT * FROM client_notes
       WHERE client_id = $1 AND organization_id = $2
       ORDER BY created_at DESC`,
      [clientId, organizationId]
    );
    return result.rows.map(row => this.mapClientNote(row));
  }

  async updateClientNote(
    noteId: string,
    organizationId: string,
    data: UpdateClientNoteInput
  ): Promise<ClientNote | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(data.title);
    }
    if (data.content !== undefined) {
      updates.push(`content = $${paramIndex++}`);
      values.push(data.content);
    }

    if (updates.length === 0) return null;

    updates.push(`updated_at = NOW()`);
    values.push(noteId, organizationId);

    const result = await this.db.query<ClientNote>(
      `UPDATE client_notes
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND organization_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    return result.rows[0] ? this.mapClientNote(result.rows[0]) : null;
  }

  async deleteClientNote(
    noteId: string,
    organizationId: string
  ): Promise<boolean> {
    const result = await this.db.query(
      `DELETE FROM client_notes
       WHERE id = $1 AND organization_id = $2`,
      [noteId, organizationId]
    );
    return result.rowCount > 0;
  }

  private mapClientNote(row: any): ClientNote {
    return {
      id: row.id,
      clientId: row.client_id,
      organizationId: row.organization_id,
      title: row.title,
      content: row.content,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
```

## Step 6: Add API Routes

Add routes to `verticals/client-demographics/src/routes.ts`:

```typescript
import { Router } from 'express';
import { authMiddleware } from '@folkcare/app/middleware/auth';
import { permissionMiddleware } from '@folkcare/app/middleware/permissions';

export function createClientNotesRoutes(repository: ClientDemographicsRepository): Router {
  const router = Router();

  // Get all notes for a client
  router.get(
    '/clients/:clientId/notes',
    authMiddleware,
    permissionMiddleware('client', 'read'),
    async (req, res) => {
      try {
        const { clientId } = req.params;
        const { organizationId } = req.user;

        const notes = await repository.getClientNotes(clientId, organizationId);
        res.json(notes);
      } catch (error) {
        console.error('Error fetching client notes:', error);
        res.status(500).json({ error: 'Failed to fetch notes' });
      }
    }
  );

  // Create a new note
  router.post(
    '/clients/:clientId/notes',
    authMiddleware,
    permissionMiddleware('client', 'update'),
    async (req, res) => {
      try {
        const { clientId } = req.params;
        const { organizationId, userId } = req.user;

        // Validate input
        const validatedData = createClientNoteSchema.parse(req.body);

        const note = await repository.createClientNote(
          clientId,
          organizationId,
          userId,
          validatedData
        );

        res.status(201).json(note);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        console.error('Error creating client note:', error);
        res.status(500).json({ error: 'Failed to create note' });
      }
    }
  );

  // Update a note
  router.patch(
    '/clients/:clientId/notes/:noteId',
    authMiddleware,
    permissionMiddleware('client', 'update'),
    async (req, res) => {
      try {
        const { noteId } = req.params;
        const { organizationId } = req.user;

        const validatedData = updateClientNoteSchema.parse(req.body);

        const note = await repository.updateClientNote(noteId, organizationId, validatedData);

        if (!note) {
          return res.status(404).json({ error: 'Note not found' });
        }

        res.json(note);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        console.error('Error updating client note:', error);
        res.status(500).json({ error: 'Failed to update note' });
      }
    }
  );

  // Delete a note
  router.delete(
    '/clients/:clientId/notes/:noteId',
    authMiddleware,
    permissionMiddleware('client', 'delete'),
    async (req, res) => {
      try {
        const { noteId } = req.params;
        const { organizationId } = req.user;

        const deleted = await repository.deleteClientNote(noteId, organizationId);

        if (!deleted) {
          return res.status(404).json({ error: 'Note not found' });
        }

        res.status(204).send();
      } catch (error) {
        console.error('Error deleting client note:', error);
        res.status(500).json({ error: 'Failed to delete note' });
      }
    }
  );

  return router;
}
```

## Step 7: Register Routes

Update `packages/app/src/server.ts` to include the new routes:

```typescript
import { createClientNotesRoutes } from '@folkcare/client-demographics/routes';

// In the server setup
app.use('/api', createClientNotesRoutes(clientDemographicsRepository));
```

## Step 8: Write Tests

Create `verticals/client-demographics/src/__tests__/client-notes.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ClientDemographicsRepository } from '../repository';
import { createTestDb } from '@folkcare/core/test-utils';

describe('Client Notes', () => {
  let repository: ClientDemographicsRepository;
  let db: any;

  beforeEach(async () => {
    db = await createTestDb();
    repository = new ClientDemographicsRepository(db);
  });

  it('should create a client note', async () => {
    const note = await repository.createClientNote(
      'client-123',
      'org-456',
      'user-789',
      {
        title: 'Follow-up needed',
        content: 'Client requested extra visit on Friday',
      }
    );

    expect(note.id).toBeDefined();
    expect(note.title).toBe('Follow-up needed');
    expect(note.content).toBe('Client requested extra visit on Friday');
    expect(note.createdBy).toBe('user-789');
  });

  it('should list notes for a client', async () => {
    await repository.createClientNote('client-123', 'org-456', 'user-789', {
      title: 'Note 1',
      content: 'Content 1',
    });
    await repository.createClientNote('client-123', 'org-456', 'user-789', {
      title: 'Note 2',
      content: 'Content 2',
    });

    const notes = await repository.getClientNotes('client-123', 'org-456');

    expect(notes).toHaveLength(2);
    expect(notes[0].title).toBe('Note 2'); // Most recent first
    expect(notes[1].title).toBe('Note 1');
  });

  it('should update a note', async () => {
    const note = await repository.createClientNote('client-123', 'org-456', 'user-789', {
      title: 'Original',
      content: 'Original content',
    });

    const updated = await repository.updateClientNote(note.id, 'org-456', {
      title: 'Updated',
    });

    expect(updated?.title).toBe('Updated');
    expect(updated?.content).toBe('Original content'); // Unchanged
  });

  it('should delete a note', async () => {
    const note = await repository.createClientNote('client-123', 'org-456', 'user-789', {
      title: 'To delete',
      content: 'This will be deleted',
    });

    const deleted = await repository.deleteClientNote(note.id, 'org-456');
    expect(deleted).toBe(true);

    const notes = await repository.getClientNotes('client-123', 'org-456');
    expect(notes).toHaveLength(0);
  });

  it('should enforce organization scoping', async () => {
    const note = await repository.createClientNote('client-123', 'org-456', 'user-789', {
      title: 'Scoped note',
      content: 'Only org-456 can access',
    });

    // Attempt to access from different org
    const notes = await repository.getClientNotes('client-123', 'org-999');
    expect(notes).toHaveLength(0);
  });
});
```

**Run tests:**

```bash
npm run test -- client-notes.test.ts
```

## Step 9: Create Frontend Component

Create `packages/web/src/components/ClientNotes.tsx`:

```tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

interface ClientNotesProps {
  clientId: string;
}

export function ClientNotes({ clientId }: ClientNotesProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const queryClient = useQueryClient();

  const { data: notes, isLoading } = useQuery({
    queryKey: ['client-notes', clientId],
    queryFn: () => api.get(`/api/clients/${clientId}/notes`),
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; content: string }) =>
      api.post(`/api/clients/${clientId}/notes`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['client-notes', clientId]);
      setTitle('');
      setContent('');
      setIsAdding(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ title, content });
  };

  if (isLoading) return <div>Loading notes...</div>;

  return (
    <div className="client-notes">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Notes</h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="btn btn-primary"
        >
          {isAdding ? 'Cancel' : 'Add Note'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 border rounded">
          <div className="mb-2">
            <label className="block mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div className="mb-2">
            <label className="block mb-1">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows={4}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Save Note
          </button>
        </form>
      )}

      <div className="space-y-2">
        {notes?.length === 0 && <p className="text-gray-500">No notes yet</p>}
        {notes?.map((note: any) => (
          <div key={note.id} className="p-4 border rounded">
            <h4 className="font-semibold">{note.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{note.content}</p>
            <p className="text-xs text-gray-400 mt-2">
              {new Date(note.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Step 10: Add to Client Detail Page

Update the client detail page to include notes:

```tsx
// packages/web/src/pages/ClientDetail.tsx
import { ClientNotes } from '../components/ClientNotes';

export function ClientDetail() {
  const { clientId } = useParams();

  return (
    <div>
      {/* ... existing client details */}
      
      <div className="mt-8">
        <ClientNotes clientId={clientId} />
      </div>
    </div>
  );
}
```

## Step 11: Test the Feature End-to-End

**Manual Testing:**

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to a client detail page:**
   ```
   http://localhost:5173/clients/[client-id]
   ```

3. **Add a note:**
   - Click "Add Note"
   - Enter title and content
   - Click "Save Note"

4. **Verify:**
   - Note appears in the list
   - Database record created: `SELECT * FROM client_notes;`
   - Audit trail created: `SELECT * FROM client_notes_audit;`

**Automated Testing:**

```bash
# Run all checks
./scripts/check.sh

# Run specific test
npm test -- client-notes.test.ts
```

## Step 12: Commit Your Changes

```bash
# Stage all changes
git add -A

# Commit (pre-commit hooks will run automatically)
git commit -m "feat: add client notes feature

- Add client_notes table with audit trail
- Implement CRUD API endpoints
- Add ClientNotes React component
- Add comprehensive tests
- Update client detail page"

# Push (creates branch if needed)
git push origin feature/client-notes
```

## Step 13: Create Pull Request

1. Go to GitHub repository
2. Click "Compare & pull request"
3. Fill in PR description:

```markdown
## Summary
Adds ability for coordinators to create notes on client records.

## Changes
- Database migration for `client_notes` table
- Repository methods for CRUD operations
- API routes with permission checks
- React component with form and list view
- Comprehensive test coverage

## Testing
- [x] Unit tests pass
- [x] Integration tests pass
- [x] Manual testing completed
- [x] Pre-commit hooks pass

## Screenshots
[Add screenshot of notes UI]
```

4. Wait for CI checks to pass
5. Request review from maintainers

## Congratulations! 🎉

You've successfully added a complete feature to Folk!

## Next Steps

### Enhancements You Could Add

1. **Rich Text Editor**: Replace textarea with a WYSIWYG editor
2. **Note Categories**: Add tags or categories to notes
3. **Edit/Delete**: Add buttons to edit/delete existing notes
4. **Permissions**: Restrict who can delete notes (admins only?)
5. **Attachments**: Allow file uploads attached to notes
6. **Search**: Add search/filter functionality for notes

### Other Features to Explore

- **Medications**: Track client medications and schedules
- **Allergies**: Document client allergies and reactions
- **Emergency Contacts**: Expand emergency contact management
- **Documents**: Upload and manage client documents

## Key Takeaways

**Vertical Architecture:**
- Each vertical owns its database schema
- Repository pattern separates data access from business logic
- Clean separation of concerns

**Security:**
- Always check permissions (`permissionMiddleware`)
- Always scope by organization (`organization_id`)
- Validate all inputs (Zod schemas)
- Audit trail for compliance

**Testing:**
- Test at multiple levels (unit, integration, E2E)
- Mock external dependencies
- Test edge cases and error conditions

**Code Quality:**
- Pre-commit hooks enforce quality standards
- CI pipeline validates all changes
- TypeScript provides type safety
- ESLint catches common mistakes

## Resources

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture overview
- [DEV_WORKFLOW.md](../DEV_WORKFLOW.md) - Development workflow
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API reference

## Questions?

- **Discord**: https://discord.gg/EkeXQZFq
- **GitHub Issues**: Tag with `question` label
- **Documentation**: Check [docs/](./README.md) directory

Happy coding! 🚀
