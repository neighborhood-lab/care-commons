# Task 0013: Coordinator Onboarding Flow

## Status
[ ] To Do

## Priority
Low

## Description
Create an interactive onboarding flow for new coordinators to learn the platform. Reduces training time and support burden.

## Acceptance Criteria
- [ ] Welcome modal on first login
- [ ] Interactive tour of main features (clients, scheduling, reports)
- [ ] Tooltips for key actions
- [ ] "Getting Started" checklist (add client, schedule visit, etc.)
- [ ] Video tutorials embedded (optional)
- [ ] Can skip and restart tour from help menu
- [ ] Progress saved per user
- [ ] Mobile-responsive
- [ ] Completion tracking (analytics)

## Technical Notes
- Use react-joyride or similar tour library
- Store tour completion state in user preferences
- Add help icon to top nav for tour restart
- Keep tour content in markdown for easy updates
- Consider branching tours for different roles

## Related Tasks
- Improves: User onboarding experience
- Reduces: Support tickets
