/**
 * Global Search Routes
 * 
 * Provides unified search across all entities:
 * - Clients
 * - Caregivers
 * - Visits
 * - Care Plans
 * - Organizations
 * - Users
 */

import { Router, Request, Response, NextFunction } from 'express';
import {
  Database,
  UserContext,
  AuthMiddleware,
  logger,
} from '@care-commons/core';
import { z } from 'zod';

export function createSearchRouter(db: Database): Router {
  const router = Router();
  const authMiddleware = new AuthMiddleware(db);

// Search query schema
const SearchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  type: z.enum(['all', 'clients', 'caregivers', 'visits', 'care_plans', 'organizations', 'users']).optional().default('all'),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

interface SearchResult {
  type: 'client' | 'caregiver' | 'visit' | 'care_plan' | 'organization' | 'user';
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  metadata?: Record<string, unknown>;
  relevance: number;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  type: string;
  limit: number;
  offset: number;
}

/**
 * Search clients by name, email, phone, or MRN
 */
async function searchClients(
  db: Database,
  context: UserContext,
  query: string,
  limit: number,
  offset: number,
): Promise<SearchResult[]> {
  const searchPattern = `%${query.toLowerCase()}%`;
  
  const result = await db.query<{
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    mrn: string | null;
    date_of_birth: Date | null;
    status: string;
  }>(
    `SELECT id, first_name, last_name, email, phone, mrn, date_of_birth, status
     FROM clients
     WHERE organization_id = $1
       AND (
         LOWER(first_name) LIKE $2
         OR LOWER(last_name) LIKE $2
         OR LOWER(email) LIKE $2
         OR LOWER(phone) LIKE $2
         OR LOWER(mrn) LIKE $2
       )
     ORDER BY 
       CASE 
         WHEN LOWER(first_name) = LOWER($3) THEN 1
         WHEN LOWER(last_name) = LOWER($3) THEN 2
         WHEN LOWER(email) = LOWER($3) THEN 3
         ELSE 4
       END,
       last_name, first_name
     LIMIT $4 OFFSET $5`,
    [context.organizationId!, searchPattern, query, limit, offset]
  );

  return result.rows.map((row, index) => ({
    type: 'client' as const,
    id: row.id,
    title: `${row.first_name} ${row.last_name}`,
    subtitle: row.email ?? row.phone ?? undefined,
    description: row.mrn !== null ? `MRN: ${row.mrn}` : undefined,
    url: `/clients/${row.id}`,
    metadata: {
      dateOfBirth: row.date_of_birth,
      status: row.status,
    },
    relevance: 100 - index,
  }));
}

/**
 * Search caregivers by name, email, or phone
 */
async function searchCaregivers(
  db: Database,
  context: UserContext,
  query: string,
  limit: number,
  offset: number,
): Promise<SearchResult[]> {
  const searchPattern = `%${query.toLowerCase()}%`;
  
  const result = await db.query<{
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    employee_id: string | null;
    status: string;
    certifications: string[] | null;
  }>(
    `SELECT id, first_name, last_name, email, phone, employee_id, status, certifications
     FROM caregivers
     WHERE organization_id = $1
       AND (
         LOWER(first_name) LIKE $2
         OR LOWER(last_name) LIKE $2
         OR LOWER(email) LIKE $2
         OR LOWER(phone) LIKE $2
         OR LOWER(employee_id) LIKE $2
       )
     ORDER BY 
       CASE 
         WHEN LOWER(first_name) = LOWER($3) THEN 1
         WHEN LOWER(last_name) = LOWER($3) THEN 2
         ELSE 3
       END,
       last_name, first_name
     LIMIT $4 OFFSET $5`,
    [context.organizationId!, searchPattern, query, limit, offset]
  );

  return result.rows.map((row, index) => ({
    type: 'caregiver' as const,
    id: row.id,
    title: `${row.first_name} ${row.last_name}`,
    subtitle: row.employee_id !== null ? `Employee ID: ${row.employee_id}` : undefined,
    description: row.email ?? row.phone ?? undefined,
    url: `/caregivers/${row.id}`,
    metadata: {
      status: row.status,
      certifications: row.certifications ?? [],
    },
    relevance: 100 - index,
  }));
}

/**
 * Search visits by client or caregiver name
 */
async function searchVisits(
  db: Database,
  context: UserContext,
  query: string,
  limit: number,
  offset: number,
): Promise<SearchResult[]> {
  const searchPattern = `%${query.toLowerCase()}%`;
  
  const result = await db.query<{
    v_id: string;
    v_scheduled_start: Date;
    v_status: string;
    c_id: string;
    c_first_name: string;
    c_last_name: string;
    cg_id: string | null;
    cg_first_name: string | null;
    cg_last_name: string | null;
  }>(
    `SELECT 
       v.id as v_id,
       v.scheduled_start as v_scheduled_start,
       v.status as v_status,
       c.id as c_id,
       c.first_name as c_first_name,
       c.last_name as c_last_name,
       cg.id as cg_id,
       cg.first_name as cg_first_name,
       cg.last_name as cg_last_name
     FROM visits v
     INNER JOIN clients c ON v.client_id = c.id
     LEFT JOIN caregivers cg ON v.caregiver_id = cg.id
     WHERE v.organization_id = $1
       AND (
         LOWER(c.first_name) LIKE $2
         OR LOWER(c.last_name) LIKE $2
         OR LOWER(cg.first_name) LIKE $2
         OR LOWER(cg.last_name) LIKE $2
       )
     ORDER BY v.scheduled_start DESC
     LIMIT $3 OFFSET $4`,
    [context.organizationId!, searchPattern, limit, offset]
  );

  return result.rows.map((row, index) => ({
    type: 'visit' as const,
    id: row.v_id,
    title: `Visit with ${row.c_first_name} ${row.c_last_name}`,
    subtitle: (row.cg_first_name !== null && row.cg_last_name !== null)
      ? `Caregiver: ${row.cg_first_name} ${row.cg_last_name}`
      : 'Unassigned',
    description: `Scheduled: ${new Date(row.v_scheduled_start).toLocaleString()}`,
    url: `/visits/${row.v_id}`,
    metadata: {
      status: row.v_status,
      clientId: row.c_id,
      caregiverId: row.cg_id,
    },
    relevance: 100 - index,
  }));
}

/**
 * Search care plans by client name or plan name
 */
async function searchCarePlans(
  db: Database,
  context: UserContext,
  query: string,
  limit: number,
  offset: number,
): Promise<SearchResult[]> {
  const searchPattern = `%${query.toLowerCase()}%`;
  
  const result = await db.query<{
    cp_id: string;
    cp_plan_name: string;
    cp_status: string;
    cp_start_date: Date;
    c_id: string;
    c_first_name: string;
    c_last_name: string;
  }>(
    `SELECT 
       cp.id as cp_id,
       cp.plan_name as cp_plan_name,
       cp.status as cp_status,
       cp.start_date as cp_start_date,
       c.id as c_id,
       c.first_name as c_first_name,
       c.last_name as c_last_name
     FROM care_plans cp
     INNER JOIN clients c ON cp.client_id = c.id
     WHERE cp.organization_id = $1
       AND (
         LOWER(cp.plan_name) LIKE $2
         OR LOWER(c.first_name) LIKE $2
         OR LOWER(c.last_name) LIKE $2
       )
     ORDER BY cp.start_date DESC
     LIMIT $3 OFFSET $4`,
    [context.organizationId!, searchPattern, limit, offset]
  );

  return result.rows.map((row, index) => ({
    type: 'care_plan' as const,
    id: row.cp_id,
    title: row.cp_plan_name,
    subtitle: `Client: ${row.c_first_name} ${row.c_last_name}`,
    description: `Started: ${new Date(row.cp_start_date).toLocaleDateString()}`,
    url: `/care-plans/${row.cp_id}`,
    metadata: {
      status: row.cp_status,
      clientId: row.c_id,
    },
    relevance: 100 - index,
  }));
}

/**
 * Search organizations (admin only)
 */
async function searchOrganizations(
  db: Database,
  context: UserContext,
  query: string,
  limit: number,
  offset: number,
): Promise<SearchResult[]> {
  // Only allow for system admins
  if (context.roles.includes('admin') === false) {
    return [];
  }

  const searchPattern = `%${query.toLowerCase()}%`;
  
  const result = await db.query<{
    id: string;
    name: string;
    state_code: string;
    status: string;
    license_number: string | null;
  }>(
    `SELECT id, name, state_code, status, license_number
     FROM organizations
     WHERE LOWER(name) LIKE $1
        OR LOWER(state_code) LIKE $1
        OR LOWER(license_number) LIKE $1
     ORDER BY 
       CASE 
         WHEN LOWER(name) = LOWER($2) THEN 1
         ELSE 2
       END,
       name
     LIMIT $3 OFFSET $4`,
    [searchPattern, query, limit, offset]
  );

  return result.rows.map((row, index) => ({
    type: 'organization' as const,
    id: row.id,
    title: row.name,
    subtitle: `State: ${row.state_code}`,
    description: row.license_number !== null ? `License: ${row.license_number}` : undefined,
    url: `/organizations/${row.id}`,
    metadata: {
      status: row.status,
      stateCode: row.state_code,
    },
    relevance: 100 - index,
  }));
}

/**
 * Search users by name or email
 */
async function searchUsers(
  db: Database,
  context: UserContext,
  query: string,
  limit: number,
  offset: number,
): Promise<SearchResult[]> {
  const searchPattern = `%${query.toLowerCase()}%`;
  
  const result = await db.query<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    status: string;
  }>(
    `SELECT id, first_name, last_name, email, role, status
     FROM users
     WHERE organization_id = $1
       AND (
         LOWER(first_name) LIKE $2
         OR LOWER(last_name) LIKE $2
         OR LOWER(email) LIKE $2
       )
     ORDER BY 
       CASE 
         WHEN LOWER(email) = LOWER($3) THEN 1
         WHEN LOWER(first_name) = LOWER($3) THEN 2
         ELSE 3
       END,
       last_name, first_name
     LIMIT $4 OFFSET $5`,
    [context.organizationId!, searchPattern, query, limit, offset]
  );

  return result.rows.map((row, index) => ({
    type: 'user' as const,
    id: row.id,
    title: `${row.first_name} ${row.last_name}`,
    subtitle: row.email,
    description: `Role: ${row.role}`,
    url: `/users/${row.id}`,
    metadata: {
      role: row.role,
      status: row.status,
    },
    relevance: 100 - index,
  }));
}

