# Task 0012: API Documentation with OpenAPI

## Status
[ ] To Do

## Priority
Medium

## Description
Generate comprehensive API documentation using OpenAPI/Swagger spec. Essential for external integrations, mobile team coordination, and future API consumers.

## Acceptance Criteria
- [ ] OpenAPI 3.0 spec file generated
- [ ] All endpoints documented with request/response schemas
- [ ] Authentication flow documented
- [ ] Example requests and responses
- [ ] Error codes documented
- [ ] Swagger UI hosted at `/api/docs`
- [ ] Auto-generated from JSDoc comments where possible
- [ ] Rate limit documentation
- [ ] Versioning strategy documented
- [ ] Postman collection exported

## Technical Notes
- Use swagger-jsdoc for generation from code
- Use swagger-ui-express for hosting
- Document all /api/* endpoints
- Include authentication (JWT bearer token)
- Add try-it-out functionality
- Export Postman collection via script

## Related Tasks
- Documents: All API endpoints
- Enables: External integrations
