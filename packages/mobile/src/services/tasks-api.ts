/**
 * Tasks API Service
 *
 * Handles communication with the Care Plans Tasks API for mobile app:
 * - Fetch tasks for visits
 * - Complete tasks
 * - Skip tasks
 * - Report task issues
 */

import { getApiClient } from './api-client.js';
import type { UUID } from '../shared/index.js';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETE' | 'SKIPPED' | 'NOT_APPLICABLE';
export type TaskCategory =
  | 'ADL'
  | 'IADL'
  | 'HEALTH_MONITORING'
  | 'MEDICATION'
  | 'MEAL_PREPARATION'
  | 'PERSONAL_HYGIENE'
  | 'MOBILITY'
  | 'DOCUMENTATION'
  | 'OTHER';

export interface Task {
  id: UUID;
  carePlanId: UUID;
  visitId: UUID;
  clientId: UUID;
  category: TaskCategory;
  name: string;
  description: string;
  isRequired: boolean;
  status: TaskStatus;
  completedAt?: string;
  completedBy?: UUID;
  completedByNote?: string;
  skipReason?: string;
  photoUrls?: string[];
  estimatedDuration?: number; // minutes
  clientPreferences?: string;
  safetyConsiderations?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  requiresSignature?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompleteTaskInput {
  notes: string;
  photoUris?: string[];
  completedAt?: string;
}

export interface SkipTaskInput {
  reason: string;
  note?: string;
}

export interface TasksApiService {
  getTasksByVisitId(visitId: UUID): Promise<Task[]>;
  completeTask(taskId: UUID, input: CompleteTaskInput): Promise<Task>;
  skipTask(taskId: UUID, input: SkipTaskInput): Promise<Task>;
  reportTaskIssue(taskId: UUID, issueDescription: string): Promise<Task>;
}

/**
 * Create tasks API service instance
 */
export function createTasksApiService(): TasksApiService {
  const apiClient = getApiClient();

  return {
    /**
     * Get all tasks for a visit
     */
    async getTasksByVisitId(visitId: UUID): Promise<Task[]> {
      const response = await apiClient.get<Task[]>(`/visits/${visitId}/tasks`);
      return response.data;
    },

    /**
     * Complete a task
     */
    async completeTask(taskId: UUID, input: CompleteTaskInput): Promise<Task> {
      const response = await apiClient.post<Task>(`/tasks/${taskId}/complete`, {
        notes: input.notes,
        photoUrls: input.photoUris || [],
        completedAt: input.completedAt || new Date().toISOString(),
      });
      return response.data;
    },

    /**
     * Skip a task
     */
    async skipTask(taskId: UUID, input: SkipTaskInput): Promise<Task> {
      const response = await apiClient.post<Task>(`/tasks/${taskId}/skip`, {
        reason: input.reason,
        note: input.note,
      });
      return response.data;
    },

    /**
     * Report an issue with a task
     */
    async reportTaskIssue(taskId: UUID, issueDescription: string): Promise<Task> {
      const response = await apiClient.post<Task>(`/tasks/${taskId}/report-issue`, {
        issueDescription,
      });
      return response.data;
    },
  };
}

/**
 * Singleton instance
 */
let tasksApiServiceInstance: TasksApiService | null = null;

export function getTasksApiService(): TasksApiService {
  if (!tasksApiServiceInstance) {
    tasksApiServiceInstance = createTasksApiService();
  }
  return tasksApiServiceInstance;
}
