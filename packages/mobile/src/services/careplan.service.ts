/**
 * Care Plan Service - Offline-first care plan access for mobile
 *
 * Provides offline access to care plans and tasks for caregivers.
 * Pre-syncs care plans before visits to ensure availability in areas
 * with poor connectivity.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Simplified mobile types based on backend care-plan types
export type CarePlanStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'ON_HOLD' | 'EXPIRED' | 'DISCONTINUED' | 'COMPLETED';
export type CarePlanType = 'PERSONAL_CARE' | 'COMPANION' | 'SKILLED_NURSING' | 'THERAPY' | 'HOSPICE' | 'RESPITE' | 'LIVE_IN' | 'CUSTOM';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type GoalStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'ON_TRACK' | 'AT_RISK' | 'ACHIEVED' | 'PARTIALLY_ACHIEVED' | 'NOT_ACHIEVED' | 'DISCONTINUED';
export type TaskStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'MISSED' | 'CANCELLED' | 'ISSUE_REPORTED';
export type TaskCategory = 'PERSONAL_HYGIENE' | 'BATHING' | 'DRESSING' | 'GROOMING' | 'TOILETING' | 'MOBILITY' | 'TRANSFERRING' | 'AMBULATION' | 'MEDICATION' | 'MEAL_PREPARATION' | 'FEEDING' | 'HOUSEKEEPING' | 'LAUNDRY' | 'SHOPPING' | 'TRANSPORTATION' | 'COMPANIONSHIP' | 'MONITORING' | 'DOCUMENTATION' | 'OTHER';
export type GoalCategory = 'MOBILITY' | 'ADL' | 'IADL' | 'NUTRITION' | 'MEDICATION_MANAGEMENT' | 'SAFETY' | 'SOCIAL_ENGAGEMENT' | 'COGNITIVE' | 'EMOTIONAL_WELLBEING' | 'PAIN_MANAGEMENT' | 'WOUND_CARE' | 'CHRONIC_DISEASE_MANAGEMENT' | 'OTHER';
export type AllergySeverity = 'MILD' | 'MODERATE' | 'SEVERE' | 'LIFE_THREATENING';

export interface MobileCarePlanGoal {
  id: string;
  name: string;
  description: string;
  category: GoalCategory;
  status: GoalStatus;
  priority: Priority;
  targetDate?: string;
  progressPercentage?: number;
}

export interface MobileTask {
  id: string;
  name: string;
  description: string;
  category: TaskCategory;
  instructions: string;
  status: TaskStatus;
  estimatedDuration?: number; // minutes
  requiresSignature: boolean;
  requiresNote: boolean;
  requiresPhoto?: boolean;
  isOptional: boolean;
  completedAt?: string;
  completedBy?: string;
  completionNote?: string;
}

export interface MobileAllergy {
  id: string;
  allergen: string;
  reaction: string;
  severity: AllergySeverity;
}

export interface MobileCarePlan {
  id: string;
  clientId: string;
  clientName: string;
  planNumber: string;
  name: string;
  planType: CarePlanType;
  status: CarePlanStatus;
  priority: Priority;
  effectiveDate: string;
  expirationDate?: string;

  // Care summary
  assessmentSummary?: string;
  medicalDiagnosis?: string[];
  functionalLimitations?: string[];

  // Safety critical info
  allergies?: MobileAllergy[];
  restrictions?: string[];
  precautions?: string[];

  // Goals and tasks
  goals: MobileCarePlanGoal[];
  tasks: MobileTask[];

  // Care team
  coordinatorName?: string;
  coordinatorPhone?: string;
  physicianName?: string;
  physicianPhone?: string;

  // Sync info
  lastSyncedAt: string;
  isSynced: boolean;
}

export interface CarePlanSyncStatus {
  lastSyncAt: string | null;
  pendingSync: number;
  totalPlans: number;
  syncInProgress: boolean;
  syncError: string | null;
}

const STORAGE_KEYS = {
  CARE_PLANS: '@folkcare/care_plans',
  SYNC_STATUS: '@folkcare/care_plan_sync_status',
  TASK_COMPLETIONS: '@folkcare/task_completions',
};

class CarePlanService {
  private carePlans: MobileCarePlan[] = [];
  private taskCompletions: Map<string, Partial<MobileTask>> = new Map();
  private syncStatus: CarePlanSyncStatus = {
    lastSyncAt: null,
    pendingSync: 0,
    totalPlans: 0,
    syncInProgress: false,
    syncError: null,
  };

  async initialize(): Promise<void> {
    await this.loadFromStorage();
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const [plansJson, statusJson, completionsJson] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.CARE_PLANS),
        AsyncStorage.getItem(STORAGE_KEYS.SYNC_STATUS),
        AsyncStorage.getItem(STORAGE_KEYS.TASK_COMPLETIONS),
      ]);

      if (plansJson) {
        this.carePlans = JSON.parse(plansJson);
      }

      if (statusJson) {
        this.syncStatus = JSON.parse(statusJson);
      }

      if (completionsJson) {
        const completions = JSON.parse(completionsJson);
        this.taskCompletions = new Map(Object.entries(completions));
      }
    } catch (error) {
      console.error('[CarePlanService] Error loading from storage:', error);
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.CARE_PLANS, JSON.stringify(this.carePlans)),
        AsyncStorage.setItem(STORAGE_KEYS.SYNC_STATUS, JSON.stringify(this.syncStatus)),
        AsyncStorage.setItem(
          STORAGE_KEYS.TASK_COMPLETIONS,
          JSON.stringify(Object.fromEntries(this.taskCompletions))
        ),
      ]);
    } catch (error) {
      console.error('[CarePlanService] Error saving to storage:', error);
    }
  }

  /**
   * Get all care plans for a client
   */
  async getCarePlansForClient(clientId: string): Promise<MobileCarePlan[]> {
    return this.carePlans.filter(
      (plan) => plan.clientId === clientId && plan.status === 'ACTIVE'
    );
  }

  /**
   * Get a specific care plan by ID
   */
  async getCarePlan(carePlanId: string): Promise<MobileCarePlan | null> {
    return this.carePlans.find((plan) => plan.id === carePlanId) || null;
  }

  /**
   * Get tasks for a specific care plan
   */
  async getTasksForCarePlan(carePlanId: string): Promise<MobileTask[]> {
    const plan = await this.getCarePlan(carePlanId);
    return plan?.tasks || [];
  }

  /**
   * Get active tasks for today's visit
   */
  async getTodaysTasks(clientId: string): Promise<MobileTask[]> {
    const plans = await this.getCarePlansForClient(clientId);
    const allTasks: MobileTask[] = [];

    for (const plan of plans) {
      const pendingTasks = plan.tasks.filter(
        (task) => task.status === 'SCHEDULED' || task.status === 'IN_PROGRESS'
      );
      allTasks.push(...pendingTasks);
    }

    return allTasks;
  }

  /**
   * Mark a task as completed
   */
  async completeTask(
    taskId: string,
    carePlanId: string,
    completion: {
      note?: string;
      signature?: string;
      completedBy: string;
    }
  ): Promise<MobileTask | null> {
    const planIndex = this.carePlans.findIndex((p) => p.id === carePlanId);
    if (planIndex === -1) return null;

    const taskIndex = this.carePlans[planIndex].tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return null;

    const now = new Date().toISOString();
    const updatedTask: MobileTask = {
      ...this.carePlans[planIndex].tasks[taskIndex],
      status: 'COMPLETED',
      completedAt: now,
      completedBy: completion.completedBy,
      completionNote: completion.note,
    };

    this.carePlans[planIndex].tasks[taskIndex] = updatedTask;
    this.carePlans[planIndex].isSynced = false;

    // Store completion for later sync
    this.taskCompletions.set(taskId, {
      id: taskId,
      status: 'COMPLETED',
      completedAt: now,
      completedBy: completion.completedBy,
      completionNote: completion.note,
    });

    this.syncStatus.pendingSync += 1;

    await this.saveToStorage();

    return updatedTask;
  }

  /**
   * Skip a task with reason
   */
  async skipTask(
    taskId: string,
    carePlanId: string,
    reason: string,
    skippedBy: string
  ): Promise<MobileTask | null> {
    const planIndex = this.carePlans.findIndex((p) => p.id === carePlanId);
    if (planIndex === -1) return null;

    const taskIndex = this.carePlans[planIndex].tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return null;

    const task = this.carePlans[planIndex].tasks[taskIndex];
    if (!task.isOptional) {
      console.warn('[CarePlanService] Cannot skip required task:', taskId);
      return null;
    }

    const now = new Date().toISOString();
    const updatedTask: MobileTask = {
      ...task,
      status: 'SKIPPED',
      completedAt: now,
      completedBy: skippedBy,
      completionNote: `Skipped: ${reason}`,
    };

    this.carePlans[planIndex].tasks[taskIndex] = updatedTask;
    this.carePlans[planIndex].isSynced = false;

    this.taskCompletions.set(taskId, {
      id: taskId,
      status: 'SKIPPED',
      completedAt: now,
      completedBy: skippedBy,
      completionNote: `Skipped: ${reason}`,
    });

    this.syncStatus.pendingSync += 1;

    await this.saveToStorage();

    return updatedTask;
  }

  /**
   * Pre-sync care plans for upcoming visits
   */
  async preSyncForVisit(clientId: string, _visitDate: string): Promise<boolean> {
    // In production, this would fetch from API
    // For now, we ensure mock data is available
    this.syncStatus.syncInProgress = true;
    await this.saveToStorage();

    try {
      // Check if we already have plans for this client
      const existingPlans = await this.getCarePlansForClient(clientId);

      if (existingPlans.length === 0) {
        // Load mock care plan for demo
        const mockPlan = this.createMockCarePlan(clientId);
        this.carePlans.push(mockPlan);
      }

      this.syncStatus.lastSyncAt = new Date().toISOString();
      this.syncStatus.totalPlans = this.carePlans.length;
      this.syncStatus.syncInProgress = false;
      this.syncStatus.syncError = null;

      await this.saveToStorage();
      return true;
    } catch (error) {
      this.syncStatus.syncInProgress = false;
      this.syncStatus.syncError = error instanceof Error ? error.message : 'Unknown error';
      await this.saveToStorage();
      return false;
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus(): CarePlanSyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Force sync all pending changes
   */
  async syncPendingChanges(): Promise<{ synced: number; failed: number }> {
    // In production, this would push completions to API
    const pending = this.taskCompletions.size;

    // Simulate sync
    this.taskCompletions.clear();
    this.syncStatus.pendingSync = 0;
    this.syncStatus.lastSyncAt = new Date().toISOString();

    // Mark all plans as synced
    this.carePlans = this.carePlans.map((plan) => ({
      ...plan,
      isSynced: true,
      lastSyncedAt: new Date().toISOString(),
    }));

    await this.saveToStorage();

    return { synced: pending, failed: 0 };
  }

  /**
   * Get critical safety info for a client (allergies, restrictions, precautions)
   */
  async getSafetyInfo(clientId: string): Promise<{
    allergies: MobileAllergy[];
    restrictions: string[];
    precautions: string[];
  }> {
    const plans = await this.getCarePlansForClient(clientId);

    const allergies: MobileAllergy[] = [];
    const restrictions: string[] = [];
    const precautions: string[] = [];

    for (const plan of plans) {
      if (plan.allergies) {
        allergies.push(...plan.allergies);
      }
      if (plan.restrictions) {
        restrictions.push(...plan.restrictions);
      }
      if (plan.precautions) {
        precautions.push(...plan.precautions);
      }
    }

    // Deduplicate
    return {
      allergies: allergies.filter(
        (a, i, arr) => arr.findIndex((x) => x.allergen === a.allergen) === i
      ),
      restrictions: [...new Set(restrictions)],
      precautions: [...new Set(precautions)],
    };
  }

  /**
   * Clear all cached care plans
   */
  async clearCache(): Promise<void> {
    this.carePlans = [];
    this.taskCompletions.clear();
    this.syncStatus = {
      lastSyncAt: null,
      pendingSync: 0,
      totalPlans: 0,
      syncInProgress: false,
      syncError: null,
    };

    await AsyncStorage.multiRemove([
      STORAGE_KEYS.CARE_PLANS,
      STORAGE_KEYS.SYNC_STATUS,
      STORAGE_KEYS.TASK_COMPLETIONS,
    ]);
  }

  // Helper to create mock care plan for demo
  private createMockCarePlan(clientId: string): MobileCarePlan {
    return {
      id: `cp-${Date.now()}`,
      clientId,
      clientName: 'Dorothy Chen',
      planNumber: 'CP-2025-001',
      name: 'Personal Care Plan',
      planType: 'PERSONAL_CARE',
      status: 'ACTIVE',
      priority: 'MEDIUM',
      effectiveDate: new Date().toISOString(),
      expirationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),

      assessmentSummary:
        'Client requires assistance with ADLs due to limited mobility following hip replacement surgery.',
      medicalDiagnosis: ['Post-surgical recovery', 'Hypertension', 'Type 2 Diabetes'],
      functionalLimitations: ['Limited mobility', 'Cannot stand for extended periods'],

      allergies: [
        {
          id: 'allergy-1',
          allergen: 'Penicillin',
          reaction: 'Hives and swelling',
          severity: 'SEVERE',
        },
        {
          id: 'allergy-2',
          allergen: 'Shellfish',
          reaction: 'Anaphylaxis risk',
          severity: 'LIFE_THREATENING',
        },
      ],

      restrictions: ['No lifting over 10 lbs', 'Must use walker for ambulation'],
      precautions: ['Fall risk - use gait belt', 'Monitor blood sugar before meals'],

      goals: [
        {
          id: 'goal-1',
          name: 'Improve Mobility',
          description: 'Client will walk 50 feet with walker independently',
          category: 'MOBILITY',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          progressPercentage: 60,
        },
        {
          id: 'goal-2',
          name: 'ADL Independence',
          description: 'Client will complete morning hygiene routine with minimal assistance',
          category: 'ADL',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          progressPercentage: 40,
        },
      ],

      tasks: [
        {
          id: 'task-1',
          name: 'Assist with bathing',
          description: 'Help client with bed bath or shower as tolerated',
          category: 'BATHING',
          instructions:
            '1. Gather supplies\n2. Check water temperature\n3. Assist with bathing\n4. Apply moisturizer',
          status: 'SCHEDULED',
          estimatedDuration: 30,
          requiresSignature: true,
          requiresNote: true,
          isOptional: false,
        },
        {
          id: 'task-2',
          name: 'Medication reminder',
          description: 'Remind client to take morning medications',
          category: 'MEDICATION',
          instructions:
            'Verify medications with MAR. Do not administer - remind client to self-administer.',
          status: 'SCHEDULED',
          estimatedDuration: 5,
          requiresSignature: false,
          requiresNote: true,
          isOptional: false,
        },
        {
          id: 'task-3',
          name: 'Prepare breakfast',
          description: 'Prepare diabetic-friendly breakfast',
          category: 'MEAL_PREPARATION',
          instructions:
            'Check blood sugar before meal. Prepare low-sugar, balanced meal per dietary plan.',
          status: 'SCHEDULED',
          estimatedDuration: 20,
          requiresSignature: false,
          requiresNote: false,
          isOptional: false,
        },
        {
          id: 'task-4',
          name: 'Ambulation exercise',
          description: 'Assist with walking using walker',
          category: 'AMBULATION',
          instructions:
            '1. Apply gait belt\n2. Stand from chair\n3. Walk 25-50 feet\n4. Rest as needed\n5. Return to chair',
          status: 'SCHEDULED',
          estimatedDuration: 15,
          requiresSignature: false,
          requiresNote: true,
          requiresPhoto: false,
          isOptional: true,
        },
        {
          id: 'task-5',
          name: 'Light housekeeping',
          description: 'Clean bedroom and bathroom surfaces',
          category: 'HOUSEKEEPING',
          instructions: 'Wipe surfaces, empty trash, change linens if needed',
          status: 'SCHEDULED',
          estimatedDuration: 20,
          requiresSignature: false,
          requiresNote: false,
          isOptional: true,
        },
      ],

      coordinatorName: 'Maria Santos',
      coordinatorPhone: '(512) 555-0300',
      physicianName: 'Dr. Sarah Williams',
      physicianPhone: '(512) 555-0200',

      lastSyncedAt: new Date().toISOString(),
      isSynced: true,
    };
  }

  // Status helpers
  getTaskStatusInfo(status: TaskStatus): { label: string; color: string; icon: string } {
    switch (status) {
      case 'SCHEDULED':
        return { label: 'Scheduled', color: '#6B7280', icon: '📋' };
      case 'IN_PROGRESS':
        return { label: 'In Progress', color: '#3B82F6', icon: '🔄' };
      case 'COMPLETED':
        return { label: 'Completed', color: '#10B981', icon: '✅' };
      case 'SKIPPED':
        return { label: 'Skipped', color: '#F59E0B', icon: '⏭️' };
      case 'MISSED':
        return { label: 'Missed', color: '#EF4444', icon: '❌' };
      case 'CANCELLED':
        return { label: 'Cancelled', color: '#9CA3AF', icon: '🚫' };
      case 'ISSUE_REPORTED':
        return { label: 'Issue', color: '#DC2626', icon: '⚠️' };
      default:
        return { label: 'Unknown', color: '#6B7280', icon: '❓' };
    }
  }

  getGoalStatusInfo(status: GoalStatus): { label: string; color: string } {
    switch (status) {
      case 'NOT_STARTED':
        return { label: 'Not Started', color: '#6B7280' };
      case 'IN_PROGRESS':
        return { label: 'In Progress', color: '#3B82F6' };
      case 'ON_TRACK':
        return { label: 'On Track', color: '#10B981' };
      case 'AT_RISK':
        return { label: 'At Risk', color: '#F59E0B' };
      case 'ACHIEVED':
        return { label: 'Achieved', color: '#059669' };
      case 'PARTIALLY_ACHIEVED':
        return { label: 'Partial', color: '#6366F1' };
      case 'NOT_ACHIEVED':
        return { label: 'Not Achieved', color: '#EF4444' };
      case 'DISCONTINUED':
        return { label: 'Discontinued', color: '#9CA3AF' };
      default:
        return { label: 'Unknown', color: '#6B7280' };
    }
  }

  getAllergySeverityInfo(severity: AllergySeverity): { label: string; color: string; bgColor: string } {
    switch (severity) {
      case 'MILD':
        return { label: 'Mild', color: '#059669', bgColor: '#D1FAE5' };
      case 'MODERATE':
        return { label: 'Moderate', color: '#D97706', bgColor: '#FEF3C7' };
      case 'SEVERE':
        return { label: 'Severe', color: '#DC2626', bgColor: '#FEE2E2' };
      case 'LIFE_THREATENING':
        return { label: 'LIFE THREATENING', color: '#7F1D1D', bgColor: '#FCA5A5' };
      default:
        return { label: 'Unknown', color: '#6B7280', bgColor: '#F3F4F6' };
    }
  }

  getCategoryIcon(category: TaskCategory): string {
    const icons: Record<TaskCategory, string> = {
      PERSONAL_HYGIENE: '🧴',
      BATHING: '🛁',
      DRESSING: '👔',
      GROOMING: '💇',
      TOILETING: '🚽',
      MOBILITY: '🚶',
      TRANSFERRING: '🔄',
      AMBULATION: '🚶‍♂️',
      MEDICATION: '💊',
      MEAL_PREPARATION: '🍳',
      FEEDING: '🍽️',
      HOUSEKEEPING: '🧹',
      LAUNDRY: '🧺',
      SHOPPING: '🛒',
      TRANSPORTATION: '🚗',
      COMPANIONSHIP: '💬',
      MONITORING: '📊',
      DOCUMENTATION: '📝',
      OTHER: '📋',
    };
    return icons[category] || '📋';
  }
}

// Export singleton instance
export const carePlanService = new CarePlanService();
