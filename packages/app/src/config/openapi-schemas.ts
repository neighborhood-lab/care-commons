/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: User unique identifier
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
 *         role:
 *           type: string
 *           enum: [admin, coordinator, caregiver, family]
 *           description: User role in the system
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: User creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: User last update timestamp
 *
 *     Client:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Client unique identifier
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
 *           enum: [active, inactive, discharged]
 *           description: Client status
 *         primaryAddress:
 *           $ref: '#/components/schemas/Address'
 *         phoneNumber:
 *           type: string
 *           description: Client phone number
 *         email:
 *           type: string
 *           format: email
 *           description: Client email address
 *         emergencyContact:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             phone:
 *               type: string
 *             relationship:
 *               type: string
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
 *           description: Caregiver unique identifier
 *         userId:
 *           type: string
 *           format: uuid
 *           description: Associated user ID
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         status:
 *           type: string
 *           enum: [active, inactive, on_leave]
 *         certifications:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               number:
 *                 type: string
 *               expiryDate:
 *                 type: string
 *                 format: date
 *         phoneNumber:
 *           type: string
 *         email:
 *           type: string
 *           format: email
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
 *           description: Visit unique identifier
 *         clientId:
 *           type: string
 *           format: uuid
 *           description: Associated client ID
 *         caregiverId:
 *           type: string
 *           format: uuid
 *           description: Associated caregiver ID
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
 *           description: Actual start time (EVV)
 *         actualEnd:
 *           type: string
 *           format: date-time
 *           description: Actual end time (EVV)
 *         status:
 *           type: string
 *           enum: [scheduled, in_progress, completed, cancelled, missed]
 *           description: Visit status
 *         location:
 *           $ref: '#/components/schemas/Location'
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
 *           description: Care plan unique identifier
 *         clientId:
 *           type: string
 *           format: uuid
 *           description: Associated client ID
 *         title:
 *           type: string
 *           description: Care plan title
 *         description:
 *           type: string
 *           description: Care plan description
 *         startDate:
 *           type: string
 *           format: date
 *           description: Care plan start date
 *         endDate:
 *           type: string
 *           format: date
 *           description: Care plan end date
 *         status:
 *           type: string
 *           enum: [active, completed, cancelled]
 *           description: Care plan status
 *         tasks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Task'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Task:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Task unique identifier
 *         carePlanId:
 *           type: string
 *           format: uuid
 *           description: Associated care plan ID
 *         title:
 *           type: string
 *           description: Task title
 *         description:
 *           type: string
 *           description: Task description
 *         frequency:
 *           type: string
 *           enum: [daily, weekly, monthly, as_needed]
 *           description: Task frequency
 *         status:
 *           type: string
 *           enum: [pending, in_progress, completed]
 *           description: Task status
 *         dueDate:
 *           type: string
 *           format: date-time
 *           description: Task due date
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
 *           description: State code (e.g., TX, CA)
 *         zip:
 *           type: string
 *           description: ZIP code
 *         country:
 *           type: string
 *           default: US
 *           description: Country code
 *
 *     Location:
 *       type: object
 *       properties:
 *         latitude:
 *           type: number
 *           format: double
 *           description: GPS latitude
 *         longitude:
 *           type: number
 *           format: double
 *           description: GPS longitude
 *         accuracy:
 *           type: number
 *           description: Location accuracy in meters
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Location capture timestamp
 *
 *     PaginationParams:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           description: Page number
 *         limit:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *           description: Items per page
 *
 *     PaginatedResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             type: object
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *             limit:
 *               type: integer
 *             total:
 *               type: integer
 *             totalPages:
 *               type: integer
 *
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error type
 *         message:
 *           type: string
 *           description: Error message
 *         details:
 *           type: object
 *           description: Additional error details
 *         statusCode:
 *           type: integer
 *           description: HTTP status code
 */

export {};
