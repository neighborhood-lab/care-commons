/**
 * OpenAPI 3.0 Schema Definitions
 *
 * Reusable component schemas for Care Commons API documentation.
 * These schemas are referenced throughout the API documentation using $ref.
 *
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique user identifier
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *         firstName:
 *           type: string
 *           description: User first name
 *         lastName:
 *           type: string
 *           description: User last name
 *         roles:
 *           type: array
 *           items:
 *             type: string
 *             enum: [SUPER_ADMIN, ORG_ADMIN, BRANCH_ADMIN, COORDINATOR, SCHEDULER, CAREGIVER, FAMILY, CLIENT, BILLING, HR, AUDITOR, READ_ONLY]
 *           description: User roles for access control
 *         organizationId:
 *           type: string
 *           format: uuid
 *           description: Organization ID
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, SUSPENDED]
 *           description: User account status
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *
 *     Client:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique client identifier
 *         organizationId:
 *           type: string
 *           format: uuid
 *           description: Organization ID
 *         branchId:
 *           type: string
 *           format: uuid
 *           description: Branch ID
 *         clientNumber:
 *           type: string
 *           description: Human-readable client identifier
 *         firstName:
 *           type: string
 *           description: Client first name
 *         lastName:
 *           type: string
 *           description: Client last name
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           description: Client date of birth
 *         status:
 *           type: string
 *           enum: [DRAFT, ACTIVE, INACTIVE, SUSPENDED, ARCHIVED]
 *           description: Client status
 *         primaryPhone:
 *           $ref: '#/components/schemas/Phone'
 *         email:
 *           type: string
 *           format: email
 *           description: Client email address
 *         primaryAddress:
 *           $ref: '#/components/schemas/Address'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Caregiver:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         organizationId:
 *           type: string
 *           format: uuid
 *         employeeNumber:
 *           type: string
 *           description: Human-readable employee identifier
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           $ref: '#/components/schemas/Phone'
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, ON_LEAVE, TERMINATED]
 *         hireDate:
 *           type: string
 *           format: date
 *         certifications:
 *           type: array
 *           items:
 *             type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Visit:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         clientId:
 *           type: string
 *           format: uuid
 *           description: Client receiving care
 *         caregiverId:
 *           type: string
 *           format: uuid
 *           description: Caregiver providing care
 *         scheduledStart:
 *           type: string
 *           format: date-time
 *           description: Scheduled start time
 *         scheduledEnd:
 *           type: string
 *           format: date-time
 *           description: Scheduled end time
 *         actualStart:
 *           type: string
 *           format: date-time
 *           description: Actual start time (EVV check-in)
 *         actualEnd:
 *           type: string
 *           format: date-time
 *           description: Actual end time (EVV check-out)
 *         status:
 *           type: string
 *           enum: [SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW]
 *           description: Visit status
 *         serviceType:
 *           type: string
 *           description: Type of care service provided
 *         notes:
 *           type: string
 *           description: Visit notes
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CarePlan:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         clientId:
 *           type: string
 *           format: uuid
 *           description: Client for this care plan
 *         title:
 *           type: string
 *           description: Care plan title
 *         effectiveDate:
 *           type: string
 *           format: date
 *           description: When this plan becomes effective
 *         expirationDate:
 *           type: string
 *           format: date
 *           description: When this plan expires
 *         status:
 *           type: string
 *           enum: [DRAFT, ACTIVE, EXPIRED, CANCELLED]
 *         goals:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               description:
 *                 type: string
 *               targetDate:
 *                 type: string
 *                 format: date
 *         tasks:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               description:
 *                 type: string
 *               frequency:
 *                 type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Address:
 *       type: object
 *       properties:
 *         street:
 *           type: string
 *           description: Street address
 *         street2:
 *           type: string
 *           description: Apartment, suite, etc.
 *         city:
 *           type: string
 *           description: City name
 *         state:
 *           type: string
 *           description: State code (e.g., TX, FL)
 *           pattern: '^[A-Z]{2}$'
 *         zip:
 *           type: string
 *           description: ZIP code
 *           pattern: '^\\d{5}(-\\d{4})?$'
 *         county:
 *           type: string
 *           description: County name
 *         coordinates:
 *           type: object
 *           properties:
 *             latitude:
 *               type: number
 *               format: double
 *             longitude:
 *               type: number
 *               format: double
 *
 *     Phone:
 *       type: object
 *       properties:
 *         number:
 *           type: string
 *           description: Phone number
 *           pattern: '^\\+?[1-9]\\d{1,14}$'
 *         type:
 *           type: string
 *           enum: [MOBILE, HOME, WORK, FAX]
 *           description: Phone type
 *         isPrimary:
 *           type: boolean
 *           description: Whether this is the primary phone
 *
 *     PaginatedResponse:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             type: object
 *           description: Array of items for current page
 *         total:
 *           type: integer
 *           description: Total number of items across all pages
 *         page:
 *           type: integer
 *           description: Current page number (1-indexed)
 *         limit:
 *           type: integer
 *           description: Number of items per page
 *         totalPages:
 *           type: integer
 *           description: Total number of pages
 *
 *     Error:
 *       type: object
 *       required:
 *         - error
 *         - message
 *       properties:
 *         error:
 *           type: string
 *           description: Error code
 *           example: VALIDATION_ERROR
 *         message:
 *           type: string
 *           description: Human-readable error message
 *           example: Invalid input data
 *         details:
 *           type: object
 *           description: Additional error context
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: When the error occurred
 *
 *     HealthCheck:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [healthy, unhealthy]
 *           description: Overall system health status
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Health check timestamp
 *         environment:
 *           type: string
 *           description: Deployment environment
 *         uptime:
 *           type: number
 *           description: Server uptime in seconds
 *         responseTime:
 *           type: number
 *           description: Response time in milliseconds
 *         database:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               enum: [connected, disconnected]
 *             responseTime:
 *               type: number
 *         memory:
 *           type: object
 *           properties:
 *             used:
 *               type: number
 *               description: Used memory in MB
 *             total:
 *               type: number
 *               description: Total memory in MB
 */

// This file contains only OpenAPI schema definitions in JSDoc comments
// The schemas are parsed by swagger-jsdoc and included in the OpenAPI spec
export {};
