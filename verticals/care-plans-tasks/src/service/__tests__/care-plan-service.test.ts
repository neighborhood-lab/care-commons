/**
 * Care Plan Service tests
 * Tests core business logic for care plans and tasks
 */

import { CarePlanService } from '../care-plan-service';
import { CarePlanRepository } from '../../repository/care-plan-repository';
import { PermissionService } from '@care-commons/core';
import { CarePlanValidator } from '../../validation/care-plan-validator';
import {
  CarePlan,
  CreateCarePlanInput,
  UpdateCarePlanInput,
  CarePlanStatus,
  TaskInstance,
  CreateTaskInstanceInput,
  CompleteTaskInput,
  TaskStatus,
  ProgressNote,
  CreateProgressNoteInput,
  CarePlanAnalytics,
  TaskCompletionMetrics,
  CarePlanType,
  Priority,
  GoalCategory,
  GoalStatus,
  ComplianceStatus,
} from '../../types/care-plan';
import { UserContext, ValidationError, PermissionError, NotFoundError } from '@care-commons/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock uuid
let uuidCounter = 0;
vi.mock('uuid', () => ({
  v4: vi.fn(() => {
    const counter = (uuidCounter++).toString().padStart(12, '0');
    return `00000000-0000-4000-8000-${counter}`;
  }),
}));

const { v4: uuid } = require('uuid');

// Mock dependencies
vi.mock('../../repository/care-plan-repository');
vi.mock('@care-commons/core', () => ({
  PermissionService: vi.fn(),
  UserContext: vi.fn(),
  PaginationParams: vi.fn(),
  PaginatedResult: vi.fn(),
  UUID: vi.fn(),
  Timestamp: vi.fn(),
  ValidationError: class extends Error {
    constructor(message: string, details?: any) {
      super(message);
      this.name = 'ValidationError';
    }
  },
  PermissionError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'PermissionError';
    }
  },
  NotFoundError: class extends Error {
    constructor(message: string, details?: any) {
      super(message);
      this.name = 'NotFoundError';
    }
  }
}));
vi.mock('../../validation/care-plan-validator');

