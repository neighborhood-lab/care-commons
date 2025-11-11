# Task 0001: Global Search API Endpoint

## Status
[ ] To Do

## Priority
High

## Description
The GlobalSearch UI component exists and is fully functional, but it needs a backend `/api/search` endpoint to query across all entities (clients, caregivers, visits, care plans, etc.).

## Acceptance Criteria
- [ ] GET `/api/search` endpoint implemented
- [ ] Accepts query parameter `q` (search term)
- [ ] Accepts optional `types` filter (array of entity types)
- [ ] Accepts optional `limit` parameter (default 10)
- [ ] Returns results grouped by type
- [ ] Results include: type, id, title, subtitle, url, relevance score
- [ ] Search across clients, caregivers, visits, care plans
- [ ] Results ordered by relevance
- [ ] Response time < 200ms

## Technical Notes
- Use PostgreSQL full-text search with tsvector
- Add search_vector column to main tables if not exists
- Create GIN indexes for performance
- Return proper CORS headers
- Add rate limiting (max 30 requests/minute per user)

## Related Tasks
- Integrates with existing GlobalSearch.tsx component
- Enables keyboard-driven search (Cmd+K) workflow
