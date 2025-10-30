"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const care_plan_service_1 = require("../care-plan-service");
const care_plan_validator_1 = require("../../validation/care-plan-validator");
const core_1 = require("@care-commons/core");
const vitest_1 = require("vitest");
let uuidCounter = 0;
vitest_1.vi.mock('uuid', () => ({
    v4: vitest_1.vi.fn(() => {
        const counter = (uuidCounter++).toString().padStart(12, '0');
        return `00000000-0000-4000-8000-${counter}`;
    }),
}));
const { v4: uuid } = require('uuid');
vitest_1.vi.mock('../../repository/care-plan-repository');
vitest_1.vi.mock('@care-commons/core', () => ({
    PermissionService: vitest_1.vi.fn(),
    UserContext: vitest_1.vi.fn(),
    PaginationParams: vitest_1.vi.fn(),
    PaginatedResult: vitest_1.vi.fn(),
    UUID: vitest_1.vi.fn(),
    Timestamp: vitest_1.vi.fn(),
    ValidationError: class extends Error {
        constructor(message, details) {
            super(message);
            this.name = 'ValidationError';
        }
    },
    PermissionError: class extends Error {
        constructor(message) {
            super(message);
            this.name = 'PermissionError';
        }
    },
    NotFoundError: class extends Error {
        constructor(message, details) {
            super(message);
            this.name = 'NotFoundError';
        }
    }
}));
vitest_1.vi.mock('../../validation/care-plan-validator');
(0, vitest_1.describe)('CarePlanService', () => {
    let service;
    let mockRepository;
    let mockPermissions;
    let mockValidator;
    let mockContext;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        uuidCounter = 0;
        mockRepository = {
            createCarePlan: vitest_1.vi.fn(),
            getCarePlanById: vitest_1.vi.fn(),
            updateCarePlan: vitest_1.vi.fn(),
            searchCarePlans: vitest_1.vi.fn(),
            getCarePlansByClientId: vitest_1.vi.fn(),
            getActiveCarePlanForClient: vitest_1.vi.fn(),
            getExpiringCarePlans: vitest_1.vi.fn(),
            deleteCarePlan: vitest_1.vi.fn(),
            createTaskInstance: vitest_1.vi.fn(),
            getTaskInstanceById: vitest_1.vi.fn(),
            updateTaskInstance: vitest_1.vi.fn(),
            searchTaskInstances: vitest_1.vi.fn(),
            getTasksByVisitId: vitest_1.vi.fn(),
            createProgressNote: vitest_1.vi.fn(),
            getProgressNotesByCarePlanId: vitest_1.vi.fn(),
        };
        mockPermissions = {
            hasPermission: vitest_1.vi.fn().mockReturnValue(true),
        };
        mockValidator = care_plan_validator_1.CarePlanValidator;
        mockValidator.validateCreateCarePlan = vitest_1.vi.fn((input) => input);
        mockValidator.validateUpdateCarePlan = vitest_1.vi.fn((input) => input);
        mockValidator.validateCreateTaskInstance = vitest_1.vi.fn((input) => input);
        mockValidator.validateCompleteTask = vitest_1.vi.fn((input) => input);
        mockValidator.validateCreateProgressNote = vitest_1.vi.fn((input) => input);
        mockValidator.validateCarePlanSearchFilters = vitest_1.vi.fn((input) => input);
        mockValidator.validateTaskInstanceSearchFilters = vitest_1.vi.fn((input) => input);
        mockValidator.validateTaskCompletion = vitest_1.vi.fn(() => ({ valid: true, errors: [] }));
        mockValidator.validateVitalSigns = vitest_1.vi.fn(() => ({ valid: true, warnings: [] }));
        mockValidator.validateCarePlanActivation = vitest_1.vi.fn(() => ({ valid: true, errors: [] }));
        service = new care_plan_service_1.CarePlanService(mockRepository, mockPermissions);
        mockContext = {
            userId: uuid(),
            organizationId: uuid(),
            roles: ['COORDINATOR'],
            permissions: ['care-plans:create', 'care-plans:read', 'care-plans:update', 'tasks:create', 'tasks:complete'],
            branchIds: [uuid()],
        };
    });
    (0, vitest_1.describe)('createCarePlan', () => {
        let validInput;
        (0, vitest_1.beforeEach)(() => {
            validInput = {
                clientId: uuid(),
                organizationId: mockContext.organizationId,
                name: 'Test Care Plan',
                planType: 'PERSONAL_CARE',
                effectiveDate: new Date(),
                goals: [
                    {
                        name: 'Improve Mobility',
                        description: 'Client will be able to walk 10 steps with assistance',
                        category: 'MOBILITY',
                        status: 'NOT_STARTED',
                        priority: 'HIGH',
                    }
                ],
                interventions: [
                    {
                        name: 'Ambulation Assistance',
                        description: 'Provide assistance with walking',
                        category: 'AMBULATION_ASSISTANCE',
                        goalIds: [],
                        frequency: { pattern: 'DAILY' },
                        instructions: 'Assist client with walking exercises',
                        performedBy: ['CAREGIVER'],
                        requiresDocumentation: true,
                        status: 'ACTIVE',
                        startDate: new Date(),
                    }
                ],
            };
        });
        (0, vitest_1.it)('should create a care plan with valid input', async () => {
            mockPermissions.hasPermission.mockReturnValue(true);
            const expectedCarePlan = {
                id: 'care-plan-1',
                planNumber: 'CP-001',
                name: 'Personal Care Plan',
                clientId: 'client-1',
                organizationId: 'org-1',
                branchId: 'branch-1',
                planType: 'PERSONAL_CARE',
                status: 'DRAFT',
                priority: 'MEDIUM',
                effectiveDate: new Date('2024-01-01'),
                goals: [],
                interventions: [],
                taskTemplates: [],
                complianceStatus: 'COMPLIANT',
                createdAt: new Date('2024-01-01'),
                createdBy: 'user-1',
                updatedAt: new Date('2024-01-01'),
                updatedBy: 'user-1',
                version: 1,
                deletedAt: null,
                deletedBy: null
            };
            mockRepository.createCarePlan.mockResolvedValue(expectedCarePlan);
            const result = await service.createCarePlan(validInput, mockContext);
            (0, vitest_1.expect)(mockPermissions.hasPermission).toHaveBeenCalledWith(mockContext, 'care-plans:create');
            (0, vitest_1.expect)(mockRepository.createCarePlan).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                ...validInput,
                planNumber: vitest_1.expect.any(String),
                createdBy: mockContext.userId,
            }));
            (0, vitest_1.expect)(result).toEqual(expectedCarePlan);
        });
        (0, vitest_1.it)('should throw error without create permission', async () => {
            mockPermissions.hasPermission.mockReturnValue(false);
            await (0, vitest_1.expect)(service.createCarePlan(validInput, mockContext))
                .rejects.toThrow(core_1.PermissionError);
            (0, vitest_1.expect)(mockRepository.createCarePlan).not.toHaveBeenCalled();
            (0, vitest_1.expect)(mockPermissions.hasPermission).toHaveBeenCalledWith(mockContext, 'care-plans:create');
            mockPermissions.hasPermission.mockReturnValue(true);
        });
    });
    (0, vitest_1.describe)('getCarePlanById', () => {
        (0, vitest_1.it)('should return care plan when found and accessible', async () => {
            const carePlanId = uuid();
            const mockCarePlan = {
                id: carePlanId,
                planNumber: 'CP-001',
                name: 'Personal Care Plan',
                clientId: 'client-1',
                organizationId: mockContext.organizationId,
                planType: 'PERSONAL_CARE',
                status: 'ACTIVE',
                priority: 'MEDIUM',
                effectiveDate: new Date('2024-01-01'),
                goals: [],
                interventions: [],
                taskTemplates: [],
                complianceStatus: 'COMPLIANT',
                createdAt: new Date('2024-01-01'),
                createdBy: mockContext.userId,
                updatedAt: new Date('2024-01-01'),
                updatedBy: mockContext.userId,
                version: 1,
                deletedAt: null,
                deletedBy: null
            };
            mockPermissions.hasPermission.mockReturnValue(true);
            mockRepository.getCarePlanById.mockResolvedValue(mockCarePlan);
            const result = await service.getCarePlanById(carePlanId, mockContext);
            (0, vitest_1.expect)(mockPermissions.hasPermission).toHaveBeenCalledWith(mockContext, 'care-plans:read');
            (0, vitest_1.expect)(mockRepository.getCarePlanById).toHaveBeenCalledWith(carePlanId);
            (0, vitest_1.expect)(result).toEqual(mockCarePlan);
        });
        (0, vitest_1.it)('should throw error when care plan not found', async () => {
            const carePlanId = uuid();
            mockPermissions.hasPermission.mockReturnValue(true);
            mockRepository.getCarePlanById.mockResolvedValue(null);
            await (0, vitest_1.expect)(service.getCarePlanById(carePlanId, mockContext))
                .rejects.toThrow(core_1.NotFoundError);
        });
        (0, vitest_1.it)('should throw error when accessing care plan from different organization', async () => {
            const carePlanId = uuid();
            const otherOrgCarePlan = {
                id: carePlanId,
                planNumber: 'CP-001',
                name: 'Personal Care Plan',
                clientId: 'client-1',
                organizationId: uuid(),
                planType: 'PERSONAL_CARE',
                status: 'ACTIVE',
                priority: 'MEDIUM',
                effectiveDate: new Date('2024-01-01'),
                goals: [],
                interventions: [],
                taskTemplates: [],
                complianceStatus: 'COMPLIANT',
                createdAt: new Date('2024-01-01'),
                createdBy: 'user-1',
                updatedAt: new Date('2024-01-01'),
                updatedBy: 'user-1',
                version: 1,
                deletedAt: null,
                deletedBy: null,
                coordinatorId: 'user-1'
            };
            mockRepository.getCarePlanById.mockResolvedValue(otherOrgCarePlan);
            await (0, vitest_1.expect)(service.getCarePlanById(carePlanId, mockContext))
                .rejects.toThrow(core_1.PermissionError);
        });
    });
    (0, vitest_1.describe)('updateCarePlan', () => {
        (0, vitest_1.it)('should update care plan with valid input', async () => {
            const carePlanId = uuid();
            const updateInput = {
                name: 'Updated Care Plan',
                priority: 'HIGH',
            };
            const existingCarePlan = {
                id: carePlanId,
                planNumber: 'CP-001',
                name: 'Personal Care Plan',
                clientId: 'client-1',
                organizationId: mockContext.organizationId,
                planType: 'PERSONAL_CARE',
                status: 'ACTIVE',
                priority: 'MEDIUM',
                effectiveDate: new Date('2024-01-01'),
                goals: [],
                interventions: [],
                taskTemplates: [],
                complianceStatus: 'COMPLIANT',
                createdAt: new Date('2024-01-01'),
                createdBy: mockContext.userId,
                updatedAt: new Date('2024-01-01'),
                updatedBy: mockContext.userId,
                version: 1,
                deletedAt: null,
                deletedBy: null
            };
            mockPermissions.hasPermission.mockReturnValue(true);
            mockRepository.getCarePlanById.mockResolvedValue(existingCarePlan);
            const updatedCarePlan = { ...existingCarePlan, ...updateInput };
            mockRepository.updateCarePlan.mockResolvedValue(updatedCarePlan);
            const result = await service.updateCarePlan(carePlanId, updateInput, mockContext);
            (0, vitest_1.expect)(mockPermissions.hasPermission).toHaveBeenCalledWith(mockContext, 'care-plans:update');
            (0, vitest_1.expect)(mockRepository.updateCarePlan).toHaveBeenCalledWith(carePlanId, updateInput, mockContext.userId);
            (0, vitest_1.expect)(result).toEqual(updatedCarePlan);
        });
        (0, vitest_1.it)('should prevent updates to completed care plans without special permission', async () => {
            const carePlanId = uuid();
            const updateInput = {
                name: 'Updated Care Plan',
                priority: 'HIGH',
            };
            const existingCarePlan = {
                id: carePlanId,
                planNumber: 'CP-001',
                name: 'Personal Care Plan',
                clientId: 'client-1',
                organizationId: mockContext.organizationId,
                planType: 'PERSONAL_CARE',
                status: 'COMPLETED',
                priority: 'MEDIUM',
                effectiveDate: new Date('2024-01-01'),
                goals: [],
                interventions: [],
                taskTemplates: [],
                complianceStatus: 'COMPLIANT',
                createdAt: new Date('2024-01-01'),
                createdBy: mockContext.userId,
                updatedAt: new Date('2024-01-01'),
                updatedBy: mockContext.userId,
                version: 1,
                deletedAt: null,
                deletedBy: null,
                coordinatorId: mockContext.userId
            };
            mockPermissions.hasPermission
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(false);
            mockRepository.getCarePlanById.mockResolvedValue(existingCarePlan);
            await (0, vitest_1.expect)(service.updateCarePlan(carePlanId, updateInput, mockContext))
                .rejects.toThrow(core_1.PermissionError);
            mockPermissions.hasPermission.mockReturnValue(true);
        });
    });
    (0, vitest_1.describe)('activateCarePlan', () => {
        (0, vitest_1.it)('should activate a valid care plan', async () => {
            const carePlanId = uuid();
            const validCarePlan = {
                id: carePlanId,
                planNumber: 'CP-001',
                name: 'Personal Care Plan',
                clientId: 'client-1',
                organizationId: mockContext.organizationId,
                planType: 'PERSONAL_CARE',
                status: 'DRAFT',
                priority: 'MEDIUM',
                effectiveDate: new Date('2024-01-01'),
                goals: [
                    {
                        id: 'goal-1',
                        name: 'Improve Mobility',
                        description: 'Help client improve mobility',
                        category: 'MOBILITY',
                        status: 'NOT_STARTED',
                        priority: 'MEDIUM'
                    }
                ],
                interventions: [
                    {
                        id: 'intervention-1',
                        name: 'Test Intervention',
                        description: 'Test intervention',
                        category: 'ASSISTANCE_WITH_ADL',
                        goalIds: ['goal-1'],
                        frequency: { pattern: 'DAILY' },
                        instructions: 'Test instructions',
                        performedBy: ['CAREGIVER'],
                        requiresDocumentation: true,
                        status: 'ACTIVE',
                        startDate: new Date('2024-01-01')
                    }
                ],
                taskTemplates: [],
                complianceStatus: 'COMPLIANT',
                createdAt: new Date('2024-01-01'),
                createdBy: mockContext.userId,
                updatedAt: new Date('2024-01-01'),
                updatedBy: mockContext.userId,
                version: 1,
                deletedAt: null,
                deletedBy: null,
                coordinatorId: mockContext.userId
            };
            mockPermissions.hasPermission.mockReturnValue(true);
            mockRepository.getCarePlanById.mockResolvedValue(validCarePlan);
            mockRepository.getActiveCarePlanForClient.mockResolvedValue(null);
            const activatedPlan = { ...validCarePlan, status: 'ACTIVE' };
            mockRepository.updateCarePlan.mockResolvedValue(activatedPlan);
            const result = await service.activateCarePlan(carePlanId, mockContext);
            (0, vitest_1.expect)(mockPermissions.hasPermission).toHaveBeenCalledWith(mockContext, 'care-plans:activate');
            (0, vitest_1.expect)(mockRepository.updateCarePlan).toHaveBeenCalledWith(carePlanId, { status: 'ACTIVE' }, mockContext.userId);
            (0, vitest_1.expect)(result.status).toBe('ACTIVE');
        });
        (0, vitest_1.it)('should expire existing active plan when activating new one', async () => {
            const carePlanId = uuid();
            const validCarePlan = {
                id: carePlanId,
                planNumber: 'CP-002',
                name: 'New Care Plan',
                clientId: 'client-1',
                organizationId: mockContext.organizationId,
                planType: 'PERSONAL_CARE',
                status: 'DRAFT',
                priority: 'MEDIUM',
                effectiveDate: new Date('2024-01-01'),
                goals: [
                    {
                        id: 'goal-1',
                        name: 'Improve Mobility',
                        description: 'Help client improve mobility',
                        category: 'MOBILITY',
                        status: 'NOT_STARTED',
                        priority: 'MEDIUM'
                    }
                ],
                interventions: [
                    {
                        id: 'intervention-1',
                        name: 'Test Intervention',
                        description: 'Test intervention',
                        category: 'ASSISTANCE_WITH_ADL',
                        goalIds: ['goal-1'],
                        frequency: { pattern: 'DAILY' },
                        instructions: 'Test instructions',
                        performedBy: ['CAREGIVER'],
                        requiresDocumentation: true,
                        status: 'ACTIVE',
                        startDate: new Date('2024-01-01')
                    }
                ],
                taskTemplates: [],
                complianceStatus: 'COMPLIANT',
                createdAt: new Date('2024-01-01'),
                createdBy: mockContext.userId,
                updatedAt: new Date('2024-01-01'),
                updatedBy: mockContext.userId,
                version: 1,
                deletedAt: null,
                deletedBy: null,
                coordinatorId: mockContext.userId
            };
            const existingActivePlan = {
                id: 'existing-plan-id',
                planNumber: 'CP-001',
                name: 'Personal Care Plan',
                clientId: 'client-1',
                organizationId: mockContext.organizationId,
                planType: 'PERSONAL_CARE',
                status: 'ACTIVE',
                priority: 'MEDIUM',
                effectiveDate: new Date('2024-01-01'),
                goals: [],
                interventions: [],
                taskTemplates: [],
                complianceStatus: 'COMPLIANT',
                createdAt: new Date('2024-01-01'),
                createdBy: mockContext.userId,
                updatedAt: new Date('2024-01-01'),
                updatedBy: mockContext.userId,
                version: 1,
                deletedAt: null,
                deletedBy: null,
                coordinatorId: mockContext.userId
            };
            mockPermissions.hasPermission.mockReturnValue(true);
            mockRepository.getCarePlanById.mockResolvedValue(validCarePlan);
            mockRepository.getActiveCarePlanForClient.mockResolvedValue(existingActivePlan);
            const activatedPlan = { ...validCarePlan, status: 'ACTIVE' };
            mockRepository.updateCarePlan.mockResolvedValue(activatedPlan);
            await service.activateCarePlan(carePlanId, mockContext);
            (0, vitest_1.expect)(mockRepository.updateCarePlan).toHaveBeenCalledWith(existingActivePlan.id, { status: 'EXPIRED' }, mockContext.userId);
            (0, vitest_1.expect)(mockRepository.updateCarePlan).toHaveBeenCalledWith(carePlanId, { status: 'ACTIVE' }, mockContext.userId);
        });
    });
    (0, vitest_1.describe)('createTaskInstance', () => {
        const taskInput = {
            carePlanId: uuid(),
            clientId: uuid(),
            name: 'Test Task',
            description: 'Test task description',
            category: 'PERSONAL_HYGIENE',
            instructions: 'Test instructions',
            scheduledDate: new Date(),
            requiredSignature: true,
            requiredNote: false,
        };
        (0, vitest_1.it)('should create a task instance', async () => {
            mockPermissions.hasPermission.mockReturnValue(true);
            const createdTask = {
                id: 'task-1',
                carePlanId: 'care-plan-1',
                clientId: 'client-1',
                name: 'Bathing Assistance',
                description: 'Assist with bathing',
                category: 'PERSONAL_HYGIENE',
                instructions: 'Help client with shower',
                scheduledDate: new Date('2024-01-15'),
                status: 'SCHEDULED',
                requiredSignature: true,
                requiredNote: false,
                createdAt: new Date('2024-01-01'),
                createdBy: 'user-1',
                updatedAt: new Date('2024-01-01'),
                updatedBy: 'user-1',
                version: 1
            };
            mockRepository.createTaskInstance.mockResolvedValue(createdTask);
            const result = await service.createTaskInstance(taskInput, mockContext);
            (0, vitest_1.expect)(mockPermissions.hasPermission).toHaveBeenCalledWith(mockContext, 'tasks:create');
            (0, vitest_1.expect)(mockRepository.createTaskInstance).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                ...taskInput,
                createdBy: mockContext.userId,
                status: 'SCHEDULED',
            }));
            (0, vitest_1.expect)(result).toEqual(createdTask);
        });
        (0, vitest_1.it)('should throw error without create permission', async () => {
            mockPermissions.hasPermission.mockImplementationOnce(() => false);
            await (0, vitest_1.expect)(service.createTaskInstance(taskInput, mockContext))
                .rejects.toThrow(core_1.PermissionError);
            (0, vitest_1.expect)(mockRepository.createTaskInstance).not.toHaveBeenCalled();
            (0, vitest_1.expect)(mockPermissions.hasPermission).toHaveBeenCalledWith(mockContext, 'tasks:create');
        });
    });
    (0, vitest_1.describe)('completeTask', () => {
        const taskId = uuid();
        const completeInput = {
            completionNote: 'Task completed successfully',
            signature: {
                signatureData: 'base64-signature-data',
                signedBy: uuid(),
                signedByName: 'Client Name',
                signatureType: 'ELECTRONIC',
            },
        };
        const existingTask = {
            id: 'task-1',
            carePlanId: 'care-plan-1',
            clientId: 'client-1',
            name: 'Bathing Assistance',
            description: 'Assist with bathing',
            category: 'PERSONAL_HYGIENE',
            instructions: 'Help client with shower',
            scheduledDate: new Date('2024-01-15'),
            status: 'SCHEDULED',
            requiredSignature: false,
            requiredNote: false,
            createdAt: new Date('2024-01-01'),
            createdBy: 'user-1',
            updatedAt: new Date('2024-01-01'),
            updatedBy: 'user-1',
            version: 1
        };
        (0, vitest_1.it)('should complete a task with valid input', async () => {
            mockPermissions.hasPermission.mockReturnValue(true);
            mockRepository.getTaskInstanceById.mockResolvedValue(existingTask);
            const completedTask = {
                ...existingTask,
                status: 'COMPLETED',
                completedAt: new Date(),
                completedBy: mockContext.userId,
                completionNote: completeInput.completionNote,
                completionSignature: {
                    ...completeInput.signature,
                    signedAt: new Date(),
                },
            };
            mockRepository.updateTaskInstance.mockResolvedValue(completedTask);
            const result = await service.completeTask(taskId, completeInput, mockContext);
            (0, vitest_1.expect)(mockPermissions.hasPermission).toHaveBeenCalledWith(mockContext, 'tasks:complete');
            (0, vitest_1.expect)(mockRepository.updateTaskInstance).toHaveBeenCalledWith(taskId, vitest_1.expect.objectContaining({
                status: 'COMPLETED',
                completedAt: vitest_1.expect.any(Date),
                completedBy: mockContext.userId,
                completionNote: completeInput.completionNote,
            }), mockContext.userId);
            (0, vitest_1.expect)(result.status).toBe('COMPLETED');
        });
        (0, vitest_1.it)('should throw error when task is already completed', async () => {
            const completedTask = { ...existingTask, status: 'COMPLETED' };
            mockRepository.getTaskInstanceById.mockResolvedValue(completedTask);
            await (0, vitest_1.expect)(service.completeTask(taskId, completeInput, mockContext))
                .rejects.toThrow(core_1.ValidationError);
        });
        (0, vitest_1.it)('should throw error when task is cancelled', async () => {
            const cancelledTask = { ...existingTask, status: 'CANCELLED' };
            mockRepository.getTaskInstanceById.mockResolvedValue(cancelledTask);
            await (0, vitest_1.expect)(service.completeTask(taskId, completeInput, mockContext))
                .rejects.toThrow(core_1.ValidationError);
        });
    });
    (0, vitest_1.describe)('skipTask', () => {
        const taskId = uuid();
        const skipReason = 'Client refused care';
        const skipNote = 'Client was feeling unwell';
        const existingTask = {
            id: taskId,
            carePlanId: uuid(),
            clientId: uuid(),
            name: 'Test Task',
            description: 'Test task',
            category: 'PERSONAL_HYGIENE',
            instructions: 'Test instructions',
            scheduledDate: new Date(),
            status: 'SCHEDULED',
            requiredSignature: false,
            requiredNote: false,
            createdAt: new Date(),
            createdBy: 'user-1',
            updatedAt: new Date(),
            updatedBy: 'user-1',
            version: 1
        };
        (0, vitest_1.it)('should skip a task with valid reason', async () => {
            mockPermissions.hasPermission.mockReturnValue(true);
            mockRepository.getTaskInstanceById.mockResolvedValue(existingTask);
            const skippedTask = {
                ...existingTask,
                status: 'SKIPPED',
                skippedAt: new Date(),
                skippedBy: mockContext.userId,
                skipReason,
                skipNote,
            };
            mockRepository.updateTaskInstance.mockResolvedValue(skippedTask);
            const result = await service.skipTask(taskId, skipReason, skipNote, mockContext);
            (0, vitest_1.expect)(mockPermissions.hasPermission).toHaveBeenCalledWith(mockContext, 'tasks:skip');
            (0, vitest_1.expect)(mockRepository.updateTaskInstance).toHaveBeenCalledWith(taskId, vitest_1.expect.objectContaining({
                status: 'SKIPPED',
                skippedAt: vitest_1.expect.any(Date),
                skippedBy: mockContext.userId,
                skipReason,
                skipNote,
            }), mockContext.userId);
            (0, vitest_1.expect)(result.status).toBe('SKIPPED');
        });
        (0, vitest_1.it)('should throw error when trying to skip completed task', async () => {
            const completedTask = { ...existingTask, status: 'COMPLETED' };
            mockRepository.getTaskInstanceById.mockResolvedValue(completedTask);
            await (0, vitest_1.expect)(service.skipTask(taskId, skipReason, skipNote, mockContext))
                .rejects.toThrow(core_1.ValidationError);
        });
    });
    (0, vitest_1.describe)('createProgressNote', () => {
        const noteInput = {
            carePlanId: uuid(),
            clientId: uuid(),
            noteType: 'VISIT_NOTE',
            content: 'Client had a good day. Mobility improved.',
            goalProgress: [
                {
                    goalId: uuid(),
                    goalName: 'Improve Mobility',
                    status: 'ON_TRACK',
                    progressDescription: 'Client walked 15 steps with minimal assistance',
                    progressPercentage: 75,
                }
            ],
            observations: [
                {
                    category: 'PHYSICAL',
                    observation: 'Client appeared more energetic today',
                    severity: 'NORMAL',
                    timestamp: new Date(),
                }
            ],
        };
        (0, vitest_1.it)('should create a progress note', async () => {
            mockPermissions.hasPermission.mockReturnValue(true);
            const createdNote = {
                id: 'note-1',
                carePlanId: 'care-plan-1',
                clientId: 'client-1',
                visitId: 'visit-1',
                authorId: mockContext.userId,
                authorName: 'John Doe',
                authorRole: 'CAREGIVER',
                noteType: 'VISIT_NOTE',
                content: 'Client responded well to care',
                noteDate: new Date('2024-01-15'),
                isPrivate: false,
                createdAt: new Date('2024-01-15'),
                createdBy: mockContext.userId,
                updatedAt: new Date('2024-01-15'),
                updatedBy: mockContext.userId,
                version: 1
            };
            mockRepository.createProgressNote.mockResolvedValue(createdNote);
            const result = await service.createProgressNote(noteInput, mockContext);
            (0, vitest_1.expect)(mockPermissions.hasPermission).toHaveBeenCalledWith(mockContext, 'progress-notes:create');
            (0, vitest_1.expect)(mockRepository.createProgressNote).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                carePlanId: noteInput.carePlanId,
                clientId: noteInput.clientId,
                noteType: noteInput.noteType,
                content: noteInput.content,
                goalProgress: noteInput.goalProgress,
                observations: vitest_1.expect.arrayContaining([
                    vitest_1.expect.objectContaining({
                        category: 'PHYSICAL',
                        observation: 'Client appeared more energetic today',
                        severity: 'NORMAL',
                        timestamp: vitest_1.expect.any(Date),
                    })
                ]),
                authorId: mockContext.userId,
                authorName: vitest_1.expect.any(String),
                authorRole: vitest_1.expect.any(String),
                noteDate: vitest_1.expect.any(Date),
            }));
            (0, vitest_1.expect)(result.authorId).toBe(mockContext.userId);
        });
        (0, vitest_1.it)('should throw error without create permission', async () => {
            mockPermissions.hasPermission.mockImplementationOnce(() => false);
            await (0, vitest_1.expect)(service.createProgressNote(noteInput, mockContext))
                .rejects.toThrow(core_1.PermissionError);
            (0, vitest_1.expect)(mockRepository.createProgressNote).not.toHaveBeenCalled();
            (0, vitest_1.expect)(mockPermissions.hasPermission).toHaveBeenCalledWith(mockContext, 'progress-notes:create');
        });
    });
    (0, vitest_1.describe)('getCarePlanAnalytics', () => {
        (0, vitest_1.it)('should calculate analytics for organization', async () => {
            const organizationId = mockContext.organizationId;
            mockPermissions.hasPermission.mockReturnValue(true);
            const mockPlans = {
                items: [
                    {
                        id: 'plan-1',
                        status: 'ACTIVE',
                        goals: [{
                                id: 'goal-1',
                                name: 'Goal 1',
                                description: 'Test goal',
                                category: 'MOBILITY',
                                status: 'ACHIEVED',
                                priority: 'MEDIUM'
                            }],
                        expirationDate: new Date('2024-12-31'),
                        complianceStatus: 'COMPLIANT',
                        clientId: 'client-1',
                        organizationId: 'org-1',
                        planNumber: 'CP-001',
                        name: 'Plan 1',
                        planType: 'PERSONAL_CARE',
                        priority: 'MEDIUM',
                        effectiveDate: new Date('2024-01-01'),
                        interventions: [],
                        taskTemplates: [],
                        createdAt: new Date('2024-01-01'),
                        createdBy: 'user-1',
                        updatedAt: new Date('2024-01-01'),
                        updatedBy: 'user-1',
                        version: 1,
                        deletedAt: null,
                        deletedBy: null
                    },
                    {
                        id: 'plan-2',
                        status: 'DRAFT',
                        goals: [{
                                id: 'goal-2',
                                name: 'Goal 2',
                                description: 'Test goal 2',
                                category: 'MOBILITY',
                                status: 'IN_PROGRESS',
                                priority: 'MEDIUM'
                            }],
                        expirationDate: new Date('2024-06-30'),
                        complianceStatus: 'PENDING_REVIEW',
                        clientId: 'client-2',
                        organizationId: 'org-1',
                        planNumber: 'CP-002',
                        name: 'Plan 2',
                        planType: 'PERSONAL_CARE',
                        priority: 'MEDIUM',
                        effectiveDate: new Date('2024-01-01'),
                        interventions: [],
                        taskTemplates: [],
                        createdAt: new Date('2024-01-01'),
                        createdBy: 'user-1',
                        updatedAt: new Date('2024-01-01'),
                        updatedBy: 'user-1',
                        version: 1,
                        deletedAt: null,
                        deletedBy: null
                    }
                ],
                total: 2,
                page: 1,
                limit: 10,
                totalPages: 1
            };
            mockRepository.searchCarePlans.mockResolvedValue(mockPlans);
            const mockTaskMetrics = {
                totalTasks: 100,
                completedTasks: 85,
                skippedTasks: 10,
                missedTasks: 5,
                completionRate: 85,
                averageCompletionTime: 45,
                tasksByCategory: {
                    PERSONAL_HYGIENE: 0,
                    BATHING: 0,
                    DRESSING: 0,
                    GROOMING: 0,
                    TOILETING: 0,
                    MOBILITY: 0,
                    TRANSFERRING: 0,
                    AMBULATION: 0,
                    MEDICATION: 0,
                    MEAL_PREPARATION: 0,
                    FEEDING: 0,
                    HOUSEKEEPING: 0,
                    LAUNDRY: 0,
                    SHOPPING: 0,
                    TRANSPORTATION: 0,
                    COMPANIONSHIP: 0,
                    MONITORING: 0,
                    DOCUMENTATION: 0,
                    OTHER: 0
                },
                issuesReported: 2,
            };
            vitest_1.vi.spyOn(service, 'getTaskCompletionMetrics').mockResolvedValue(mockTaskMetrics);
            const result = await service.getCarePlanAnalytics(organizationId, mockContext);
            (0, vitest_1.expect)(mockPermissions.hasPermission).toHaveBeenCalledWith(mockContext, 'analytics:read');
            (0, vitest_1.expect)(mockRepository.searchCarePlans).toHaveBeenCalledWith({ organizationId }, { page: 1, limit: 10000 });
            (0, vitest_1.expect)(result).toEqual({
                totalPlans: 2,
                activePlans: 1,
                expiringPlans: 2,
                goalCompletionRate: 50,
                taskCompletionRate: 85,
                averageGoalsPerPlan: 1,
                averageTasksPerVisit: 50,
                complianceRate: 100,
            });
        });
    });
    (0, vitest_1.describe)('deleteCarePlan', () => {
        (0, vitest_1.it)('should delete a non-active care plan', async () => {
            const carePlanId = uuid();
            const draftCarePlan = {
                id: carePlanId,
                planNumber: 'CP-001',
                name: 'Personal Care Plan',
                clientId: 'client-1',
                organizationId: mockContext.organizationId,
                planType: 'PERSONAL_CARE',
                status: 'DRAFT',
                priority: 'MEDIUM',
                effectiveDate: new Date('2024-01-01'),
                goals: [],
                interventions: [],
                taskTemplates: [],
                complianceStatus: 'COMPLIANT',
                createdAt: new Date('2024-01-01'),
                createdBy: mockContext.userId,
                updatedAt: new Date('2024-01-01'),
                updatedBy: mockContext.userId,
                version: 1,
                deletedAt: null,
                deletedBy: null
            };
            mockPermissions.hasPermission.mockReturnValue(true);
            mockRepository.getCarePlanById.mockResolvedValue(draftCarePlan);
            mockRepository.deleteCarePlan.mockResolvedValue(undefined);
            await service.deleteCarePlan(carePlanId, mockContext);
            (0, vitest_1.expect)(mockPermissions.hasPermission).toHaveBeenCalledWith(mockContext, 'care-plans:delete');
            (0, vitest_1.expect)(mockRepository.deleteCarePlan).toHaveBeenCalledWith(carePlanId, mockContext.userId);
        });
        (0, vitest_1.it)('should throw error when trying to delete active care plan', async () => {
            const carePlanId = uuid();
            const activeCarePlan = {
                id: carePlanId,
                planNumber: 'CP-001',
                name: 'Personal Care Plan',
                clientId: 'client-1',
                organizationId: mockContext.organizationId,
                planType: 'PERSONAL_CARE',
                status: 'ACTIVE',
                priority: 'MEDIUM',
                effectiveDate: new Date('2024-01-01'),
                goals: [],
                interventions: [],
                taskTemplates: [],
                complianceStatus: 'COMPLIANT',
                createdAt: new Date('2024-01-01'),
                createdBy: mockContext.userId,
                updatedAt: new Date('2024-01-01'),
                updatedBy: mockContext.userId,
                version: 1,
                deletedAt: null,
                deletedBy: null,
                coordinatorId: mockContext.userId
            };
            mockRepository.getCarePlanById.mockResolvedValue(activeCarePlan);
            await (0, vitest_1.expect)(service.deleteCarePlan(carePlanId, mockContext))
                .rejects.toThrow(core_1.ValidationError);
            (0, vitest_1.expect)(mockRepository.deleteCarePlan).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=care-plan-service.test.js.map