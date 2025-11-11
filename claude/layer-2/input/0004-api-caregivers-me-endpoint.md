# Task 0004: Caregiver Profile API Endpoint

## Status
[ ] To Do

## Priority
High

## Description
The mobile ProfileScreen is integrated but needs the `/api/caregivers/me` endpoint to fetch authenticated caregiver profile data including certifications, languages, and contact info.

## Acceptance Criteria
- [ ] GET `/api/caregivers/me` endpoint implemented
- [ ] Returns authenticated caregiver profile
- [ ] Includes: id, firstName, lastName, email, phone
- [ ] Includes certifications array with status and expiration
- [ ] Includes languages array
- [ ] Includes employment details
- [ ] Requires authentication (JWT)
- [ ] Returns 401 if not authenticated
- [ ] Response time < 100ms

## Technical Notes
- Use existing caregiver repository
- Join with certifications table
- Filter by req.user.id (from JWT)
- Add proper error handling
- Consider caching with short TTL (5 minutes)

## Related Tasks
- Integrates with: ProfileScreen.tsx (mobile)
- Depends on: Authentication middleware