describe('CarePlanService', () => {
  let service: CarePlanService;
  let mockRepository: any;
  let mockPermissions: any;
  let mockUserRepository: any;
  let mockValidator: any;
  let mockContext: UserContext;

  beforeEach(() => {
    vi.clearAllMocks();
    uuidCounter = 0;
    
    mockRepository = {
      createCarePlan: vi.fn(),
      getCarePlanById: vi.fn(),
      updateCarePlan: vi.fn(),
      searchCarePlans: vi.fn(),
      getCarePlansByClientId: vi.fn(),
      getActiveCarePlanForClient: vi.fn(),
      getExpiringCarePlans: vi.fn(),
      deleteCarePlan: vi.fn(),
      createTaskInstance: vi.fn(),
      getTaskInstanceById: vi.fn(),
      updateTaskInstance: vi.fn(),
      searchTaskInstances: vi.fn(),
      getTasksByVisitId: vi.fn(),
      createProgressNote: vi.fn(),
      getProgressNotesByCarePlanId: vi.fn(),
    } as any;

    mockPermissions = {
      hasPermission: vi.fn().mockReturnValue(true),
    } as any;

    mockUserRepository = {
      getUserById: vi.fn().mockResolvedValue({
        id: uuid(),
        firstName: 'Test',
        lastName: 'User',
        email: 'test.user@example.com',
      }),
      getUsersByIds: vi.fn().mockResolvedValue([]),
    } as any;

    mockValidator = CarePlanValidator as any;
    
    // Mock all validation methods to return input by default
    mockValidator.validateCreateCarePlan = vi.fn((input: any) => input);
    mockValidator.validateUpdateCarePlan = vi.fn((input: any) => input);
    mockValidator.validateCreateTaskInstance = vi.fn((input: any) => input);
    mockValidator.validateCompleteTask = vi.fn((input: any) => input);
    mockValidator.validateCreateProgressNote = vi.fn((input: any) => input);
    mockValidator.validateCarePlanSearchFilters = vi.fn((input: any) => input);
    mockValidator.validateTaskInstanceSearchFilters = vi.fn((input: any) => input);
    mockValidator.validateTaskCompletion = vi.fn(() => ({ valid: true, errors: [] }));
    mockValidator.validateVitalSigns = vi.fn(() => ({ valid: true, warnings: [] }));
    mockValidator.validateCarePlanActivation = vi.fn(() => ({ valid: true, errors: [] }));

    service = new CarePlanService(mockRepository, mockPermissions, mockUserRepository);

    mockContext = {
      userId: uuid(),
      organizationId: uuid(),
      roles: ['COORDINATOR'],
      permissions: ['care-plans:create', 'care-plans:read', 'care-plans:update', 'tasks:create', 'tasks:complete'],
      branchIds: [uuid()],
    };
  });

  describe('createCarePlan', () => {
    let validInput: CreateCarePlanInput;

    beforeEach(() => {
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

    it('should create a care plan with valid input', async () => {
      // Arrange
      mockPermissions.hasPermission.mockReturnValue(true);
      const expectedCarePlan: CarePlan = {
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

      // Act
      const result = await service.createCarePlan(validInput, mockContext);

      // Assert
      expect(mockPermissions.hasPermission).toHaveBeenCalledWith(mockContext, 'care-plans:create');
      expect(mockRepository.createCarePlan).toHaveBeenCalledWith(
        expect.objectContaining({
          ...validInput,
          planNumber: expect.any(String),
          createdBy: mockContext.userId,
        })
      );
      expect(result).toEqual(expectedCarePlan);
    });

    it('should throw error without create permission', async () => {
      // Arrange
      mockPermissions.hasPermission.mockReturnValue(false);

      // Act & Assert
      await expect(service.createCarePlan(validInput, mockContext))
        .rejects.toThrow(PermissionError);
      expect(mockRepository.createCarePlan).not.toHaveBeenCalled();
      expect(mockPermissions.hasPermission).toHaveBeenCalledWith(mockContext, 'care-plans:create');
      
      // Reset mock for other tests
      mockPermissions.hasPermission.mockReturnValue(true);
    });
  });

  describe('getCarePlanById', () => {
    it('should return care plan when found and accessible', async () => {
      // Arrange
      const carePlanId = uuid();
      const mockCarePlan: CarePlan = {
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

      // Act
      const result = await service.getCarePlanById(carePlanId, mockContext);

      // Assert
      expect(mockPermissions.hasPermission).toHaveBeenCalledWith(mockContext, 'care-plans:read');
      expect(mockRepository.getCarePlanById).toHaveBeenCalledWith(carePlanId);
      expect(result).toEqual(mockCarePlan);
    });

    it('should throw error when care plan not found', async () => {
      // Arrange
      const carePlanId = uuid();
      mockPermissions.hasPermission.mockReturnValue(true); // Ensure permission passes
      mockRepository.getCarePlanById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getCarePlanById(carePlanId, mockContext))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw error when accessing care plan from different organization', async () => {
      // Arrange
      const carePlanId = uuid();
      const otherOrgCarePlan: CarePlan = {
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

      // Act & Assert
      await expect(service.getCarePlanById(carePlanId, mockContext))
        .rejects.toThrow(PermissionError);
    });
  });

  describe('updateCarePlan', () => {
    it('should update care plan with valid input', async () => {
      // Arrange
      const carePlanId = uuid();
      const updateInput: UpdateCarePlanInput = {
        name: 'Updated Care Plan',
        priority: 'HIGH',
      };

      const existingCarePlan: CarePlan = {
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

      // Act
      const result = await service.updateCarePlan(carePlanId, updateInput, mockContext);

      // Assert
      expect(mockPermissions.hasPermission).toHaveBeenCalledWith(mockContext, 'care-plans:update');
      expect(mockRepository.updateCarePlan).toHaveBeenCalledWith(
        carePlanId,
        updateInput,
        mockContext.userId
      );
      expect(result).toEqual(updatedCarePlan);
    });

    it('should prevent updates to completed care plans without special permission', async () => {
      // Arrange
      const carePlanId = uuid();
      const updateInput: UpdateCarePlanInput = {
        name: 'Updated Care Plan',
        priority: 'HIGH',
      };

      const existingCarePlan: CarePlan = {
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
        .mockReturnValueOnce(true) // care-plans:update
        .mockReturnValueOnce(false); // care-plans:update:archived
      
      mockRepository.getCarePlanById.mockResolvedValue(existingCarePlan);

      // Act & Assert
      await expect(service.updateCarePlan(carePlanId, updateInput, mockContext))
        .rejects.toThrow(PermissionError);
      
      // Reset mock for other tests
      mockPermissions.hasPermission.mockReturnValue(true);
    });
  });

  describe('activateCarePlan', () => {
    it('should activate a valid care plan', async () => {
      const carePlanId = uuid();
      const validCarePlan: CarePlan = {
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

      // Arrange
      mockPermissions.hasPermission.mockReturnValue(true);
      mockRepository.getCarePlanById.mockResolvedValue(validCarePlan);
      mockRepository.getActiveCarePlanForClient.mockResolvedValue(null);
      
      const activatedPlan = { ...validCarePlan, status: 'ACTIVE' as CarePlanStatus };
      mockRepository.updateCarePlan.mockResolvedValue(activatedPlan);

      // Act
      const result = await service.activateCarePlan(carePlanId, mockContext);

      // Assert
      expect(mockPermissions.hasPermission).toHaveBeenCalledWith(mockContext, 'care-plans:activate');
      expect(mockRepository.updateCarePlan).toHaveBeenCalledWith(
        carePlanId,
        { status: 'ACTIVE' },
        mockContext.userId
      );
      expect(result.status).toBe('ACTIVE');
    });

    it('should expire existing active plan when activating new one', async () => {
      // Arrange
      const carePlanId = uuid();
      const validCarePlan: CarePlan = {
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
      
      const existingActivePlan: CarePlan = {
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
      
      const activatedPlan = { ...validCarePlan, status: 'ACTIVE' as CarePlanStatus };
      mockRepository.updateCarePlan.mockResolvedValue(activatedPlan);

      // Act
      await service.activateCarePlan(carePlanId, mockContext);

      // Assert
      expect(mockRepository.updateCarePlan).toHaveBeenCalledWith(
        existingActivePlan.id,
        { status: 'EXPIRED' },
        mockContext.userId
      );
      expect(mockRepository.updateCarePlan).toHaveBeenCalledWith(
        carePlanId,
        { status: 'ACTIVE' },
        mockContext.userId
      );
    });
  });

  describe('createTaskInstance', () => {
    const taskInput: CreateTaskInstanceInput = {
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

    it('should create a task instance', async () => {
      // Arrange
      mockPermissions.hasPermission.mockReturnValue(true);
      const createdTask: TaskInstance = {
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

      // Act
      const result = await service.createTaskInstance(taskInput, mockContext);

      // Assert
      expect(mockPermissions.hasPermission).toHaveBeenCalledWith(mockContext, 'tasks:create');
      expect(mockRepository.createTaskInstance).toHaveBeenCalledWith(
        expect.objectContaining({
          ...taskInput,
          createdBy: mockContext.userId,
          status: 'SCHEDULED',
        })
      );
      expect(result).toEqual(createdTask);
    });

    it('should throw error without create permission', async () => {
      // Arrange
      mockPermissions.hasPermission.mockImplementationOnce(() => false);

      // Act & Assert
      await expect(service.createTaskInstance(taskInput, mockContext))
        .rejects.toThrow(PermissionError);
      expect(mockRepository.createTaskInstance).not.toHaveBeenCalled();
      expect(mockPermissions.hasPermission).toHaveBeenCalledWith(mockContext, 'tasks:create');
    });
  });

  describe('completeTask', () => {
    const taskId = uuid();
    const completeInput: CompleteTaskInput = {
      completionNote: 'Task completed successfully',
      signature: {
        signatureData: 'base64-signature-data',
        signedBy: uuid(),
        signedByName: 'Client Name',
        signatureType: 'ELECTRONIC',
      },
    };

    const existingTask: TaskInstance = {
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

    it('should complete a task with valid input', async () => {
      // Arrange
      mockPermissions.hasPermission.mockReturnValue(true);
      mockRepository.getTaskInstanceById.mockResolvedValue(existingTask);
      
      const completedTask: TaskInstance = {
        ...existingTask,
        status: 'COMPLETED',
        completedAt: new Date(),
        completedBy: mockContext.userId,
        completionNote: completeInput.completionNote,
        completionSignature: {
          ...completeInput.signature!,
          signedAt: new Date(),
        },
      };
      mockRepository.updateTaskInstance.mockResolvedValue(completedTask);

      // Act
      const result = await service.completeTask(taskId, completeInput, mockContext);

      // Assert
      expect(mockPermissions.hasPermission).toHaveBeenCalledWith(mockContext, 'tasks:complete');
      expect(mockRepository.updateTaskInstance).toHaveBeenCalledWith(
        taskId,
        expect.objectContaining({
          status: 'COMPLETED',
          completedAt: expect.any(Date),
          completedBy: mockContext.userId,
          completionNote: completeInput.completionNote,
        }),
        mockContext.userId
      );
      expect(result.status).toBe('COMPLETED');
    });

    it('should throw error when task is already completed', async () => {
      // Arrange
      const completedTask = { ...existingTask, status: 'COMPLETED' as TaskStatus };
      mockRepository.getTaskInstanceById.mockResolvedValue(completedTask);

      // Act & Assert
      await expect(service.completeTask(taskId, completeInput, mockContext))
        .rejects.toThrow(ValidationError);
    });

    it('should throw error when task is cancelled', async () => {
      // Arrange
      const cancelledTask = { ...existingTask, status: 'CANCELLED' as TaskStatus };
      mockRepository.getTaskInstanceById.mockResolvedValue(cancelledTask);

      // Act & Assert
      await expect(service.completeTask(taskId, completeInput, mockContext))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('skipTask', () => {
    const taskId = uuid();
    const skipReason = 'Client refused care';
    const skipNote = 'Client was feeling unwell';

    const existingTask: TaskInstance = {
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

    it('should skip a task with valid reason', async () => {
      // Arrange
      mockPermissions.hasPermission.mockReturnValue(true);
      mockRepository.getTaskInstanceById.mockResolvedValue(existingTask);
      
      const skippedTask: TaskInstance = {
        ...existingTask,
        status: 'SKIPPED',
        skippedAt: new Date(),
        skippedBy: mockContext.userId,
        skipReason,
        skipNote,
      };
      mockRepository.updateTaskInstance.mockResolvedValue(skippedTask);

      // Act
      const result = await service.skipTask(taskId, skipReason, skipNote, mockContext);

      // Assert
      expect(mockPermissions.hasPermission).toHaveBeenCalledWith(mockContext, 'tasks:skip');
      expect(mockRepository.updateTaskInstance).toHaveBeenCalledWith(
        taskId,
        expect.objectContaining({
          status: 'SKIPPED',
          skippedAt: expect.any(Date),
          skippedBy: mockContext.userId,
          skipReason,
          skipNote,
        }),
        mockContext.userId
      );
      expect(result.status).toBe('SKIPPED');
    });

    it('should throw error when trying to skip completed task', async () => {
      // Arrange
      const completedTask = { ...existingTask, status: 'COMPLETED' as TaskStatus };
      mockRepository.getTaskInstanceById.mockResolvedValue(completedTask);

      // Act & Assert
      await expect(service.skipTask(taskId, skipReason, skipNote, mockContext))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('createProgressNote', () => {
    const noteInput: CreateProgressNoteInput = {
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

    it('should create a progress note', async () => {
      // Arrange
      mockPermissions.hasPermission.mockReturnValue(true);
      const createdNote: ProgressNote = {
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

      // Act
      const result = await service.createProgressNote(noteInput, mockContext);

      // Assert
      expect(mockPermissions.hasPermission).toHaveBeenCalledWith(mockContext, 'progress-notes:create');
      expect(mockRepository.createProgressNote).toHaveBeenCalledWith(
        expect.objectContaining({
          carePlanId: noteInput.carePlanId,
          clientId: noteInput.clientId,
          noteType: noteInput.noteType,
          content: noteInput.content,
          goalProgress: noteInput.goalProgress,
          observations: expect.arrayContaining([
            expect.objectContaining({
              category: 'PHYSICAL',
              observation: 'Client appeared more energetic today',
              severity: 'NORMAL',
              timestamp: expect.any(Date),
            })
          ]),
          authorId: mockContext.userId,
          authorName: expect.any(String),
          authorRole: expect.any(String),
          noteDate: expect.any(Date),
        })
      );
      expect(result.authorId).toBe(mockContext.userId);
    });

    it('should throw error without create permission', async () => {
      // Arrange
      mockPermissions.hasPermission.mockImplementationOnce(() => false);

      // Act & Assert
      await expect(service.createProgressNote(noteInput, mockContext))
        .rejects.toThrow(PermissionError);
      expect(mockRepository.createProgressNote).not.toHaveBeenCalled();
      expect(mockPermissions.hasPermission).toHaveBeenCalledWith(mockContext, 'progress-notes:create');
    });
  });

  describe('getCarePlanAnalytics', () => {
    it('should calculate analytics for organization', async () => {
      // Arrange
      const organizationId = mockContext.organizationId;
      mockPermissions.hasPermission.mockReturnValue(true);
      
      const mockPlans = {
        items: [
          {
            id: 'plan-1',
            status: 'ACTIVE' as CarePlanStatus,
            goals: [{ 
              id: 'goal-1',
              name: 'Goal 1',
              description: 'Test goal',
              category: 'MOBILITY' as GoalCategory,
              status: 'ACHIEVED' as GoalStatus,
              priority: 'MEDIUM' as Priority
            }],
            expirationDate: new Date('2024-12-31'),
            complianceStatus: 'COMPLIANT' as ComplianceStatus,
            clientId: 'client-1',
            organizationId: 'org-1',
            planNumber: 'CP-001',
            name: 'Plan 1',
            planType: 'PERSONAL_CARE' as CarePlanType,
            priority: 'MEDIUM' as Priority,
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
            status: 'DRAFT' as CarePlanStatus,
            goals: [{ 
              id: 'goal-2',
              name: 'Goal 2',
              description: 'Test goal 2',
              category: 'MOBILITY' as GoalCategory,
              status: 'IN_PROGRESS' as GoalStatus,
              priority: 'MEDIUM' as Priority
            }],
            expirationDate: new Date('2024-06-30'),
            complianceStatus: 'PENDING_REVIEW' as ComplianceStatus,
            clientId: 'client-2',
            organizationId: 'org-1',
            planNumber: 'CP-002',
            name: 'Plan 2',
            planType: 'PERSONAL_CARE' as CarePlanType,
            priority: 'MEDIUM' as Priority,
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

      const mockTaskMetrics: TaskCompletionMetrics = {
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

      // Mock the private method by spying on the service
      vi.spyOn(service as any, 'getTaskCompletionMetrics').mockResolvedValue(mockTaskMetrics);

      // Act
      const result = await service.getCarePlanAnalytics(organizationId, mockContext);

      // Assert
      expect(mockPermissions.hasPermission).toHaveBeenCalledWith(mockContext, 'analytics:read');
      expect(mockRepository.searchCarePlans).toHaveBeenCalledWith(
        { organizationId },
        { page: 1, limit: 10000 }
      );
      
      expect(result).toEqual({
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

  describe('deleteCarePlan', () => {
    it('should delete a non-active care plan', async () => {
      // Arrange
      const carePlanId = uuid();
      const draftCarePlan: CarePlan = {
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

      // Act
      await service.deleteCarePlan(carePlanId, mockContext);

      // Assert
      expect(mockPermissions.hasPermission).toHaveBeenCalledWith(mockContext, 'care-plans:delete');
      expect(mockRepository.deleteCarePlan).toHaveBeenCalledWith(carePlanId, mockContext.userId);
    });

    it('should throw error when trying to delete active care plan', async () => {
      // Arrange
      const carePlanId = uuid();
      const activeCarePlan: CarePlan = {
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

      // Act & Assert
      await expect(service.deleteCarePlan(carePlanId, mockContext))
        .rejects.toThrow(ValidationError);
      expect(mockRepository.deleteCarePlan).not.toHaveBeenCalled();
    });
  });
});