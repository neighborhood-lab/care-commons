# Task 0006: Mobile Visit Notes Entry

## Status
[ ] To Do

## Priority
Medium

## Description
After completing a visit, caregivers need to document what occurred (activities performed, client condition, any incidents). Visit notes are required for compliance and client care continuity.

## Acceptance Criteria
- [ ] Visit notes entry form accessible from active visit
- [ ] Pre-filled templates for common service types
- [ ] Free-text notes field
- [ ] Checkboxes for activities performed
- [ ] Client mood/condition selector
- [ ] Incident flag checkbox
- [ ] Saves to WatermelonDB immediately
- [ ] Syncs to backend when online
- [ ] Shows sync status
- [ ] Cannot modify after 24 hours (audit requirement)

## Technical Notes
- Create VisitNotesScreen component
- Store in visit_notes table (WatermelonDB)
- Sync to `/api/visits/:id/notes` endpoint
- Use offline-first approach
- Validate required fields based on service type
- Consider voice-to-text for easier input

## Related Tasks
- Related to: Task 0002 (check-in/out)
- Blocks: Compliance reporting
