/**
 * Visit Queries - WatermelonDB query helpers for visits
 *
 * Provides optimized queries for:
 * - Today's visits
 * - Upcoming visits
 * - Past visits
 * - Visits by client
 * - Visits by status
 * - Date range queries
 */

import { Q, Query } from '@nozbe/watermelondb';
import type { Database } from '@nozbe/watermelondb';
import type { Visit } from '../models/Visit.js';
import { startOfDay, endOfDay, subDays } from 'date-fns';

/**
 * Get today's visits for the current caregiver
 */
export function getTodayVisits(
  database: Database,
  caregiverId: string
): Query<Visit> {
  const today = new Date();
  const startOfToday = startOfDay(today);
  const endOfToday = endOfDay(today);

  return database.collections
    .get<Visit>('visits')
    .query(
      Q.where('caregiver_id', caregiverId),
      Q.where('scheduled_start_time', Q.gte(startOfToday.getTime())),
      Q.where('scheduled_start_time', Q.lte(endOfToday.getTime())),
      Q.sortBy('scheduled_start_time', Q.asc)
    );
}

/**
 * Get upcoming visits (future dates)
 */
export function getUpcomingVisits(
  database: Database,
  caregiverId: string,
  daysAhead: number = 7
): Query<Visit> {
  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setDate(futureDate.getDate() + daysAhead);

  return database.collections
    .get<Visit>('visits')
    .query(
      Q.where('caregiver_id', caregiverId),
      Q.where('scheduled_start_time', Q.gt(now.getTime())),
      Q.where('scheduled_start_time', Q.lte(futureDate.getTime())),
      Q.sortBy('scheduled_start_time', Q.asc)
    );
}

/**
 * Get past visits (completed visits)
 */
export function getPastVisits(
  database: Database,
  caregiverId: string,
  daysBack: number = 30
): Query<Visit> {
  const now = new Date();
  const pastDate = subDays(now, daysBack);

  return database.collections
    .get<Visit>('visits')
    .query(
      Q.where('caregiver_id', caregiverId),
      Q.where('status', 'COMPLETED'),
      Q.where('scheduled_start_time', Q.gte(pastDate.getTime())),
      Q.where('scheduled_start_time', Q.lte(now.getTime())),
      Q.sortBy('scheduled_start_time', Q.desc)
    );
}

/**
 * Get visits by client
 */
export function getVisitsByClient(
  database: Database,
  clientId: string,
  caregiverId?: string
): Query<Visit> {
  const conditions = [
    Q.where('client_id', clientId),
    Q.sortBy('scheduled_start_time', Q.desc),
  ];

  if (caregiverId) {
    conditions.unshift(Q.where('caregiver_id', caregiverId));
  }

  return database.collections.get<Visit>('visits').query(...conditions);
}

/**
 * Get visits by status
 */
export function getVisitsByStatus(
  database: Database,
  status: string,
  caregiverId: string
): Query<Visit> {
  return database.collections
    .get<Visit>('visits')
    .query(
      Q.where('caregiver_id', caregiverId),
      Q.where('status', status),
      Q.sortBy('scheduled_start_time', Q.desc)
    );
}

/**
 * Get visits in date range
 */
export function getVisitsInDateRange(
  database: Database,
  caregiverId: string,
  startDate: Date,
  endDate: Date
): Query<Visit> {
  return database.collections
    .get<Visit>('visits')
    .query(
      Q.where('caregiver_id', caregiverId),
      Q.where('scheduled_start_time', Q.gte(startDate.getTime())),
      Q.where('scheduled_start_time', Q.lte(endDate.getTime())),
      Q.sortBy('scheduled_start_time', Q.desc)
    );
}

/**
 * Get visits pending sync
 */
export function getVisitsPendingSync(database: Database): Query<Visit> {
  return database.collections
    .get<Visit>('visits')
    .query(
      Q.where('sync_pending', true),
      Q.sortBy('last_modified_at', Q.desc)
    );
}

/**
 * Get in-progress visits
 */
export function getInProgressVisits(
  database: Database,
  caregiverId: string
): Query<Visit> {
  return database.collections
    .get<Visit>('visits')
    .query(
      Q.where('caregiver_id', caregiverId),
      Q.where('status', 'IN_PROGRESS'),
      Q.sortBy('scheduled_start_time', Q.asc)
    );
}

/**
 * Get a single visit by ID
 */
export async function getVisitById(
  database: Database,
  visitId: string
): Promise<Visit | null> {
  try {
    const visit = await database.collections
      .get<Visit>('visits')
      .find(visitId);
    return visit;
  } catch {
    return null;
  }
}

/**
 * Search visits by text (client name, service type, address)
 */
export function searchVisits(
  database: Database,
  caregiverId: string,
  searchText: string
): Query<Visit> {
  const searchLower = searchText.toLowerCase();

  return database.collections
    .get<Visit>('visits')
    .query(
      Q.where('caregiver_id', caregiverId),
      Q.or(
        Q.where('client_name', Q.like(`%${Q.sanitizeLikeString(searchLower)}%`)),
        Q.where('service_type_name', Q.like(`%${Q.sanitizeLikeString(searchLower)}%`))
      ),
      Q.sortBy('scheduled_start_time', Q.desc)
    );
}

/**
 * Get count of visits by status
 */
export async function getVisitCountByStatus(
  database: Database,
  caregiverId: string,
  status: string
): Promise<number> {
  const count = await database.collections
    .get<Visit>('visits')
    .query(
      Q.where('caregiver_id', caregiverId),
      Q.where('status', status)
    )
    .fetchCount();

  return count;
}

/**
 * Get visits needing attention (overdue, pending documentation, etc.)
 */
export function getVisitsNeedingAttention(
  database: Database,
  caregiverId: string
): Query<Visit> {
  const now = new Date();

  return database.collections
    .get<Visit>('visits')
    .query(
      Q.where('caregiver_id', caregiverId),
      Q.or(
        // Overdue scheduled visits
        Q.and(
          Q.where('status', 'SCHEDULED'),
          Q.where('scheduled_start_time', Q.lt(now.getTime()))
        ),
        // In progress visits
        Q.where('status', 'IN_PROGRESS'),
        // Pending sync
        Q.where('sync_pending', true)
      ),
      Q.sortBy('scheduled_start_time', Q.asc)
    );
}
