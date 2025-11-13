/**
 * Tests for getVisitsByCaregiver method
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Pool } from 'pg';
import { ScheduleRepository } from '../schedule-repository.js';

// Mock pool
const mockQuery = vi.fn();
const mockPool = {
  query: mockQuery,
} as unknown as Pool;

// Fixed test dates
const FIXED_DATE = new Date('2024-11-15T10:00:00Z');
const START_DATE = new Date('2024-11-15');
const END_DATE = new Date('2024-11-22');

describe('ScheduleRepository - getVisitsByCaregiver', () => {
  let repository: ScheduleRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new ScheduleRepository(mockPool);
  });

  it('should return visits for a caregiver within date range', async () => {
    const mockVisits = [
      {
        id: 'visit-1',
        organization_id: 'org-1',
        branch_id: 'branch-1',
        client_id: 'client-1',
        pattern_id: 'pattern-1',
        schedule_id: 'schedule-1',
        visit_number: 'V2024-000001',
        visit_type: 'REGULAR',
        service_type_id: 'service-1',
        service_type_name: 'Personal Care',
        scheduled_date: new Date('2024-11-16'),
        scheduled_start_time: '09:00',
        scheduled_end_time: '11:00',
        scheduled_duration: 120,
        timezone: 'America/Chicago',
        actual_start_time: null,
        actual_end_time: null,
        actual_duration: null,
        assigned_caregiver_id: 'caregiver-1',
        assigned_at: FIXED_DATE,
        assigned_by: 'admin-1',
        assignment_method: 'MANUAL',
        address: JSON.stringify({
          line1: '123 Main St',
          city: 'Austin',
          state: 'TX',
          postalCode: '78701',
          country: 'US',
        }),
        location_verification: null,
        task_ids: null,
        required_skills: null,
        required_certifications: null,
        status: 'ASSIGNED',
        status_history: JSON.stringify([]),
        is_urgent: false,
        is_priority: false,
        requires_supervision: false,
        risk_flags: null,
        verification_method: null,
        verification_data: null,
        completion_notes: null,
        tasks_completed: null,
        tasks_total: null,
        incident_reported: null,
        signature_required: true,
        signature_captured: null,
        signature_data: null,
        billable_hours: null,
        billing_status: null,
        billing_notes: null,
        client_instructions: 'Ring doorbell twice',
        caregiver_instructions: 'Client prefers morning visits',
        internal_notes: null,
        tags: null,
        created_at: FIXED_DATE,
        created_by: 'system',
        updated_at: FIXED_DATE,
        updated_by: 'system',
        version: 1,
        deleted_at: null,
        deleted_by: null,
        client_first_name: 'John',
        client_last_name: 'Doe',
        client_phone: JSON.stringify({
          number: '555-0100',
          type: 'MOBILE',
          canReceiveSMS: true,
        }),
      },
    ];

    mockQuery.mockResolvedValueOnce({ rows: mockVisits });

    const result = await repository.getVisitsByCaregiver(
      'caregiver-1',
      START_DATE,
      END_DATE
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'visit-1',
      visitNumber: 'V2024-000001',
      serviceTypeName: 'Personal Care',
      assignedCaregiverId: 'caregiver-1',
      status: 'ASSIGNED',
      clientFirstName: 'John',
      clientLastName: 'Doe',
    });
    expect(result[0]!.clientPhone).toEqual({
      number: '555-0100',
      type: 'MOBILE',
      canReceiveSMS: true,
    });

    // Verify SQL query
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('assigned_caregiver_id = $1'),
      ['caregiver-1', START_DATE, END_DATE]
    );
  });

  it('should return empty array when no visits found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await repository.getVisitsByCaregiver(
      'caregiver-1',
      START_DATE,
      END_DATE
    );

    expect(result).toEqual([]);
  });

  it('should order visits by scheduled date and time', async () => {
    const mockVisits = [
      {
        id: 'visit-2',
        scheduled_date: new Date('2024-11-17'),
        scheduled_start_time: '14:00',
        scheduled_end_time: '16:00',
        // ... minimal required fields
      },
      {
        id: 'visit-1',
        scheduled_date: new Date('2024-11-16'),
        scheduled_start_time: '09:00',
        scheduled_end_time: '11:00',
        // ... minimal required fields
      },
    ];

    mockQuery.mockResolvedValueOnce({ rows: mockVisits });

    await repository.getVisitsByCaregiver('caregiver-1', START_DATE, END_DATE);

    // Verify ORDER BY clause in SQL
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY v.scheduled_date ASC, v.scheduled_start_time ASC'),
      expect.any(Array)
    );
  });

  it('should join with clients table for client information', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await repository.getVisitsByCaregiver('caregiver-1', START_DATE, END_DATE);

    // Verify JOIN with clients table
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('LEFT JOIN clients c ON v.client_id = c.id'),
      expect.any(Array)
    );
  });
});