/**
 * Global search endpoint
 * GET /api/search?q=john&type=all&limit=20&offset=0
 */
router.get(
  '/',
  authMiddleware.requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = SearchQuerySchema.parse(req.query);
      const context = res.locals.context as UserContext;

      logger.info({ query: query.q, type: query.type, userId: context.userId }, 'Global search request');

      let results: SearchResult[] = [];

      // Execute searches based on type
      if (query.type === 'all') {
        // Parallel search across all types
        const [clients, caregivers, visits, carePlans, organizations, users] = await Promise.all([
          searchClients(db, context, query.q, 5, 0),
          searchCaregivers(db, context, query.q, 5, 0),
          searchVisits(db, context, query.q, 5, 0),
          searchCarePlans(db, context, query.q, 5, 0),
          searchOrganizations(db, context, query.q, 5, 0),
          searchUsers(db, context, query.q, 5, 0),
        ]);

        results = [...clients, ...caregivers, ...visits, ...carePlans, ...organizations, ...users]
          .sort((a, b) => b.relevance - a.relevance)
          .slice(query.offset, query.offset + query.limit);
      } else {
        // Search specific type
        switch (query.type) {
          case 'clients':
            results = await searchClients(db, context, query.q, query.limit, query.offset);
            break;
          case 'caregivers':
            results = await searchCaregivers(db, context, query.q, query.limit, query.offset);
            break;
          case 'visits':
            results = await searchVisits(db, context, query.q, query.limit, query.offset);
            break;
          case 'care_plans':
            results = await searchCarePlans(db, context, query.q, query.limit, query.offset);
            break;
          case 'organizations':
            results = await searchOrganizations(db, context, query.q, query.limit, query.offset);
            break;
          case 'users':
            results = await searchUsers(db, context, query.q, query.limit, query.offset);
            break;
        }
      }

      const response: SearchResponse = {
        results,
        total: results.length,
        query: query.q,
        type: query.type,
        limit: query.limit,
        offset: query.offset,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

  return router;
}
