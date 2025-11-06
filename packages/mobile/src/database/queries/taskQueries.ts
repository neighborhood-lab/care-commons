/**
 * Task Queries - WatermelonDB query helpers for tasks
 *
 * Provides optimized queries for:
 * - Tasks by visit
 * - Tasks by status
 * - Required vs optional tasks
 * - Incomplete tasks
 */

import { Q, Query } from '@nozbe/watermelondb';
import type { Database, Model } from '@nozbe/watermelondb';

/**
 * Task model interface (placeholder - should match actual Task model)
 */
export interface Task extends Model {
  visitId: string;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
  completedAt: Date | null;
  order: number;
  syncPending: boolean;
}

/**
 * Get all tasks for a visit
 */
export function getTasksByVisit(
  database: Database,
  visitId: string
): Query<Task> {
  return database.collections
    .get<Task>('tasks')
    .query(
      Q.where('visit_id', visitId),
      Q.sortBy('order', Q.asc)
    );
}

/**
 * Get required tasks for a visit
 */
export function getRequiredTasks(
  database: Database,
  visitId: string
): Query<Task> {
  return database.collections
    .get<Task>('tasks')
    .query(
      Q.where('visit_id', visitId),
      Q.where('required', true),
      Q.sortBy('order', Q.asc)
    );
}

/**
 * Get optional tasks for a visit
 */
export function getOptionalTasks(
  database: Database,
  visitId: string
): Query<Task> {
  return database.collections
    .get<Task>('tasks')
    .query(
      Q.where('visit_id', visitId),
      Q.where('required', false),
      Q.sortBy('order', Q.asc)
    );
}

/**
 * Get incomplete tasks for a visit
 */
export function getIncompleteTasks(
  database: Database,
  visitId: string
): Query<Task> {
  return database.collections
    .get<Task>('tasks')
    .query(
      Q.where('visit_id', visitId),
      Q.where('completed', false),
      Q.sortBy('order', Q.asc)
    );
}

/**
 * Get incomplete required tasks for a visit
 */
export function getIncompleteRequiredTasks(
  database: Database,
  visitId: string
): Query<Task> {
  return database.collections
    .get<Task>('tasks')
    .query(
      Q.where('visit_id', visitId),
      Q.where('required', true),
      Q.where('completed', false),
      Q.sortBy('order', Q.asc)
    );
}

/**
 * Get completed tasks for a visit
 */
export function getCompletedTasks(
  database: Database,
  visitId: string
): Query<Task> {
  return database.collections
    .get<Task>('tasks')
    .query(
      Q.where('visit_id', visitId),
      Q.where('completed', true),
      Q.sortBy('completed_at', Q.desc)
    );
}

/**
 * Get tasks by status
 */
export function getTasksByStatus(
  database: Database,
  visitId: string,
  completed: boolean
): Query<Task> {
  return database.collections
    .get<Task>('tasks')
    .query(
      Q.where('visit_id', visitId),
      Q.where('completed', completed),
      Q.sortBy('order', Q.asc)
    );
}

/**
 * Get task completion statistics for a visit
 */
export async function getTaskCompletionStats(
  database: Database,
  visitId: string
): Promise<{
  totalTasks: number;
  completedTasks: number;
  requiredTasks: number;
  completedRequiredTasks: number;
  optionalTasks: number;
  completedOptionalTasks: number;
  percentComplete: number;
  percentRequiredComplete: number;
}> {
  const tasks = await database.collections
    .get<Task>('tasks')
    .query(Q.where('visit_id', visitId))
    .fetch();

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const requiredTasks = tasks.filter(t => t.required).length;
  const completedRequiredTasks = tasks.filter(t => t.required && t.completed).length;
  const optionalTasks = tasks.filter(t => !t.required).length;
  const completedOptionalTasks = tasks.filter(t => !t.required && t.completed).length;

  const percentComplete = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const percentRequiredComplete = requiredTasks > 0 ? (completedRequiredTasks / requiredTasks) * 100 : 100;

  return {
    totalTasks,
    completedTasks,
    requiredTasks,
    completedRequiredTasks,
    optionalTasks,
    completedOptionalTasks,
    percentComplete,
    percentRequiredComplete,
  };
}

/**
 * Check if all required tasks are completed
 */
export async function areRequiredTasksComplete(
  database: Database,
  visitId: string
): Promise<boolean> {
  const incompleteRequired = await database.collections
    .get<Task>('tasks')
    .query(
      Q.where('visit_id', visitId),
      Q.where('required', true),
      Q.where('completed', false)
    )
    .fetchCount();

  return incompleteRequired === 0;
}

/**
 * Get tasks pending sync
 */
export function getTasksPendingSync(database: Database): Query<Task> {
  return database.collections
    .get<Task>('tasks')
    .query(
      Q.where('sync_pending', true),
      Q.sortBy('order', Q.asc)
    );
}

/**
 * Get a single task by ID
 */
export async function getTaskById(
  database: Database,
  taskId: string
): Promise<Task | null> {
  try {
    const task = await database.collections
      .get<Task>('tasks')
      .find(taskId);
    return task;
  } catch {
    return null;
  }
}

/**
 * Search tasks by text
 */
export function searchTasks(
  database: Database,
  visitId: string,
  searchText: string
): Query<Task> {
  const searchLower = searchText.toLowerCase();

  return database.collections
    .get<Task>('tasks')
    .query(
      Q.where('visit_id', visitId),
      Q.or(
        Q.where('title', Q.like(`%${Q.sanitizeLikeString(searchLower)}%`)),
        Q.where('description', Q.like(`%${Q.sanitizeLikeString(searchLower)}%`))
      ),
      Q.sortBy('order', Q.asc)
    );
}

/**
 * Get recently completed tasks across all visits
 */
export function getRecentlyCompletedTasks(
  database: Database,
  limit: number = 10
): Query<Task> {
  return database.collections
    .get<Task>('tasks')
    .query(
      Q.where('completed', true),
      Q.sortBy('completed_at', Q.desc),
      Q.take(limit)
    );
}
